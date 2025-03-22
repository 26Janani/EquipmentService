/*
  # Add amount field to maintenance records

  1. Changes
    - Add amount column to maintenance_records table
    - Set default value to 0
    - Make it not null to ensure data consistency

  2. Security
    - Maintain existing RLS policies
*/

ALTER TABLE maintenance_records
ADD COLUMN amount decimal(10,2) NOT NULL DEFAULT 0.00;