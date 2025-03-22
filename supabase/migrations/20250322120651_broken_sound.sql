/*
  # Add Visit Details to Maintenance Records

  1. New Tables
    - `maintenance_visits`
      - `id` (uuid, primary key)
      - `maintenance_record_id` (uuid, foreign key)
      - `visit_date` (timestamptz)
      - `work_done` (text)
      - `attended_by` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on maintenance_visits table
    - Add policies for authenticated users
*/

-- Create maintenance visits table
CREATE TABLE maintenance_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_record_id uuid REFERENCES maintenance_records(id) ON DELETE CASCADE,
  visit_date timestamptz NOT NULL,
  work_done text NOT NULL,
  attended_by text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE maintenance_visits ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow select for authenticated users" ON maintenance_visits
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow insert for authenticated users" ON maintenance_visits
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON maintenance_visits
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete for authenticated users" ON maintenance_visits
  FOR DELETE TO authenticated
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_maintenance_visits_timestamp
  BEFORE UPDATE ON maintenance_visits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create index for better performance
CREATE INDEX idx_maintenance_visits_record ON maintenance_visits(maintenance_record_id);