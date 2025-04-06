/*
  # Add status columns to maintenance_visits table

  1. Changes
    - Add visit_status column to maintenance_visits table
    - Add equipment_status column to maintenance_visits table
    - Set default values for new columns
    - Add check constraints to ensure valid status values

  2. Security
    - Maintain existing RLS policies
*/

-- Add visit_status column with check constraint
ALTER TABLE maintenance_visits
ADD COLUMN visit_status text NOT NULL DEFAULT 'Attended'
CHECK (visit_status IN ('Attended', 'Closed'));

-- Add equipment_status column with check constraint
ALTER TABLE maintenance_visits
ADD COLUMN equipment_status text NOT NULL DEFAULT 'Working'
CHECK (equipment_status IN ('Breakdown', 'Working'));

-- Add comment to explain valid values
COMMENT ON COLUMN maintenance_visits.visit_status IS 'Valid values: Attended, Closed';
COMMENT ON COLUMN maintenance_visits.equipment_status IS 'Valid values: Breakdown, Working';