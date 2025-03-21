/*
  # Update RLS Policies

  1. Changes
    - Update RLS policies for all tables to explicitly allow INSERT operations
    - Ensure authenticated users can perform all operations

  2. Security
    - Maintain RLS enabled on all tables
    - Add specific policies for INSERT operations
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON customers;
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON equipment;
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON maintenance_records;
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON reminders;

-- Create new policies with explicit operations
CREATE POLICY "Allow select for authenticated users" ON customers
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow insert for authenticated users" ON customers
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON customers
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete for authenticated users" ON customers
  FOR DELETE TO authenticated
  USING (true);

-- Equipment policies
CREATE POLICY "Allow select for authenticated users" ON equipment
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow insert for authenticated users" ON equipment
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON equipment
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete for authenticated users" ON equipment
  FOR DELETE TO authenticated
  USING (true);

-- Maintenance records policies
CREATE POLICY "Allow select for authenticated users" ON maintenance_records
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow insert for authenticated users" ON maintenance_records
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON maintenance_records
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete for authenticated users" ON maintenance_records
  FOR DELETE TO authenticated
  USING (true);

-- Reminders policies
CREATE POLICY "Allow select for authenticated users" ON reminders
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow insert for authenticated users" ON reminders
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON reminders
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete for authenticated users" ON reminders
  FOR DELETE TO authenticated
  USING (true);