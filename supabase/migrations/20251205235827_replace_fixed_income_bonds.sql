/*
  # Replace Fixed Income Instruments with Specified Bonds Only

  1. Changes
    - Remove all existing FIXED_INCOME instruments
    - Add only the 9 specified Australian bonds:
      * Commonwealth Bank of Australia - 1.9% 31-Aug-2031
      * Goldman Sachs - 9% 19-May-2042
      * Queensland Treasury Corporation - 5% 10-Mar-2036 (Green)
      * ANZ Group Holdings - 3% 17-Dec-2040 (Subordinated)
      * Westpac Banking Corporation - 4.39% 08-Aug-2029
      * Commonwealth Bank of Australia - 5.15% 01-Nov-2034
      * ANZ Group Holdings - 5.605% 12-Oct-2037
      * Australia Pacific Airports Corporation - 5.598% 01-Nov-2032 (Secured)
      * Stockland Trust - 6.1% 12-Sep-2034

  2. Notes
    - All bonds are in AUD currency
    - Minimum investment is $50,000
    - Payment frequencies include Semi-annual, Annual, and Quarterly options
    - Term options are 1, 2, and 3 years
*/

-- First, delete all existing FIXED_INCOME instruments
DELETE FROM instruments WHERE asset_class = 'FIXED_INCOME';

-- Insert the 9 specified bonds
INSERT INTO instruments (
  asset_class,
  issuer_name,
  issuer_domain,
  symbol,
  isin,
  currency,
  metadata_json,
  coupon_schedule_json,
  is_active
) VALUES
(
  'FIXED_INCOME',
  'Commonwealth Bank of Australia',
  'commbank.com.au',
  'CBA-2031',
  'XS2381682363',
  'AUD',
  jsonb_build_object(
    'name', '1.9% 31-Aug-2031 Senior Unsecured Bond',
    'coupon_rate', 1.90,
    'security_type', 'Senior Unsecured',
    'maturity', '2031-08-31',
    'min_investment', 50000,
    'term_options', ARRAY[1, 2, 3],
    'rating', 'AA-',
    'sector', 'Banks',
    'country_of_risk', 'Australia'
  ),
  jsonb_build_object(
    'frequency', 'QUARTERLY',
    'payment_months', ARRAY[3, 6, 9, 12],
    'frequency_options', ARRAY['Semi-annual', 'Annual', 'Quarterly']
  ),
  true
),
(
  'FIXED_INCOME',
  'Goldman Sachs',
  'goldmansachs.com',
  'GS-2042',
  'XS2470182473',
  'AUD',
  jsonb_build_object(
    'name', '9% 19-May-2042 Senior Unsecured Bond',
    'coupon_rate', 9.000,
    'security_type', 'Senior Unsecured',
    'maturity', '2042-05-19',
    'min_investment', 50000,
    'term_options', ARRAY[1, 2, 3],
    'rating', 'A+',
    'sector', 'Investment Banking',
    'country_of_risk', 'USA'
  ),
  jsonb_build_object(
    'frequency', 'QUARTERLY',
    'payment_months', ARRAY[3, 6, 9, 12],
    'frequency_options', ARRAY['Semi-annual', 'Annual', 'Quarterly']
  ),
  true
),
(
  'FIXED_INCOME',
  'Queensland Treasury Corporation',
  'qtc.com.au',
  'QTC-2036',
  'AU3SG0003254',
  'AUD',
  jsonb_build_object(
    'name', '5% 10-Mar-2036 Green Bond',
    'coupon_rate', 5.000,
    'security_type', 'Senior Unsecured (Green)',
    'maturity', '2036-03-10',
    'min_investment', 50000,
    'term_options', ARRAY[1, 2, 3],
    'rating', 'AAA',
    'sector', 'Government',
    'country_of_risk', 'Australia'
  ),
  jsonb_build_object(
    'frequency', 'QUARTERLY',
    'payment_months', ARRAY[3, 6, 9, 12],
    'frequency_options', ARRAY['Semi-annual', 'Annual', 'Quarterly']
  ),
  true
),
(
  'FIXED_INCOME',
  'ANZ Group Holdings',
  'anz.com.au',
  'ANZ-2040',
  'XS2273246350',
  'AUD',
  jsonb_build_object(
    'name', '3% 17-Dec-2040 Subordinated Bond',
    'coupon_rate', 3.000,
    'security_type', 'Subordinated Unsecured',
    'maturity', '2040-12-17',
    'min_investment', 50000,
    'term_options', ARRAY[1, 2, 3],
    'rating', 'A-',
    'sector', 'Banks',
    'country_of_risk', 'Australia'
  ),
  jsonb_build_object(
    'frequency', 'QUARTERLY',
    'payment_months', ARRAY[3, 6, 9, 12],
    'frequency_options', ARRAY['Semi-annual', 'Annual', 'Quarterly']
  ),
  true
),
(
  'FIXED_INCOME',
  'Westpac Banking Corporation',
  'westpac.com.au',
  'WBC-2029',
  'XS2869466743',
  'AUD',
  jsonb_build_object(
    'name', '4.39% 08-Aug-2029 Senior Unsecured Bond',
    'coupon_rate', 4.390,
    'security_type', 'Senior Unsecured',
    'maturity', '2029-08-08',
    'min_investment', 50000,
    'term_options', ARRAY[1, 2, 3],
    'rating', 'AA-',
    'sector', 'Banks',
    'country_of_risk', 'Australia'
  ),
  jsonb_build_object(
    'frequency', 'QUARTERLY',
    'payment_months', ARRAY[3, 6, 9, 12],
    'frequency_options', ARRAY['Semi-annual', 'Annual', 'Quarterly']
  ),
  true
),
(
  'FIXED_INCOME',
  'Commonwealth Bank of Australia',
  'commbank.com.au',
  'CBA-2034',
  'XS2930552620',
  'AUD',
  jsonb_build_object(
    'name', '5.15% 01-Nov-2034 Senior Unsecured Bond',
    'coupon_rate', 5.150,
    'security_type', 'Senior Unsecured',
    'maturity', '2034-11-01',
    'min_investment', 50000,
    'term_options', ARRAY[1, 2, 3],
    'rating', 'AA-',
    'sector', 'Banks',
    'country_of_risk', 'Australia'
  ),
  jsonb_build_object(
    'frequency', 'QUARTERLY',
    'payment_months', ARRAY[3, 6, 9, 12],
    'frequency_options', ARRAY['Semi-annual', 'Annual', 'Quarterly']
  ),
  true
),
(
  'FIXED_INCOME',
  'ANZ Group Holdings',
  'anz.com.au',
  'ANZ-2037',
  'XS2545193919',
  'AUD',
  jsonb_build_object(
    'name', '5.605% 12-Oct-2037 Senior Unsecured Bond',
    'coupon_rate', 5.605,
    'security_type', 'Senior Unsecured',
    'maturity', '2037-10-12',
    'min_investment', 50000,
    'term_options', ARRAY[1, 2, 3],
    'rating', 'A-',
    'sector', 'Banks',
    'country_of_risk', 'Australia'
  ),
  jsonb_build_object(
    'frequency', 'QUARTERLY',
    'payment_months', ARRAY[3, 6, 9, 12],
    'frequency_options', ARRAY['Semi-annual', 'Annual', 'Quarterly']
  ),
  true
),
(
  'FIXED_INCOME',
  'Australia Pacific Airports Corporation',
  'sydneyairport.com.au',
  'APA-2032',
  'AU3CB0315125',
  'AUD',
  jsonb_build_object(
    'name', '5.598% 01-Nov-2032 Secured Bond',
    'coupon_rate', 5.598,
    'security_type', 'Secured',
    'maturity', '2032-11-01',
    'min_investment', 50000,
    'term_options', ARRAY[1, 2, 3],
    'rating', 'BBB+',
    'sector', 'Infrastructure',
    'country_of_risk', 'Australia'
  ),
  jsonb_build_object(
    'frequency', 'QUARTERLY',
    'payment_months', ARRAY[3, 6, 9, 12],
    'frequency_options', ARRAY['Semi-annual', 'Annual', 'Quarterly']
  ),
  true
),
(
  'FIXED_INCOME',
  'Stockland Trust',
  'stockland.com.au',
  'SGP-2034',
  'AU3CB0307627',
  'AUD',
  jsonb_build_object(
    'name', '6.1% 12-Sep-2034 Bond',
    'coupon_rate', 6.100,
    'security_type', 'Senior Unsecured',
    'maturity', '2034-09-12',
    'min_investment', 50000,
    'term_options', ARRAY[1, 2, 3],
    'rating', 'A-',
    'sector', 'Real Estate',
    'country_of_risk', 'Australia'
  ),
  jsonb_build_object(
    'frequency', 'QUARTERLY',
    'payment_months', ARRAY[3, 6, 9, 12],
    'frequency_options', ARRAY['Semi-annual', 'Annual', 'Quarterly']
  ),
  true
);
