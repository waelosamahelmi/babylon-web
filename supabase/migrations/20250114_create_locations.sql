-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(500) NOT NULL,
  city VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20),
  icon VARCHAR(100) DEFAULT 'MapPin',
  logo_url VARCHAR(500),
  region VARCHAR(100),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_locations_city ON locations(city);
CREATE INDEX idx_locations_region ON locations(region);
CREATE INDEX idx_locations_active ON locations(is_active);
CREATE INDEX idx_locations_order ON locations(display_order);

-- Insert initial data
INSERT INTO locations (name, address, city, postal_code, icon, region, display_order) VALUES
-- Lahti
('K-Citymarket Karisma', 'Kauppiaankatu 2', 'Lahti', '15160', 'Store', 'Lahti', 1),
('K-Citymarket Paavola', 'Kauppakatu 13', 'Lahti', '15140', 'Store', 'Lahti', 2),
('K-Citymarket Laune', 'Ajokatu 53', 'Lahti', '15500', 'Store', 'Lahti', 3),
('K-Citymarket Heinola', 'Hevossaarentie 1', 'Heinola', '18100', 'Store', 'Lahti', 4),

-- Kouvola
('K-Citymarket Kouvola', 'Tervasharjunkatu 1', 'Kouvola', '45720', 'Store', 'Kouvola', 5),

-- Osuuskauppa Hämeenmaa
('Wolt Market Lahti', 'Vesijärvenkatu 32', 'Lahti', '15140', 'ShoppingBag', 'Osuuskauppa Hämeenmaa', 6),
('SM Sokos', 'Aleksanterinkatu 19', 'Lahti', '15140', 'Building2', 'Osuuskauppa Hämeenmaa', 7),
('Prisma Laune', 'Ajokatu 83', 'Lahti', '15610', 'ShoppingCart', 'Osuuskauppa Hämeenmaa', 8),

-- Osuuskauppa Kotka
('Prisma Kotka', 'Hakamäentie 1', 'Kotka', '48400', 'ShoppingCart', 'Osuuskauppa Kotka', 9),

-- Osuuskauppa Mikkeli
('Prisma Mikkeli', 'Graanintie 1', 'Mikkeli', '50190', 'ShoppingCart', 'Osuuskauppa Mikkeli', 10),

-- Pirkanmaan Osuuskauppa
('Pirkanmaan Osuuskauppa', 'Lempääläntie 21', 'Tampere', '33820', 'Building', 'Pirkanmaan Osuuskauppa', 11),

-- Kerava
('K-Citymarket Kerava', 'Nikonkatu 1', 'Kerava', '04200', 'Store', 'Kerava', 12);

-- Enable RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON locations
  FOR SELECT USING (is_active = true);

CREATE POLICY "Enable all access for authenticated users" ON locations
  FOR ALL USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_locations_timestamp
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_locations_updated_at();

-- Grant permissions
GRANT SELECT ON locations TO anon;
GRANT ALL ON locations TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE locations_id_seq TO authenticated;
