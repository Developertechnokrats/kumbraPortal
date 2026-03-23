/*
  # Add Client Address, Date of Birth, and Company Incorporation Date Fields

  1. Schema Changes
    - Add new fields to `clients` table:
      - `address_line1` (text) - Primary street address
      - `address_line2` (text) - Secondary address (optional)
      - `city` (text) - City/suburb
      - `state` (text) - State/province
      - `postcode` (text) - Postal/ZIP code
      - `date_of_birth` (date) - Date of birth for individual accounts
      - `date_of_birth_holder2` (date) - Date of birth for second holder in joint accounts
      - `company_incorporation_date` (date) - Company incorporation date for corporate accounts

  2. Purpose
    - Enable complete address capture during client onboarding
    - Store date of birth for KYC/compliance purposes
    - Track company incorporation date for corporate entities
    - Support multi-holder account types (joint accounts)

  3. Security
    - All fields are optional (nullable) to maintain backward compatibility
    - Existing clients won't be affected
    - Data can be populated during client creation or updated later
*/

DO $$
BEGIN
  -- Address fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'address_line1') THEN
    ALTER TABLE clients ADD COLUMN address_line1 text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'address_line2') THEN
    ALTER TABLE clients ADD COLUMN address_line2 text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'city') THEN
    ALTER TABLE clients ADD COLUMN city text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'state') THEN
    ALTER TABLE clients ADD COLUMN state text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'postcode') THEN
    ALTER TABLE clients ADD COLUMN postcode text;
  END IF;
  
  -- Date of birth fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'date_of_birth') THEN
    ALTER TABLE clients ADD COLUMN date_of_birth date;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'date_of_birth_holder2') THEN
    ALTER TABLE clients ADD COLUMN date_of_birth_holder2 date;
  END IF;
  
  -- Company incorporation date
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'company_incorporation_date') THEN
    ALTER TABLE clients ADD COLUMN company_incorporation_date date;
  END IF;
END $$;
