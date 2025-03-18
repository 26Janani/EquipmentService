/*
  # Medical Equipment Management Schema

  1. New Tables
    - `medical_equipment`
      - `id` (uuid, primary key)
      - `name` (text) - Name of the equipment
      - `model` (text) - Model number
      - `manufacturer` (text) - Manufacturer name
      - `purchase_date` (date) - Date of purchase
      - `last_maintenance` (date) - Last maintenance date
      - `next_maintenance` (date) - Next scheduled maintenance
      - `status` (text) - Current status (Active/Maintenance/Retired)
      - `location` (text) - Current location/department
      - `serial_number` (text) - Unique serial number
      - `created_at` (timestamp)
      - `user_id` (uuid) - Reference to auth.users

  2. Security
    - Enable RLS on medical_equipment table
    - Add policies for CRUD operations
*/

CREATE TABLE medical_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  model text,
  manufacturer text,
  purchase_date date,
  last_maintenance date,
  next_maintenance date,
  status text DEFAULT 'Active',
  location text,
  serial_number text,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE medical_equipment ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view all equipment"
  ON medical_equipment
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own equipment"
  ON medical_equipment
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own equipment"
  ON medical_equipment
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own equipment"
  ON medical_equipment
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);