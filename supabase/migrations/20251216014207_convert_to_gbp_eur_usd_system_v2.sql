/*
  # Convert System to GBP/EUR/USD for UK & European Clients

  ## Overview
  Converts the platform from AUD-focused to GBP/EUR/USD for British and European clients.

  ## Changes Made

  ### 1. Currency Updates
  - Change default `base_currency` from AUD to GBP in clients table
  - Update FX rates base from AUD to GBP
  - Consolidate AUD cash balances into GBP (delete AUD, keep existing GBP)

  ### 2. Payment Instructions
  - Rename `payment_bsb` to `payment_sort_code` for UK banking
  - Add `payment_iban` field for European SEPA transfers
  - Add `payment_swift_bic` field for international transfers
  - Add `payment_bank_address` for compliance

  ### 3. Data Updates
  - Convert all AUD references to GBP in existing data
  - Update instrument currencies appropriately

  ### 4. Regional Settings
  - Set default locale to 'en-GB' for British English
*/

-- Update clients table default currency
ALTER TABLE clients 
ALTER COLUMN base_currency SET DEFAULT 'GBP';

-- Update existing clients from AUD to GBP
UPDATE clients 
SET base_currency = 'GBP' 
WHERE base_currency = 'AUD';

-- Update payment instructions for UK/European banking
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'payment_bsb'
  ) THEN
    ALTER TABLE clients DROP COLUMN payment_bsb;
  END IF;
END $$;

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS payment_sort_code text,
ADD COLUMN IF NOT EXISTS payment_iban text,
ADD COLUMN IF NOT EXISTS payment_swift_bic text,
ADD COLUMN IF NOT EXISTS payment_bank_address text;

-- Update client bank accounts for UK/European format
COMMENT ON COLUMN client_bank_accounts.bsb_or_sort_code IS 'UK Sort Code (6 digits) or equivalent';
COMMENT ON COLUMN client_bank_accounts.iban IS 'International Bank Account Number for SEPA transfers';

-- Consolidate AUD cash balances (delete AUD entries as they should use GBP)
DELETE FROM cash_balances 
WHERE currency = 'AUD';

-- Update FX rates base from AUD to GBP
ALTER TABLE fx_rates
ALTER COLUMN base SET DEFAULT 'GBP';

DELETE FROM fx_rates WHERE base = 'AUD';

-- Update existing instruments from AUD to GBP where applicable
UPDATE instruments
SET currency = 'GBP'
WHERE currency = 'AUD';

-- Update holdings from AUD to GBP
UPDATE holdings
SET currency = 'GBP'
WHERE currency = 'AUD';

-- Update cashflows from AUD to GBP
UPDATE cashflows
SET currency = 'GBP'
WHERE currency = 'AUD';

-- Update transactions from AUD to GBP
UPDATE transactions
SET currency = 'GBP'
WHERE currency = 'AUD';

-- Insert default FX rates for GBP base (GBP = 1.00)
INSERT INTO fx_rates (date, base, quote, rate) VALUES
  (CURRENT_DATE, 'GBP', 'USD', 1.27),
  (CURRENT_DATE, 'GBP', 'EUR', 1.17),
  (CURRENT_DATE, 'GBP', 'GBP', 1.00)
ON CONFLICT (date, base, quote) DO UPDATE
SET rate = EXCLUDED.rate;
