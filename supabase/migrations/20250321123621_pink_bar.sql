/*
  # Add new fields to tables

  1. Changes
    - Add new fields to customers table
    - Add new fields to equipment table
    - Add new fields to maintenance_records table
    - Add email notification function
    - Add trigger for email notifications

  2. Security
    - Maintain existing RLS policies
*/

-- Add new fields to customers table
ALTER TABLE customers
ADD COLUMN bio_medical_email text NOT NULL DEFAULT '',
ADD COLUMN bio_medical_contact text NOT NULL DEFAULT '',
ADD COLUMN bio_medical_hod_name text NOT NULL DEFAULT '',
ADD COLUMN notes text;

-- Add new fields to equipment table
ALTER TABLE equipment
ADD COLUMN model_number text NOT NULL DEFAULT '',
ADD COLUMN notes text;

-- Add new fields to maintenance_records table
ALTER TABLE maintenance_records
ADD COLUMN serial_no text NOT NULL DEFAULT '',
ADD COLUMN installation_date timestamptz,
ADD COLUMN warranty_end_date timestamptz,
ADD COLUMN service_status text NOT NULL DEFAULT 'pending',
ADD COLUMN service_start_date timestamptz,
ADD COLUMN service_end_date timestamptz;

-- Create a function to calculate age in years and months
CREATE OR REPLACE FUNCTION calculate_age(installation_date timestamptz)
RETURNS text AS $$
DECLARE
  years int;
  months int;
  age_text text;
BEGIN
  years := DATE_PART('year', age(CURRENT_DATE, installation_date::date));
  months := DATE_PART('month', age(CURRENT_DATE, installation_date::date));
  
  IF years = 0 THEN
    age_text := months || ' month' || CASE WHEN months != 1 THEN 's' ELSE '' END;
  ELSE
    age_text := years || ' year' || CASE WHEN years != 1 THEN 's' ELSE '' END ||
                CASE WHEN months > 0 THEN ' ' || months || ' month' || CASE WHEN months != 1 THEN 's' ELSE '' END
                ELSE '' END;
  END IF;
  
  RETURN age_text;
END;
$$ LANGUAGE plpgsql;

-- Create a function to send email notifications
CREATE OR REPLACE FUNCTION send_service_reminder()
RETURNS trigger AS $$
DECLARE
  company_email text := 'jananisrinivasan11@gmail.com';
  days_before int;
BEGIN
  -- Check if this is a relevant date for notification (30, 20, or 10 days before)
  days_before := DATE_PART('day', NEW.service_end_date - CURRENT_DATE);
  
  IF days_before IN (30, 20, 10) THEN
    -- Send customer notification
    PERFORM net.http_post(
      url := 'https://api.sendgrid.com/v3/mail/send',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.sendgrid_key'),
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'personalizations', jsonb_build_array(
          jsonb_build_object(
            'to', jsonb_build_array(jsonb_build_object('email', (SELECT bio_medical_email FROM customers WHERE id = NEW.customer_id))),
            'cc', jsonb_build_array(jsonb_build_object('email', company_email))
          )
        ),
        'from', jsonb_build_object('email', company_email),
        'subject', 'Service Reminder: ' || days_before || ' days until service end',
        'content', jsonb_build_array(
          jsonb_build_object(
            'type', 'text/html',
            'value', format(
              'Service reminder for your equipment:<br><br>
              Equipment: %s<br>
              Model Number: %s<br>
              Serial No: %s<br>
              Installation Date: %s<br>
              Age of Equipment: %s<br>
              Warranty End Date: %s<br>
              Service Status: %s<br>
              Service Start Date: %s<br>
              Service End Date: %s',
              (SELECT name FROM equipment WHERE id = NEW.equipment_id),
              (SELECT model_number FROM equipment WHERE id = NEW.equipment_id),
              NEW.serial_no,
              NEW.installation_date,
              calculate_age(NEW.installation_date),
              NEW.warranty_end_date,
              NEW.service_status,
              NEW.service_start_date,
              NEW.service_end_date
            )
          )
        )
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for email notifications
CREATE TRIGGER service_reminder_trigger
  AFTER INSERT OR UPDATE OF service_end_date
  ON maintenance_records
  FOR EACH ROW
  EXECUTE FUNCTION send_service_reminder();

-- Add indexes for better query performance
CREATE INDEX idx_maintenance_customer ON maintenance_records(customer_id);
CREATE INDEX idx_maintenance_equipment ON maintenance_records(equipment_id);
CREATE INDEX idx_maintenance_dates ON maintenance_records(installation_date, warranty_end_date, service_start_date, service_end_date);