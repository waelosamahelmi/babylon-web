-- Enhanced Payment System Migration V2
-- Clean migration that handles existing tables

-- Drop triggers first (before dropping tables)
DO $$
BEGIN
    DROP TRIGGER IF EXISTS trigger_update_payment_analytics ON orders;
    DROP TRIGGER IF EXISTS trigger_generate_receipt_number ON payment_receipts;
    DROP TRIGGER IF EXISTS trigger_customers_updated_at ON customers;
    DROP TRIGGER IF EXISTS trigger_saved_payment_methods_updated_at ON saved_payment_methods;
    DROP TRIGGER IF EXISTS trigger_payment_attempts_updated_at ON payment_attempts;
EXCEPTION
    WHEN undefined_table THEN NULL;
    WHEN undefined_object THEN NULL;
END $$;

-- Drop payment-specific functions only (don't drop shared functions)
DROP FUNCTION IF EXISTS update_payment_analytics();
DROP FUNCTION IF EXISTS generate_receipt_number();
-- Note: update_updated_at_column() is shared with other tables, so we don't drop it

-- Drop existing payment tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS payment_receipts CASCADE;
DROP TABLE IF EXISTS payment_attempts CASCADE;
DROP TABLE IF EXISTS payment_analytics CASCADE;
DROP TABLE IF EXISTS saved_payment_methods CASCADE;

-- Don't drop customers table - it already exists from fix-restaurant-config-and-features.sql
-- Instead, add Stripe-related columns if they don't exist
DO $$
BEGIN
  -- Add stripe_customer_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='customers' AND column_name='stripe_customer_id') THEN
    ALTER TABLE customers ADD COLUMN stripe_customer_id TEXT UNIQUE;
  END IF;

  -- Add metadata column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='customers' AND column_name='metadata') THEN
    ALTER TABLE customers ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create saved_payment_methods table
CREATE TABLE saved_payment_methods (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create payment_attempts table (using TEXT for order_id to support both integer and uuid)
CREATE TABLE payment_attempts (
  id SERIAL PRIMARY KEY,
  order_id TEXT NOT NULL,
  stripe_payment_intent_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'eur',
  status TEXT NOT NULL,
  error_code TEXT,
  error_message TEXT,
  payment_method_type TEXT,
  attempt_number INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create payment_analytics table
CREATE TABLE payment_analytics (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  total_attempts INTEGER DEFAULT 0,
  successful_payments INTEGER DEFAULT 0,
  failed_payments INTEGER DEFAULT 0,
  canceled_payments INTEGER DEFAULT 0,
  total_amount DECIMAL(10, 2) DEFAULT 0,
  refunded_amount DECIMAL(10, 2) DEFAULT 0,
  payment_method_breakdown JSONB DEFAULT '{}'::jsonb,
  average_transaction_amount DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create payment_receipts table (using TEXT for order_id to support both integer and uuid)
CREATE TABLE payment_receipts (
  id SERIAL PRIMARY KEY,
  order_id TEXT NOT NULL,
  receipt_number TEXT NOT NULL UNIQUE,
  receipt_url TEXT,
  pdf_url TEXT,
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add new columns to orders table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='customer_id') THEN
    ALTER TABLE orders ADD COLUMN customer_id INTEGER REFERENCES customers(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='saved_payment_method_id') THEN
    ALTER TABLE orders ADD COLUMN saved_payment_method_id INTEGER REFERENCES saved_payment_methods(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_retry_count') THEN
    ALTER TABLE orders ADD COLUMN payment_retry_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='last_payment_error') THEN
    ALTER TABLE orders ADD COLUMN last_payment_error JSONB;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_stripe_id ON customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_saved_payment_methods_customer ON saved_payment_methods(customer_id);
CREATE INDEX IF NOT EXISTS idx_saved_payment_methods_stripe_id ON saved_payment_methods(stripe_payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_order ON payment_attempts(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_intent ON payment_attempts(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_status ON payment_attempts(status);
CREATE INDEX IF NOT EXISTS idx_payment_analytics_date ON payment_analytics(date);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_order ON payment_receipts(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_number ON payment_receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_intent ON orders(stripe_payment_intent_id);

-- Create functions
CREATE FUNCTION update_payment_analytics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO payment_analytics (date, total_attempts, successful_payments, failed_payments, total_amount)
  VALUES (
    CURRENT_DATE,
    1,
    CASE WHEN NEW.payment_status = 'paid' THEN 1 ELSE 0 END,
    CASE WHEN NEW.payment_status = 'failed' THEN 1 ELSE 0 END,
    CASE WHEN NEW.payment_status = 'paid' THEN NEW.total_amount ELSE 0 END
  )
  ON CONFLICT (date) DO UPDATE SET
    total_attempts = payment_analytics.total_attempts + 1,
    successful_payments = payment_analytics.successful_payments + CASE WHEN NEW.payment_status = 'paid' THEN 1 ELSE 0 END,
    failed_payments = payment_analytics.failed_payments + CASE WHEN NEW.payment_status = 'failed' THEN 1 ELSE 0 END,
    total_amount = payment_analytics.total_amount + CASE WHEN NEW.payment_status = 'paid' THEN NEW.total_amount ELSE 0 END,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION generate_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.receipt_number IS NULL THEN
    NEW.receipt_number := 'RCP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEW.id::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update_updated_at_column function if it doesn't exist
-- This function is shared with other tables (orders, restaurant_settings, etc.)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_payment_analytics
  AFTER INSERT OR UPDATE OF payment_status ON orders
  FOR EACH ROW
  WHEN (NEW.payment_method = 'online' OR NEW.payment_method = 'stripe')
  EXECUTE FUNCTION update_payment_analytics();

CREATE TRIGGER trigger_generate_receipt_number
  BEFORE INSERT ON payment_receipts
  FOR EACH ROW
  EXECUTE FUNCTION generate_receipt_number();

CREATE TRIGGER trigger_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_saved_payment_methods_updated_at
  BEFORE UPDATE ON saved_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_payment_attempts_updated_at
  BEFORE UPDATE ON payment_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (customers table already has RLS from fix-restaurant-config-and-features.sql)
ALTER TABLE saved_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_receipts ENABLE ROW LEVEL SECURITY;

-- RLS Policies (skip customers policies - they already exist)
CREATE POLICY saved_payment_methods_select_own ON saved_payment_methods
  FOR SELECT USING (customer_id IN (SELECT id FROM customers WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY saved_payment_methods_insert_own ON saved_payment_methods
  FOR INSERT WITH CHECK (customer_id IN (SELECT id FROM customers WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY saved_payment_methods_delete_own ON saved_payment_methods
  FOR DELETE USING (customer_id IN (SELECT id FROM customers WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY payment_analytics_select ON payment_analytics
  FOR SELECT USING (true);

CREATE POLICY payment_receipts_select ON payment_receipts
  FOR SELECT USING (order_id::TEXT IN (SELECT id::TEXT FROM orders WHERE customer_email = current_setting('request.jwt.claims', true)::json->>'email'));

-- Grant permissions (skip customers - already has permissions from fix-restaurant-config-and-features.sql)
GRANT SELECT, INSERT, UPDATE, DELETE ON saved_payment_methods TO authenticated;
GRANT SELECT, INSERT, UPDATE ON payment_attempts TO authenticated;
GRANT SELECT ON payment_analytics TO authenticated;
GRANT SELECT, INSERT ON payment_receipts TO authenticated;
GRANT SELECT ON payment_receipts TO anon;

-- Comments (skip customers - already has comment from fix-restaurant-config-and-features.sql)
COMMENT ON TABLE saved_payment_methods IS 'Stores saved payment methods for faster checkout';
COMMENT ON TABLE payment_attempts IS 'Tracks all payment attempts for analytics and debugging';
COMMENT ON TABLE payment_analytics IS 'Daily aggregated payment metrics and statistics';
COMMENT ON TABLE payment_receipts IS 'Stores payment receipts and tracks email delivery';

-- Initialize analytics for last 30 days
INSERT INTO payment_analytics (date)
SELECT generate_series(CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, INTERVAL '1 day')::DATE
ON CONFLICT (date) DO NOTHING;
