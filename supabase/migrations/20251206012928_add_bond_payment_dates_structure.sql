/*
  # Add Bond-Specific Settings Structure

  1. Purpose
    - Enhance instruments table to support per-bond configuration
    - Store specific payment dates for dividend/coupon payments
    - Store currency options and other bond-specific settings
  
  2. Changes
    - Update metadata_json structure to include:
      - min_investment (already exists)
      - term_options (already exists)
      - currency_options (new field for allowed currencies)
    
    - Update coupon_schedule_json structure to include:
      - frequency_options (already exists)
      - payment_dates (new field for specific payment dates array)
      - payment_months (already exists)
  
  3. Notes
    - This is a documentation migration
    - No schema changes needed as JSONB fields already exist
    - Settings will be stored in existing metadata_json and coupon_schedule_json fields
*/

-- This migration documents the enhanced JSON structure
-- The actual fields (metadata_json, coupon_schedule_json) already exist in the instruments table

-- Example metadata_json structure after enhancement:
-- {
--   "name": "Bond Name",
--   "rating": "AA-",
--   "sector": "Banks",
--   "maturity": "2031-08-31",
--   "coupon_rate": 1.9,
--   "min_investment": 50000,
--   "term_options": [1, 2, 3],
--   "currency_options": ["AUD", "USD", "GBP"],
--   "default_currency": "AUD",
--   "security_type": "Senior Unsecured",
--   "country_of_risk": "Australia"
-- }

-- Example coupon_schedule_json structure after enhancement:
-- {
--   "frequency": "QUARTERLY",
--   "frequency_options": ["Monthly", "Quarterly", "Semi-annual", "Annual"],
--   "payment_months": [3, 6, 9, 12],
--   "payment_dates": ["2025-03-15", "2025-06-15", "2025-09-15", "2025-12-15"]
-- }

-- Add comment to document the enhanced structure
COMMENT ON COLUMN instruments.metadata_json IS 'Bond metadata including min_investment, term_options, currency_options, and other bond-specific settings';
COMMENT ON COLUMN instruments.coupon_schedule_json IS 'Payment schedule including frequency_options, payment_months, and specific payment_dates array';
