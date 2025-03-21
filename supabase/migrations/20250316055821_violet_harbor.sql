/*
  # Medical Equipment Maintenance Schema

  1. New Tables
    - `equipment`
      - `id` (uuid, primary key)
      - `name` (text)
      - `details` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `customers`
      - `id` (uuid, primary key)
      - `name` (text)
      - `address` (text)
      - `phone` (text)
      - `email` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `maintenance_records`
      - `id` (uuid, primary key)
      - `equipment_id` (uuid, foreign key)
      - `customer_id` (uuid, foreign key)
      - `last_service_date` (timestamp)
      - `next_service_date` (timestamp)
      - `notes` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `reminders`
      - `id` (uuid, primary key)
      - `maintenance_id` (uuid, foreign key)
      - `reminder_date` (timestamp)
      - `status` (text)
      - `type` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Equipment table
CREATE TABLE equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  details text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Customers table
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Maintenance records table
CREATE TABLE maintenance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid REFERENCES equipment(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  last_service_date timestamptz NOT NULL,
  next_service_date timestamptz NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Reminders table
CREATE TABLE reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_id uuid REFERENCES maintenance_records(id) ON DELETE CASCADE,
  reminder_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow full access to authenticated users" ON equipment
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow full access to authenticated users" ON customers
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow full access to authenticated users" ON maintenance_records
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow full access to authenticated users" ON reminders
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updating timestamps
CREATE TRIGGER update_equipment_timestamp
  BEFORE UPDATE ON equipment
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_customers_timestamp
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_maintenance_records_timestamp
  BEFORE UPDATE ON maintenance_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_reminders_timestamp
  BEFORE UPDATE ON reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();