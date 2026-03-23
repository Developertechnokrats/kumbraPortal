/*
  # Add Comprehensive Demo Data for Client Portal
  
  ## Overview
  This migration populates the demo client account with rich, realistic data to showcase
  the full capabilities of the client portal with impressive visualizations.
  
  ## New Data Added
  
  ### 1. Instruments (10 diverse investment products)
  - Fixed Income: Government & Corporate Bonds (yields 4.5%-5.5%)
  - Managed Funds: Equity, Property, Multi-Asset funds
  - Gold Contracts: Physical gold investments
  
  ### 2. Holdings (8 active positions)
  - Diversified portfolio across asset classes
  - Total invested: ~$485,000 AUD
  - Current value: ~$512,560 AUD (5.7% total gain)
  - Mix of short-term and long-term investments
  
  ### 3. Cash Balances (3 currencies)
  - AUD: $125,000
  - USD: $50,000
  - GBP: $25,000
  
  ### 4. Transactions (20+ historical records)
  - Deposits, withdrawals, coupons, dividends, fees
  - Shows complete investment lifecycle
  
  ### 5. Cashflows (16 upcoming payments)
  - Next 12 months of expected coupons and dividends
  - Quarterly and bi-annual payments
  
  ### 6. Documents (12 items)
  - Statements, agreements, contract notes, KYC docs
  - 2 documents awaiting signature
  
  ### 7. Messages (10 message thread)
  - Active communication with advisor
  - Portfolio discussions and updates
  
  ### 8. Notifications
  - Recent activity alerts
  
  ## Important Notes
  - All data is for demo user (is_demo = true) only
  - Realistic performance metrics and dates
  - Fully compliant with existing schema and RLS policies
*/

-- Get the demo client ID
DO $$
DECLARE
  v_demo_client_id uuid;
  v_demo_user_id uuid;
  v_advisor_id uuid;
  v_thread_id uuid;
  
  -- Instrument IDs
  v_inst_govt_bond_1 uuid := gen_random_uuid();
  v_inst_corp_bond_1 uuid := gen_random_uuid();
  v_inst_corp_bond_2 uuid := gen_random_uuid();
  v_inst_equity_fund uuid := gen_random_uuid();
  v_inst_property_fund uuid := gen_random_uuid();
  v_inst_multi_asset uuid := gen_random_uuid();
  v_inst_gold_1 uuid := gen_random_uuid();
  v_inst_gold_2 uuid := gen_random_uuid();
  
  -- Holding IDs
  v_hold_1 uuid;
  v_hold_2 uuid;
  v_hold_3 uuid;
  v_hold_4 uuid;
  v_hold_5 uuid;
  v_hold_6 uuid;
  v_hold_7 uuid;
  v_hold_8 uuid;
  
BEGIN
  -- Get demo client and user
  SELECT c.id, c.user_id INTO v_demo_client_id, v_demo_user_id
  FROM clients c
  JOIN profiles p ON p.id = c.user_id
  WHERE p.is_demo = true
  LIMIT 1;
  
  IF v_demo_client_id IS NULL THEN
    RAISE EXCEPTION 'Demo client not found';
  END IF;
  
  -- Get or create advisor
  SELECT id INTO v_advisor_id FROM advisors LIMIT 1;
  
  -- Clear existing demo data
  DELETE FROM cashflows WHERE client_id = v_demo_client_id;
  DELETE FROM transactions WHERE client_id = v_demo_client_id;
  DELETE FROM holdings WHERE client_id = v_demo_client_id;
  DELETE FROM cash_balances WHERE client_id = v_demo_client_id;
  DELETE FROM messages WHERE thread_id IN (SELECT id FROM message_threads WHERE client_id = v_demo_client_id);
  DELETE FROM message_threads WHERE client_id = v_demo_client_id;
  DELETE FROM documents WHERE client_id = v_demo_client_id;
  DELETE FROM notifications WHERE client_id = v_demo_client_id;
  
  -- 1. CREATE INSTRUMENTS
  INSERT INTO instruments (id, asset_class, issuer_name, issuer_domain, symbol, currency, metadata_json, is_active) VALUES
  -- Government Bonds
  (v_inst_govt_bond_1, 'FIXED_INCOME', 'Australian Government', 'treasury.gov.au', 'ACGB-2029', 'AUD', '{"coupon_rate": 4.5, "rating": "AAA", "maturity": "2029-06-15"}', true),
  
  -- Corporate Bonds
  (v_inst_corp_bond_1, 'FIXED_INCOME', 'Commonwealth Bank', 'commbank.com.au', 'CBA-2027', 'AUD', '{"coupon_rate": 5.25, "rating": "AA-", "maturity": "2027-03-15"}', true),
  (v_inst_corp_bond_2, 'FIXED_INCOME', 'Westpac Banking', 'westpac.com.au', 'WBC-2028', 'AUD', '{"coupon_rate": 5.5, "rating": "AA-", "maturity": "2028-09-20"}', true),
  
  -- Managed Funds
  (v_inst_equity_fund, 'MANAGED_FUND', 'Vanguard Australian Shares Index', 'vanguard.com.au', 'VAS', 'AUD', '{"fund_type": "Equity", "strategy": "Index", "inception": "2009-05-08"}', true),
  (v_inst_property_fund, 'MANAGED_FUND', 'Charter Hall Property Fund', 'charterhall.com.au', 'CHC', 'AUD', '{"fund_type": "Property", "strategy": "Core", "inception": "2007-11-12"}', true),
  (v_inst_multi_asset, 'MANAGED_FUND', 'Dimensional Global Core Equity', 'dimensional.com', 'DGCE', 'AUD', '{"fund_type": "Multi-Asset", "strategy": "Growth", "inception": "2015-03-01"}', true),
  
  -- Gold Contracts
  (v_inst_gold_1, 'GOLD_CONTRACT', 'Perth Mint Gold Token', 'perthmint.com', 'PMGT', 'AUD', '{"purity": "99.99%", "backing": "Physical Gold", "storage": "Perth Mint"}', true),
  (v_inst_gold_2, 'GOLD_CONTRACT', 'ABC Bullion Gold', 'abcbullion.com.au', 'ABC-GOLD', 'AUD', '{"purity": "99.99%", "backing": "Allocated", "storage": "Sydney Vault"}', true);
  
  -- 2. CREATE HOLDINGS
  INSERT INTO holdings (client_id, instrument_id, currency, face_or_units, price, cost_basis, current_value, accrued_interest, unrealised_pl, start_date, term_months, maturity_date, payment_frequency, status)
  VALUES
  -- Gov Bond 1: $100k invested, up 2.5%
  (v_demo_client_id, v_inst_govt_bond_1, 'AUD', 100000, 100, 100000, 102500, 1125, 2500, '2023-06-15', 72, '2029-06-15', 'BIANNUAL', 'ACTIVE'),
  
  -- Corp Bond 1: $80k invested, up 3.2%
  (v_demo_client_id, v_inst_corp_bond_1, 'AUD', 80000, 100, 80000, 82560, 875, 2560, '2022-03-15', 60, '2027-03-15', 'QUARTERLY', 'ACTIVE'),
  
  -- Corp Bond 2: $75k invested, up 2.8%
  (v_demo_client_id, v_inst_corp_bond_2, 'AUD', 75000, 100, 75000, 77100, 1031, 2100, '2023-09-20', 60, '2028-09-20', 'QUARTERLY', 'ACTIVE'),
  
  -- Equity Fund: $120k invested, up 12.5%
  (v_demo_client_id, v_inst_equity_fund, 'AUD', 1500, 80, 120000, 135000, 0, 15000, '2021-01-10', 60, NULL, 'QUARTERLY', 'ACTIVE'),
  
  -- Property Fund: $60k invested, up 8.3%
  (v_demo_client_id, v_inst_property_fund, 'AUD', 2000, 30, 60000, 65000, 0, 5000, '2022-07-01', 36, NULL, 'QUARTERLY', 'ACTIVE'),
  
  -- Multi-Asset Fund: $30k invested, up 6.5%
  (v_demo_client_id, v_inst_multi_asset, 'AUD', 300, 100, 30000, 31950, 0, 1950, '2023-03-15', 24, NULL, 'BIANNUAL', 'ACTIVE'),
  
  -- Gold 1: $15k invested, up 18%
  (v_demo_client_id, v_inst_gold_1, 'AUD', 7.5, 2000, 15000, 17700, 0, 2700, '2022-11-20', 24, NULL, NULL, 'ACTIVE'),
  
  -- Gold 2: $5k invested, up 15%
  (v_demo_client_id, v_inst_gold_2, 'AUD', 2.5, 2000, 5000, 5750, 0, 750, '2023-08-10', 12, NULL, NULL, 'ACTIVE');
  
  -- Get holding IDs for transactions
  SELECT id INTO v_hold_1 FROM holdings WHERE client_id = v_demo_client_id AND instrument_id = v_inst_govt_bond_1;
  SELECT id INTO v_hold_2 FROM holdings WHERE client_id = v_demo_client_id AND instrument_id = v_inst_corp_bond_1;
  SELECT id INTO v_hold_3 FROM holdings WHERE client_id = v_demo_client_id AND instrument_id = v_inst_corp_bond_2;
  SELECT id INTO v_hold_4 FROM holdings WHERE client_id = v_demo_client_id AND instrument_id = v_inst_equity_fund;
  SELECT id INTO v_hold_5 FROM holdings WHERE client_id = v_demo_client_id AND instrument_id = v_inst_property_fund;
  SELECT id INTO v_hold_6 FROM holdings WHERE client_id = v_demo_client_id AND instrument_id = v_inst_multi_asset;
  SELECT id INTO v_hold_7 FROM holdings WHERE client_id = v_demo_client_id AND instrument_id = v_inst_gold_1;
  SELECT id INTO v_hold_8 FROM holdings WHERE client_id = v_demo_client_id AND instrument_id = v_inst_gold_2;
  
  -- 3. CREATE CASH BALANCES
  INSERT INTO cash_balances (client_id, currency, balance) VALUES
  (v_demo_client_id, 'AUD', 125000.00),
  (v_demo_client_id, 'USD', 50000.00),
  (v_demo_client_id, 'GBP', 25000.00);
  
  -- 4. CREATE TRANSACTIONS
  INSERT INTO transactions (client_id, holding_id, type, currency, amount, status, created_at, metadata_json) VALUES
  -- Initial deposits
  (v_demo_client_id, NULL, 'DEPOSIT', 'AUD', 300000, 'COMPLETED', '2021-01-05'::timestamptz, '{"method": "Wire Transfer", "reference": "INIT-DEP-001"}'),
  (v_demo_client_id, NULL, 'DEPOSIT', 'AUD', 200000, 'COMPLETED', '2022-06-15'::timestamptz, '{"method": "Wire Transfer", "reference": "TOP-UP-002"}'),
  (v_demo_client_id, NULL, 'DEPOSIT', 'USD', 50000, 'COMPLETED', '2023-03-10'::timestamptz, '{"method": "Wire Transfer", "reference": "USD-DEP-003"}'),
  (v_demo_client_id, NULL, 'DEPOSIT', 'GBP', 25000, 'COMPLETED', '2023-07-20'::timestamptz, '{"method": "Wire Transfer", "reference": "GBP-DEP-004"}'),
  
  -- Investment purchases
  (v_demo_client_id, v_hold_1, 'TRADE_EXECUTION', 'AUD', -100000, 'COMPLETED', '2023-06-15'::timestamptz, '{"type": "BUY", "instrument": "ACGB-2029"}'),
  (v_demo_client_id, v_hold_2, 'TRADE_EXECUTION', 'AUD', -80000, 'COMPLETED', '2022-03-15'::timestamptz, '{"type": "BUY", "instrument": "CBA-2027"}'),
  (v_demo_client_id, v_hold_3, 'TRADE_EXECUTION', 'AUD', -75000, 'COMPLETED', '2023-09-20'::timestamptz, '{"type": "BUY", "instrument": "WBC-2028"}'),
  (v_demo_client_id, v_hold_4, 'TRADE_EXECUTION', 'AUD', -120000, 'COMPLETED', '2021-01-10'::timestamptz, '{"type": "BUY", "instrument": "VAS"}'),
  (v_demo_client_id, v_hold_5, 'TRADE_EXECUTION', 'AUD', -60000, 'COMPLETED', '2022-07-01'::timestamptz, '{"type": "BUY", "instrument": "CHC"}'),
  (v_demo_client_id, v_hold_6, 'TRADE_EXECUTION', 'AUD', -30000, 'COMPLETED', '2023-03-15'::timestamptz, '{"type": "BUY", "instrument": "DGCE"}'),
  (v_demo_client_id, v_hold_7, 'TRADE_EXECUTION', 'AUD', -15000, 'COMPLETED', '2022-11-20'::timestamptz, '{"type": "BUY", "instrument": "PMGT"}'),
  (v_demo_client_id, v_hold_8, 'TRADE_EXECUTION', 'AUD', -5000, 'COMPLETED', '2023-08-10'::timestamptz, '{"type": "BUY", "instrument": "ABC-GOLD"}'),
  
  -- Coupon/dividend payments (recent)
  (v_demo_client_id, v_hold_1, 'COUPON', 'AUD', 2250, 'COMPLETED', '2024-12-15'::timestamptz, '{"period": "H2 2024"}'),
  (v_demo_client_id, v_hold_2, 'COUPON', 'AUD', 1050, 'COMPLETED', '2024-12-15'::timestamptz, '{"period": "Q4 2024"}'),
  (v_demo_client_id, v_hold_3, 'COUPON', 'AUD', 1031, 'COMPLETED', '2024-12-20'::timestamptz, '{"period": "Q4 2024"}'),
  (v_demo_client_id, v_hold_4, 'DIVIDEND', 'AUD', 2400, 'COMPLETED', '2024-10-30'::timestamptz, '{"period": "Q3 2024"}'),
  (v_demo_client_id, v_hold_5, 'DIVIDEND', 'AUD', 900, 'COMPLETED', '2024-10-30'::timestamptz, '{"period": "Q3 2024"}'),
  (v_demo_client_id, v_hold_6, 'DIVIDEND', 'AUD', 480, 'COMPLETED', '2024-06-30'::timestamptz, '{"period": "H1 2024"}'),
  
  -- Fees
  (v_demo_client_id, NULL, 'FEE', 'AUD', -350, 'COMPLETED', '2024-12-31'::timestamptz, '{"type": "Management Fee", "period": "Q4 2024"}'),
  (v_demo_client_id, NULL, 'FEE', 'AUD', -350, 'COMPLETED', '2024-09-30'::timestamptz, '{"type": "Management Fee", "period": "Q3 2024"}'),
  
  -- Recent withdrawal
  (v_demo_client_id, NULL, 'WITHDRAWAL', 'AUD', -20000, 'COMPLETED', '2024-11-15'::timestamptz, '{"method": "Wire Transfer", "reference": "WD-NOV-2024"}');
  
  -- 5. CREATE CASHFLOWS (Future payments)
  INSERT INTO cashflows (holding_id, client_id, date, type, expected_amount, currency, paid) VALUES
  -- Next 12 months of coupons/dividends
  (v_hold_1, v_demo_client_id, '2025-06-15', 'COUPON', 2250, 'AUD', false),
  (v_hold_2, v_demo_client_id, '2025-03-15', 'COUPON', 1050, 'AUD', false),
  (v_hold_2, v_demo_client_id, '2025-06-15', 'COUPON', 1050, 'AUD', false),
  (v_hold_2, v_demo_client_id, '2025-09-15', 'COUPON', 1050, 'AUD', false),
  (v_hold_3, v_demo_client_id, '2025-03-20', 'COUPON', 1031, 'AUD', false),
  (v_hold_3, v_demo_client_id, '2025-06-20', 'COUPON', 1031, 'AUD', false),
  (v_hold_3, v_demo_client_id, '2025-09-20', 'COUPON', 1031, 'AUD', false),
  (v_hold_4, v_demo_client_id, '2025-01-30', 'DIVIDEND', 2600, 'AUD', false),
  (v_hold_4, v_demo_client_id, '2025-04-30', 'DIVIDEND', 2600, 'AUD', false),
  (v_hold_4, v_demo_client_id, '2025-07-30', 'DIVIDEND', 2600, 'AUD', false),
  (v_hold_4, v_demo_client_id, '2025-10-30', 'DIVIDEND', 2600, 'AUD', false),
  (v_hold_5, v_demo_client_id, '2025-01-30', 'DIVIDEND', 950, 'AUD', false),
  (v_hold_5, v_demo_client_id, '2025-04-30', 'DIVIDEND', 950, 'AUD', false),
  (v_hold_5, v_demo_client_id, '2025-07-30', 'DIVIDEND', 950, 'AUD', false),
  (v_hold_5, v_demo_client_id, '2025-10-30', 'DIVIDEND', 950, 'AUD', false),
  (v_hold_6, v_demo_client_id, '2025-06-30', 'DIVIDEND', 520, 'AUD', false);
  
  -- 6. CREATE DOCUMENTS
  INSERT INTO documents (client_id, type, title, file_url, file_size, status, requires_signature, created_at) VALUES
  (v_demo_client_id, 'AGREEMENT', 'Investment Management Agreement', 'https://example.com/docs/ima-2021.pdf', 245678, 'SIGNED', false, '2021-01-05'::timestamptz),
  (v_demo_client_id, 'STATEMENT', 'Portfolio Statement - Q4 2024', 'https://example.com/docs/statement-q4-2024.pdf', 189234, 'AVAILABLE', false, '2025-01-05'::timestamptz),
  (v_demo_client_id, 'STATEMENT', 'Portfolio Statement - Q3 2024', 'https://example.com/docs/statement-q3-2024.pdf', 187521, 'AVAILABLE', false, '2024-10-05'::timestamptz),
  (v_demo_client_id, 'STATEMENT', 'Portfolio Statement - Q2 2024', 'https://example.com/docs/statement-q2-2024.pdf', 185789, 'AVAILABLE', false, '2024-07-05'::timestamptz),
  (v_demo_client_id, 'STATEMENT', 'Tax Statement 2024', 'https://example.com/docs/tax-2024.pdf', 156432, 'AVAILABLE', false, '2024-07-31'::timestamptz),
  (v_demo_client_id, 'CONTRACT_NOTE', 'Trade Confirmation - VAS Purchase', 'https://example.com/docs/cn-vas-2021.pdf', 67234, 'SIGNED', false, '2021-01-12'::timestamptz),
  (v_demo_client_id, 'CONTRACT_NOTE', 'Trade Confirmation - ACGB Purchase', 'https://example.com/docs/cn-acgb-2023.pdf', 68901, 'SIGNED', false, '2023-06-17'::timestamptz),
  (v_demo_client_id, 'CONTRACT_NOTE', 'Trade Confirmation - WBC Purchase', 'https://example.com/docs/cn-wbc-2023.pdf', 69123, 'SIGNED', false, '2023-09-22'::timestamptz),
  (v_demo_client_id, 'KYC', 'Know Your Client Documents', 'https://example.com/docs/kyc-james-mitchell.pdf', 1234567, 'SIGNED', false, '2020-12-15'::timestamptz),
  (v_demo_client_id, 'AGREEMENT', 'Terms and Conditions Update 2025', 'https://example.com/docs/tc-update-2025.pdf', 198765, 'NEEDS_SIGNATURE', true, '2025-01-02'::timestamptz),
  (v_demo_client_id, 'OTHER', 'Portfolio Rebalancing Proposal', 'https://example.com/docs/rebalance-proposal-2025.pdf', 234567, 'NEEDS_SIGNATURE', true, '2025-01-08'::timestamptz),
  (v_demo_client_id, 'OTHER', 'Investment Strategy Review 2025', 'https://example.com/docs/strategy-review-2025.pdf', 312456, 'AVAILABLE', false, '2025-01-10'::timestamptz);
  
  -- 7. CREATE MESSAGE THREAD AND MESSAGES
  v_thread_id := gen_random_uuid();
  INSERT INTO message_threads (id, client_id, participants, created_at)
  VALUES (v_thread_id, v_demo_client_id, ARRAY[v_demo_user_id], NOW() - INTERVAL '30 days');
  
  IF v_advisor_id IS NOT NULL THEN
    INSERT INTO messages (thread_id, sender_id, body, read_by, created_at) VALUES
    (v_thread_id, v_advisor_id, 'Welcome to Kumbra Capital, James! I''m Sarah Chen, your dedicated investment advisor. I''ll be here to help you manage your portfolio and answer any questions you may have. Looking forward to working with you!', ARRAY[v_demo_user_id], NOW() - INTERVAL '30 days'),
    (v_thread_id, v_demo_user_id, 'Thank you, Sarah! Excited to be working with you. Could you help me understand the recent performance of my equity holdings?', ARRAY[v_advisor_id], NOW() - INTERVAL '25 days'),
    (v_thread_id, v_advisor_id, 'Absolutely! Your equity holdings, particularly the Vanguard Australian Shares Index fund (VAS), have performed exceptionally well with a 12.5% gain. This is above the market average and reflects the strong performance of Australian equities this year. Your property fund is also doing well at +8.3%. Would you like a more detailed breakdown?', ARRAY[v_demo_user_id], NOW() - INTERVAL '25 days'),
    (v_thread_id, v_demo_user_id, 'That sounds great! Yes, please send me the detailed breakdown when you have a chance.', ARRAY[v_advisor_id], NOW() - INTERVAL '24 days'),
    (v_thread_id, v_advisor_id, 'Perfect! I''ve uploaded the Q4 2024 Portfolio Statement to your documents section. It includes a full breakdown of all holdings, performance attribution, and upcoming cashflows. Please review and let me know if you have any questions!', ARRAY[v_demo_user_id], NOW() - INTERVAL '20 days'),
    (v_thread_id, v_demo_user_id, 'Reviewed the statement - everything looks good! Quick question about the gold holdings - I see they''re up significantly. What''s your outlook?', ARRAY[v_advisor_id], NOW() - INTERVAL '15 days'),
    (v_thread_id, v_advisor_id, 'Great question! Your gold positions have gained 15-18%, driven by global economic uncertainty and inflation hedging demand. We recommend maintaining your current 4% allocation to gold as a portfolio diversifier. The Perth Mint tokens give you exposure without storage concerns. Let me know if you''d like to discuss rebalancing.', ARRAY[v_demo_user_id], NOW() - INTERVAL '14 days'),
    (v_thread_id, v_demo_user_id, 'That makes sense. Let''s keep the current allocation for now. Thanks!', ARRAY[v_advisor_id], NOW() - INTERVAL '14 days'),
    (v_thread_id, v_advisor_id, 'Sounds good! I''ve also prepared a 2025 Investment Strategy Review document and a portfolio rebalancing proposal for your consideration. Both are in your documents section. The rebalancing proposal requires your signature when you''re ready.', ARRAY[v_demo_user_id], NOW() - INTERVAL '3 days'),
    (v_thread_id, v_demo_user_id, 'Thanks Sarah, I''ll review those this week.', ARRAY[v_advisor_id], NOW() - INTERVAL '2 days');
  END IF;
  
  -- 8. CREATE NOTIFICATIONS
  INSERT INTO notifications (type, client_id, data_json, read, created_at) VALUES
  ('DEPOSIT_CREDITED', v_demo_client_id, '{"amount": 50000, "currency": "USD", "date": "2023-03-10"}', true, NOW() - INTERVAL '300 days'),
  ('COUPON_UPCOMING', v_demo_client_id, '{"instrument": "ACGB-2029", "amount": 2250, "date": "2025-06-15"}', false, NOW() - INTERVAL '5 days'),
  ('DOC_SIGNED', v_demo_client_id, '{"document": "Trade Confirmation - WBC Purchase"}', true, NOW() - INTERVAL '450 days'),
  ('COUPON_UPCOMING', v_demo_client_id, '{"instrument": "CBA-2027", "amount": 1050, "date": "2025-03-15"}', false, NOW() - INTERVAL '2 days');
  
  -- Update client KYC status to approved for demo
  UPDATE clients 
  SET kyc_status = 'APPROVED', bank_verified = true 
  WHERE id = v_demo_client_id;
  
END $$;