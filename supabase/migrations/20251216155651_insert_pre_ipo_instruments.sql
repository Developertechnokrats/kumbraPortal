/*
  # Insert Pre-IPO Instruments

  1. New Instruments
    - SpaceX - Aerospace & Technology ($112/share)
    - Databricks - Data Analytics & AI ($73.50/share)
    - Klarna - Financial Technology ($45.80/share)
    - Stripe - Financial Technology ($27.50/share)
  
  2. Features
    - Each instrument includes company logo via Clearbit API
    - Share price stored in metadata for valuation tracking
    - Minimum investment amounts specified
    - Funding round and valuation information included
*/

-- Insert Pre-IPO instruments
INSERT INTO instruments (
  symbol,
  issuer_name,
  issuer_domain,
  asset_class,
  currency,
  is_active,
  metadata_json
) VALUES
(
  'SPACEX',
  'SpaceX (Space Exploration Technologies Corp.)',
  'spacex.com',
  'PRE_IPO',
  'USD',
  true,
  '{
    "company_logo": "https://logo.clearbit.com/spacex.com",
    "sector": "Aerospace & Technology",
    "description": "Space exploration and satellite communications company",
    "minimum_investment": 10000,
    "share_price": 112.00,
    "last_funding_round": "Series K",
    "valuation": 180000000000,
    "founded": 2002
  }'::jsonb
),
(
  'DATABRICKS',
  'Databricks Inc.',
  'databricks.com',
  'PRE_IPO',
  'USD',
  true,
  '{
    "company_logo": "https://logo.clearbit.com/databricks.com",
    "sector": "Data Analytics & AI",
    "description": "Unified analytics platform for big data and machine learning",
    "minimum_investment": 5000,
    "share_price": 73.50,
    "last_funding_round": "Series I",
    "valuation": 43000000000,
    "founded": 2013
  }'::jsonb
),
(
  'KLARNA',
  'Klarna Bank AB',
  'klarna.com',
  'PRE_IPO',
  'USD',
  true,
  '{
    "company_logo": "https://logo.clearbit.com/klarna.com",
    "sector": "Financial Technology",
    "description": "Buy now, pay later and digital banking services",
    "minimum_investment": 5000,
    "share_price": 45.80,
    "last_funding_round": "Series H",
    "valuation": 6700000000,
    "founded": 2005
  }'::jsonb
),
(
  'STRIPE',
  'Stripe Inc.',
  'stripe.com',
  'PRE_IPO',
  'USD',
  true,
  '{
    "company_logo": "https://logo.clearbit.com/stripe.com",
    "sector": "Financial Technology",
    "description": "Online payment processing and financial infrastructure",
    "minimum_investment": 10000,
    "share_price": 27.50,
    "last_funding_round": "Series I",
    "valuation": 70000000000,
    "founded": 2010
  }'::jsonb
);

-- Create index for Pre-IPO instruments
CREATE INDEX IF NOT EXISTS idx_instruments_pre_ipo ON instruments(asset_class) WHERE asset_class = 'PRE_IPO';