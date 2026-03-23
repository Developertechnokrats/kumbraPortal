/*
  # Add Missing Client Fields and Update Defaults

  1. Changes
    - Add address fields (address_line1, address_line2, city, state, postcode)
    - Add date fields (date_of_birth, date_of_birth_holder2, company_incorporation_date, member_since)
    - Add location fields (country_of_residence, tax_residency)
    - Add advisor and profile fields (assigned_advisor_name, risk_profile, kyc_documents_approved)
    - Add payment_reference_code field
    - Change default currency from GBP to USD
    - Update system config to use UK/Europe banks and USD defaults
*/

-- Add address fields
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS address_line1 TEXT,
ADD COLUMN IF NOT EXISTS address_line2 TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS postcode TEXT;

-- Add date fields
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS date_of_birth_holder2 DATE,
ADD COLUMN IF NOT EXISTS company_incorporation_date DATE,
ADD COLUMN IF NOT EXISTS member_since DATE DEFAULT CURRENT_DATE;

-- Add location fields
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS country_of_residence TEXT DEFAULT 'United Kingdom',
ADD COLUMN IF NOT EXISTS tax_residency TEXT DEFAULT 'United Kingdom';

-- Add profile and advisor fields
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS assigned_advisor_name TEXT,
ADD COLUMN IF NOT EXISTS risk_profile TEXT,
ADD COLUMN IF NOT EXISTS kyc_documents_approved BOOLEAN DEFAULT false;

-- Add payment reference code
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS payment_reference_code TEXT UNIQUE;

-- Change default currency to USD
ALTER TABLE clients 
ALTER COLUMN base_currency SET DEFAULT 'USD';

-- Update system config: Change base currency to USD
UPDATE system_config
SET value = '"USD"'::jsonb
WHERE key = 'base_currency';

-- Update system config: Update supported currencies (USD first)
UPDATE system_config
SET value = '["USD", "EUR", "GBP", "AUD", "CAD"]'::jsonb
WHERE key = 'supported_currencies';

-- Update bank instructions to use UK/European banks with USD as primary
UPDATE system_config
SET value = '{
  "USD": {
    "bank_name": "Barclays Bank PLC",
    "account_name": "Kumbra Capital Ltd Client Trust Account",
    "account_number": "12345678",
    "sort_code": "20-00-00",
    "swift": "BARCGB22",
    "iban": "GB29BARC20005512345678",
    "reference_format": "KC-{CLIENT_ID}"
  },
  "EUR": {
    "bank_name": "Deutsche Bank AG",
    "account_name": "Kumbra Capital Ltd EUR Client Account",
    "iban": "DE89370400440532013000",
    "swift": "DEUTDEFF",
    "reference_format": "KC-{CLIENT_ID}"
  },
  "GBP": {
    "bank_name": "HSBC UK Bank PLC",
    "account_name": "Kumbra Capital Ltd GBP Client Account",
    "account_number": "87654321",
    "sort_code": "40-00-00",
    "swift": "HBUKGB4B",
    "iban": "GB29HBUK40000087654321",
    "reference_format": "KC-{CLIENT_ID}"
  },
  "AUD": {
    "bank_name": "National Australia Bank",
    "account_name": "Kumbra Capital Ltd AUD Client Account",
    "bsb": "082-001",
    "account_number": "123456789",
    "swift": "NATAAU3303M",
    "reference_format": "KC-{CLIENT_ID}"
  },
  "CAD": {
    "bank_name": "Royal Bank of Canada",
    "account_name": "Kumbra Capital Ltd CAD Client Account",
    "account_number": "1234567",
    "institution_number": "003",
    "transit_number": "12345",
    "swift": "ROYCCAT2",
    "reference_format": "KC-{CLIENT_ID}"
  }
}'::jsonb
WHERE key = 'bank_instructions';

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_clients_country_of_residence ON clients(country_of_residence);
CREATE INDEX IF NOT EXISTS idx_clients_payment_reference_code ON clients(payment_reference_code);
CREATE INDEX IF NOT EXISTS idx_clients_assigned_advisor_name ON clients(assigned_advisor_name);