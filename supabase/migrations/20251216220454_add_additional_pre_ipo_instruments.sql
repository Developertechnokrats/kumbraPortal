/*
  # Add Additional Pre-IPO Investment Instruments

  1. New Pre-IPO Companies
    - Plaid Inc. - Financial infrastructure platform
    - Chime Financial Inc. - Digital banking platform
    - Discord Inc. - Communication and community platform
    - Impossible Foods Inc. - Plant-based meat company

  2. Details
    - Each instrument includes sector, valuation, expected IPO timeline
    - Price per share and minimum investment amounts
    - Comprehensive company descriptions

  3. Security
    - No changes to RLS policies
*/

INSERT INTO instruments (
  asset_class,
  issuer_name,
  issuer_domain,
  symbol,
  currency,
  is_active,
  metadata_json
) VALUES
(
  'PRE_IPO',
  'Plaid Inc.',
  'plaid.com',
  'PLAID',
  'USD',
  true,
  '{
    "sector": "Financial Technology",
    "valuation": 13500000000,
    "expected_ipo": "2025-2026",
    "price_per_share": 85.00,
    "min_investment": 10000,
    "founded": "2013",
    "description": "Plaid is a financial services company that builds technology to enable applications to connect with users'' bank accounts. Used by major fintech companies including Venmo, Robinhood, and Coinbase.",
    "employees": "800+",
    "headquarters": "San Francisco, CA"
  }'::jsonb
),
(
  'PRE_IPO',
  'Chime Financial Inc.',
  'chime.com',
  'CHIME',
  'USD',
  true,
  '{
    "sector": "Digital Banking",
    "valuation": 25000000000,
    "expected_ipo": "2025",
    "price_per_share": 120.00,
    "min_investment": 15000,
    "founded": "2013",
    "description": "Chime is a financial technology company providing fee-free mobile banking services. With over 14 million account holders, Chime offers checking accounts, savings accounts, and debit cards with no monthly fees or minimum balance requirements.",
    "employees": "1,500+",
    "headquarters": "San Francisco, CA"
  }'::jsonb
),
(
  'PRE_IPO',
  'Discord Inc.',
  'discord.com',
  'DISCORD',
  'USD',
  true,
  '{
    "sector": "Communication & Social",
    "valuation": 15000000000,
    "expected_ipo": "2025-2026",
    "price_per_share": 95.00,
    "min_investment": 10000,
    "founded": "2015",
    "description": "Discord is a voice, video, and text communication platform designed for communities. With over 150 million monthly active users, Discord has evolved from a gaming chat app to a versatile community platform used by hobbyists, educators, and businesses.",
    "employees": "600+",
    "headquarters": "San Francisco, CA"
  }'::jsonb
),
(
  'PRE_IPO',
  'Impossible Foods Inc.',
  'impossiblefoods.com',
  'IMPF',
  'USD',
  true,
  '{
    "sector": "Food Technology",
    "valuation": 7000000000,
    "expected_ipo": "2025",
    "price_per_share": 55.00,
    "min_investment": 10000,
    "founded": "2011",
    "description": "Impossible Foods develops plant-based substitutes for meat products. Their flagship Impossible Burger is sold in thousands of restaurants and grocery stores worldwide. The company''s mission is to reduce the environmental impact of animal agriculture.",
    "employees": "700+",
    "headquarters": "Redwood City, CA"
  }'::jsonb
)
ON CONFLICT DO NOTHING;
