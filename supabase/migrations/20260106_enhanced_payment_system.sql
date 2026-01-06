-- Enhanced Payment System Migration
-- Adds support for saved payment methods, customers, payment analytics, and receipts

-- Create customers table for storing Stripe customer info
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  phone TEXT,
  stripe_customer_id TEXT UNIQUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create saved_payment_methods table
CREATE TABLE IF NOT EXISTS saved_payment_methods (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL, -- 'card', 'sepa_debit', etc.
  card_brand TEXT, -- 'visa', 'mastercard', etc.
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create payment_attempts table for tracking retry logic
CREATE TABLE IF NOT EXISTS payment_attempts (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'eur',
  status TEXT NOT NULL, -- 'pending', 'processing', 'succeeded', 'failed', 'canceled'
  error_code TEXT,
  error_message TEXT,
  payment_method_type TEXT,
  attempt_number INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create payment_analytics table for tracking payment metrics
CREATE TABLE IF NOT EXISTS payment_analytics (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  total_attempts INTEGER DEFAULT 0,
  successful_payments INTEGER DEFAULT 0,
  failed_payments INTEGER DEFAULT 0,
  canceled_payments INTEGER DEFAULT 0,
  total_amount DECIMAL(10, 2) DEFAULT 0,
  refunded_amount DECIMAL(10, 2) DEFAULT 0,
  payment_method_breakdown JSONB DEFAULT '{}'::jsonb, -- { "card": 10, "klarna": 5, etc }
  average_transaction_amount DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(date)
);

-- Create payment_receipts table
CREATE TABLE IF NOT EXISTS payment_receipts (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL UNIQUE,
  receipt_url TEXT, -- Stripe receipt URL
  pdf_url TEXT, -- Custom PDF receipt URL
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add new columns to orders table if they don't exist
DO $$
BEGIN
  -- Add customer_id for linking to customers table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='orders' AND column_name='customer_id') THEN
    ALTER TABLE orders ADD COLUMN customer_id INTEGER REFERENCES customers(id);
  END IF;

  -- Add saved_payment_method_id for tracking which saved method was used
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='orders' AND column_name='saved_payment_method_id') THEN
    ALTER TABLE orders ADD COLUMN saved_payment_method_id INTEGER REFERENCES saved_payment_methods(id);
  END IF;

  -- Add payment_retry_count
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='orders' AND column_name='payment_retry_count') THEN
    ALTER TABLE orders ADD COLUMN payment_retry_count INTEGER DEFAULT 0;
  END IF;

  -- Add last_payment_error for storing error details
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='orders' AND column_name='last_payment_error') THEN
    ALTER TABLE orders ADD COLUMN last_payment_error JSONB;
  END IF;

  -- Update payment_status to support new statuses
  -- Note: This doesn't change the column type, just documents supported values
  -- Supported: 'pending', 'processing', 'paid', 'failed', 'canceled', 'refunded', 'partially_refunded'
END $$;

-- Create indexes for better query performance
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

-- Create function to update payment analytics daily
CREATE OR REPLACE FUNCTION update_payment_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update analytics for today
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
    successful_payments = payment_analytics.successful_payments +
      CASE WHEN NEW.payment_status = 'paid' THEN 1 ELSE 0 END,
    failed_payments = payment_analytics.failed_payments +
      CASE WHEN NEW.payment_status = 'failed' THEN 1 ELSE 0 END,
    total_amount = payment_analytics.total_amount +
      CASE WHEN NEW.payment_status = 'paid' THEN NEW.total_amount ELSE 0 END,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update analytics on order payment status change
DROP TRIGGER IF EXISTS trigger_update_payment_analytics ON orders;
CREATE TRIGGER trigger_update_payment_analytics
  AFTER INSERT OR UPDATE OF payment_status
  ON orders
  FOR EACH ROW
  WHEN (NEW.payment_method = 'online' OR NEW.payment_method = 'stripe')
  EXECUTE FUNCTION update_payment_analytics();

-- Create function to automatically generate receipt numbers
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.receipt_number IS NULL THEN
    NEW.receipt_number := 'RCP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEW.id::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating receipt numbers
DROP TRIGGER IF EXISTS trigger_generate_receipt_number ON payment_receipts;
CREATE TRIGGER trigger_generate_receipt_number
  BEFORE INSERT ON payment_receipts
  FOR EACH ROW
  EXECUTE FUNCTION generate_receipt_number();

-- Create function to update customer updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS trigger_customers_updated_at ON customers;
CREATE TRIGGER trigger_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_saved_payment_methods_updated_at ON saved_payment_methods;
CREATE TRIGGER trigger_saved_payment_methods_updated_at
  BEFORE UPDATE ON saved_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_payment_attempts_updated_at ON payment_attempts;
CREATE TRIGGER trigger_payment_attempts_updated_at
  BEFORE UPDATE ON payment_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions for authenticated users (adjust as needed)
GRANT SELECT, INSERT, UPDATE ON customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON saved_payment_methods TO authenticated;
GRANT SELECT, INSERT, UPDATE ON payment_attempts TO authenticated;
GRANT SELECT ON payment_analytics TO authenticated;
GRANT SELECT, INSERT ON payment_receipts TO authenticated;

-- Grant permissions for anonymous users (public orders)
GRANT SELECT ON payment_receipts TO anon;

-- Add RLS (Row Level Security) policies
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_receipts ENABLE ROW LEVEL SECURITY;

-- Customers: users can only see their own data
CREATE POLICY customers_select_own ON customers
  FOR SELECT USING (email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY customers_insert_own ON customers
  FOR INSERT WITH CHECK (email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY customers_update_own ON customers
  FOR UPDATE USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Saved payment methods: users can only see their own
CREATE POLICY saved_payment_methods_select_own ON saved_payment_methods
  FOR SELECT USING (
    customer_id IN (
      SELECT id FROM customers
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

CREATE POLICY saved_payment_methods_insert_own ON saved_payment_methods
  FOR INSERT WITH CHECK (
    customer_id IN (
      SELECT id FROM customers
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

CREATE POLICY saved_payment_methods_delete_own ON saved_payment_methods
  FOR DELETE USING (
    customer_id IN (
      SELECT id FROM customers
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

-- Payment analytics: read-only for authenticated users
CREATE POLICY payment_analytics_select ON payment_analytics
  FOR SELECT USING (true);

-- Payment receipts: users can see receipts for their orders
CREATE POLICY payment_receipts_select ON payment_receipts
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders
      WHERE customer_email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

-- Comment the tables
COMMENT ON TABLE customers IS 'Stores customer information and links to Stripe Customer objects';
COMMENT ON TABLE saved_payment_methods IS 'Stores saved payment methods for faster checkout';
COMMENT ON TABLE payment_attempts IS 'Tracks all payment attempts for analytics and debugging';
COMMENT ON TABLE payment_analytics IS 'Daily aggregated payment metrics and statistics';
COMMENT ON TABLE payment_receipts IS 'Stores payment receipts and tracks email delivery';

-- Insert initial data for payment analytics (last 30 days)
INSERT INTO payment_analytics (date)
SELECT generate_series(
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE,
  INTERVAL '1 day'
)::DATE
ON CONFLICT (date) DO NOTHING;
