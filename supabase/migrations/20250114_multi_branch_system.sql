-- Multi-Branch System Migration
-- This migration updates the system to support multiple restaurant branches
-- with independent opening hours and order management

-- Step 1: Add opening_hours JSON column to branches table
ALTER TABLE branches ADD COLUMN IF NOT EXISTS opening_hours JSONB;

-- Step 2: Add default opening hours structure to existing branches
-- Format: { "monday": {"open": "08:30", "close": "21:00", "closed": false}, ... }
UPDATE branches SET opening_hours = jsonb_build_object(
  'monday', jsonb_build_object('open', '10:30', 'close', '21:00', 'closed', false),
  'tuesday', jsonb_build_object('open', '10:30', 'close', '21:00', 'closed', false),
  'wednesday', jsonb_build_object('open', '10:30', 'close', '21:00', 'closed', false),
  'thursday', jsonb_build_object('open', '10:30', 'close', '21:00', 'closed', false),
  'friday', jsonb_build_object('open', '10:30', 'close', '21:00', 'closed', false),
  'saturday', jsonb_build_object('open', '10:30', 'close', '21:00', 'closed', false),
  'sunday', jsonb_build_object('open', '10:30', 'close', '21:00', 'closed', false)
) WHERE opening_hours IS NULL;

-- Step 3: Add branch_id to orders table if not exists
ALTER TABLE orders ADD COLUMN IF NOT EXISTS branch_id INTEGER REFERENCES branches(id);

-- Step 4: Add index for faster branch-based queries
CREATE INDEX IF NOT EXISTS idx_orders_branch_id ON orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_branches_active ON branches(is_active);

-- Step 5: Add branch_id to menu_items for branch-specific menu (optional)
-- This allows different branches to have different menu items
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS branch_id INTEGER REFERENCES branches(id);
CREATE INDEX IF NOT EXISTS idx_menu_items_branch_id ON menu_items(branch_id);

-- Step 6: Create helper function to get branch status
CREATE OR REPLACE FUNCTION get_branch_status(branch_id_param INTEGER)
RETURNS TABLE (
  is_open BOOLEAN,
  next_opening_time TEXT,
  current_day TEXT
) AS $$
DECLARE
  branch_hours JSONB;
  current_day_name TEXT;
  day_hours JSONB;
  current_time_val TIME;
  open_time TIME;
  close_time TIME;
  is_closed BOOLEAN;
BEGIN
  -- Get current day name in lowercase
  current_day_name := LOWER(TO_CHAR(CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Helsinki', 'Day'));
  current_day_name := TRIM(current_day_name);
  
  -- Get current time in Helsinki timezone
  current_time_val := (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Helsinki')::TIME;
  
  -- Get branch opening hours
  SELECT b.opening_hours INTO branch_hours
  FROM branches b
  WHERE b.id = branch_id_param AND b.is_active = true;
  
  IF branch_hours IS NULL THEN
    RETURN QUERY SELECT false, 'Unknown'::TEXT, current_day_name;
    RETURN;
  END IF;
  
  -- Get today's hours
  day_hours := branch_hours -> current_day_name;
  
  IF day_hours IS NULL THEN
    RETURN QUERY SELECT false, 'Unknown'::TEXT, current_day_name;
    RETURN;
  END IF;
  
  -- Parse hours
  is_closed := (day_hours ->> 'closed')::BOOLEAN;
  
  IF is_closed THEN
    RETURN QUERY SELECT false, 'Closed today'::TEXT, current_day_name;
    RETURN;
  END IF;
  
  open_time := (day_hours ->> 'open')::TIME;
  close_time := (day_hours ->> 'close')::TIME;
  
  -- Check if currently open
  IF current_time_val >= open_time AND current_time_val <= close_time THEN
    RETURN QUERY SELECT true, close_time::TEXT, current_day_name;
  ELSE
    RETURN QUERY SELECT false, open_time::TEXT, current_day_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create function to find nearest branch by postal code/city
CREATE OR REPLACE FUNCTION find_nearest_branch(
  delivery_city TEXT,
  delivery_postal_code TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  branch_id_result INTEGER;
BEGIN
  -- First try exact city match
  SELECT id INTO branch_id_result
  FROM branches
  WHERE is_active = true 
    AND LOWER(city) = LOWER(delivery_city)
  ORDER BY display_order ASC
  LIMIT 1;
  
  IF branch_id_result IS NOT NULL THEN
    RETURN branch_id_result;
  END IF;
  
  -- If no exact match, return first active branch
  SELECT id INTO branch_id_result
  FROM branches
  WHERE is_active = true
  ORDER BY display_order ASC
  LIMIT 1;
  
  RETURN branch_id_result;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Update RLS policies for branches table
DROP POLICY IF EXISTS "Enable read access for all users" ON branches;
CREATE POLICY "Enable read access for all users" ON branches
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON branches;
CREATE POLICY "Enable all access for authenticated users" ON branches
  FOR ALL USING (auth.role() = 'authenticated');

-- Step 9: Assign existing orders to default branch (Lahti)
UPDATE orders SET branch_id = 1 WHERE branch_id IS NULL;

-- Step 10: Make menu items available to all branches by default (NULL = all branches)
-- Only set branch_id if you want menu item exclusive to that branch

COMMENT ON COLUMN menu_items.branch_id IS 'NULL means available in all branches. Set specific branch_id to make exclusive.';

-- Step 11: Create view for active branches with current status
CREATE OR REPLACE VIEW branches_with_status AS
SELECT 
  b.*,
  (SELECT is_open FROM get_branch_status(b.id)) as is_currently_open
FROM branches b
WHERE b.is_active = true
ORDER BY b.display_order;

-- Grant permissions
GRANT SELECT ON branches_with_status TO anon, authenticated;

-- Step 12: Add trigger to update branch updated_at
CREATE OR REPLACE FUNCTION update_branches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_branches_timestamp ON branches;
CREATE TRIGGER update_branches_timestamp
  BEFORE UPDATE ON branches
  FOR EACH ROW
  EXECUTE FUNCTION update_branches_updated_at();

-- Migration complete!
-- Summary:
-- 1. Added opening_hours JSONB column to branches
-- 2. Populated with default hours (10:30-21:00)
-- 3. Added branch_id to orders table
-- 4. Added branch_id to menu_items (optional, NULL = all branches)
-- 5. Created helper functions for branch status and branch selection
-- 6. Updated RLS policies
-- 7. Created view for easy branch status querying
