/*
  # Complete Investment Catalogue v2

  ## Summary
  Adds complete catalogue of investment instruments across all asset classes:
  - 29 Fixed Income Bonds (AUD, USD, EUR) with full details
  - Managed Funds including crypto funds  
  - Gold Contracts
  - Pre-IPO Stocks (SpaceX, Databricks, Stripe, and others)

  ## Changes
  1. Clear existing instruments to start fresh
  2. Add all 29 bonds from viable_bonds_au_menu.js with complete metadata
  3. Add curated managed funds including Kumbra crypto funds
  4. Add gold contracts
  5. Add Pre-IPO investment opportunities

  ## Security
  - Instruments can only be modified by SUPER_ADMIN users
  - All users can view active instruments
*/

-- Clear existing instruments to start fresh
DELETE FROM instruments;

-- ============================================
-- FIXED INCOME BONDS (29 total)
-- AUD Bonds (9 bonds)
-- ============================================

INSERT INTO instruments (asset_class, issuer_name, issuer_domain, symbol, isin, currency, metadata_json, coupon_schedule_json, is_active) VALUES
('FIXED_INCOME', 'National Australia Bank', 'nab.com.au', 'NAB-2039', 'AU3CB0310175', 'AUD', 
 '{"name": "National Australia Bank 6.342% 6jun2039", "coupon_rate": 6.342, "maturity": "2039-06-06", "issue_date": "2022-06-06", "rating": "AA-", "rating_agency": "S&P", "sector": "Banks", "yield_to_maturity": 6.3, "country_of_risk": "Australia", "term_options": [1, 2, 3], "min_investment": 10000}'::jsonb,
 '{"frequency": "QUARTERLY", "payment_months": [3, 6, 9, 12]}'::jsonb, true),

('FIXED_INCOME', 'Commonwealth Bank', 'commbank.com.au', 'CBA-2039', 'AU3CB0315638', 'AUD',
 '{"name": "Commonwealth Bank 6.152% 27nov2039", "coupon_rate": 6.152, "maturity": "2039-11-27", "issue_date": "2022-11-27", "rating": "AA-", "rating_agency": "Fitch", "sector": "Banks", "yield_to_maturity": 6.15, "country_of_risk": "Australia", "term_options": [1, 2, 3], "min_investment": 10000}'::jsonb,
 '{"frequency": "QUARTERLY", "payment_months": [3, 6, 9, 12]}'::jsonb, true),

('FIXED_INCOME', 'AGI Finance Pty Limited', 'agifinance.com.au', 'AGI-2030', 'AU3CB0300531', 'AUD',
 '{"name": "AGI Finance 6.109% 28jun2030", "coupon_rate": 6.109, "maturity": "2030-06-28", "issue_date": "2023-06-28", "rating": "A-", "rating_agency": "S&P", "sector": "Finance", "yield_to_maturity": 6.109, "country_of_risk": "Australia", "term_options": [1, 2, 3], "min_investment": 10000}'::jsonb,
 '{"frequency": "BIANNUAL", "payment_months": [6, 12]}'::jsonb, true),

('FIXED_INCOME', 'Aurizon Network', 'aurizon.com.au', 'AZJ-2031', 'AU3CB0307635', 'AUD',
 '{"name": "Aurizon Network 6.100% 12sep2031", "coupon_rate": 6.1, "maturity": "2031-09-12", "issue_date": "2023-09-12", "rating": "BBB+", "rating_agency": "Moodys", "sector": "Transportation", "yield_to_maturity": 6.2, "country_of_risk": "Australia", "term_options": [1, 2, 3], "min_investment": 10000}'::jsonb,
 '{"frequency": "QUARTERLY", "payment_months": [3, 6, 9, 12]}'::jsonb, true),

('FIXED_INCOME', 'AusNet Services Holdings', 'ausnetservices.com.au', 'AST-2033', 'AU3CB0299816', 'AUD',
 '{"name": "AusNet Services 6.134% 31may2033", "coupon_rate": 6.134, "maturity": "2033-05-31", "issue_date": "2023-05-31", "rating": "A-", "rating_agency": "S&P", "sector": "Utilities", "yield_to_maturity": 6.2, "country_of_risk": "Australia", "term_options": [1, 2, 3], "min_investment": 10000}'::jsonb,
 '{"frequency": "QUARTERLY", "payment_months": [3, 6, 9, 12]}'::jsonb, true),

('FIXED_INCOME', 'Australia and New Zealand Banking Group', 'anz.com', 'ANZ-2039', 'AU3CB0311561', 'AUD',
 '{"name": "ANZ Bank 6.124% 25jul2039", "coupon_rate": 6.124, "maturity": "2039-07-25", "issue_date": "2023-07-25", "rating": "AA-", "rating_agency": "Fitch", "sector": "Banks", "yield_to_maturity": 6.1, "country_of_risk": "Australia", "term_options": [1, 2, 3], "min_investment": 10000}'::jsonb,
 '{"frequency": "QUARTERLY", "payment_months": [3, 6, 9, 12]}'::jsonb, true),

('FIXED_INCOME', 'BNP Paribas', 'bnpparibas.com', 'BNP-2036', 'AU3CB0316099', 'AUD',
 '{"name": "BNP Paribas 6.198% 03dec2036", "coupon_rate": 6.198, "maturity": "2036-12-03", "issue_date": "2023-12-03", "rating": "A+", "rating_agency": "S&P", "sector": "Banks", "yield_to_maturity": 6.3, "country_of_risk": "France", "term_options": [1, 2, 3], "min_investment": 10000}'::jsonb,
 '{"frequency": "BIANNUAL", "payment_months": [6, 12]}'::jsonb, true),

('FIXED_INCOME', 'Barclays PLC', 'barclays.com', 'BARC-2031', 'XS1349043130', 'AUD',
 '{"name": "Barclays 6.100% 24mar2031", "coupon_rate": 6.1, "maturity": "2031-03-24", "issue_date": "2023-03-24", "rating": "A", "rating_agency": "Moodys", "sector": "Banks", "yield_to_maturity": 6.2, "country_of_risk": "United Kingdom", "term_options": [1, 2, 3], "min_investment": 10000}'::jsonb,
 '{"frequency": "BIANNUAL", "payment_months": [6, 12]}'::jsonb, true),

('FIXED_INCOME', 'Lloyds Banking Group', 'lloydsbankinggroup.com', 'LLOY-2033', 'AU3CB0302115', 'AUD',
 '{"name": "Lloyds Banking 7.086% 31aug2033", "coupon_rate": 7.086, "maturity": "2033-08-31", "issue_date": "2023-08-31", "rating": "BBB+", "rating_agency": "Fitch", "sector": "Banks", "yield_to_maturity": 7.0, "country_of_risk": "United Kingdom", "term_options": [1, 2, 3], "min_investment": 10000}'::jsonb,
 '{"frequency": "BIANNUAL", "payment_months": [6, 12]}'::jsonb, true);

-- ============================================
-- USD Bonds (13 bonds)
-- ============================================

INSERT INTO instruments (asset_class, issuer_name, issuer_domain, symbol, isin, currency, metadata_json, coupon_schedule_json, is_active) VALUES
('FIXED_INCOME', 'Bank of Montreal', 'bmo.com', 'BMO-2027-6.5', 'USC0573CBW67', 'USD',
 '{"name": "Bank of Montreal 6.5% 16dec2027", "coupon_rate": 6.5, "maturity": "2027-12-16", "issue_date": "2022-12-16", "rating": "A", "rating_agency": "S&P", "sector": "Banks", "yield_to_maturity": 6.4, "country_of_risk": "Canada", "term_options": [1, 2], "min_investment": 10000}'::jsonb,
 '{"frequency": "QUARTERLY", "payment_months": [3, 6, 9, 12]}'::jsonb, true),

('FIXED_INCOME', 'Bank of Montreal', 'bmo.com', 'BMO-2028-8.1', 'USC0573CCE50', 'USD',
 '{"name": "Bank of Montreal 8.1% 25feb2028", "coupon_rate": 8.1, "maturity": "2028-02-25", "issue_date": "2023-02-25", "rating": "A", "rating_agency": "Moodys", "sector": "Banks", "yield_to_maturity": 7.9, "country_of_risk": "Canada", "term_options": [1, 2], "min_investment": 10000}'::jsonb,
 '{"frequency": "QUARTERLY", "payment_months": [3, 6, 9, 12]}'::jsonb, true),

('FIXED_INCOME', 'Bank of Montreal', 'bmo.com', 'BMO-2027-8.4', 'USC0573CBV84', 'USD',
 '{"name": "Bank of Montreal 8.4% 16dec2027", "coupon_rate": 8.4, "maturity": "2027-12-16", "issue_date": "2022-12-16", "rating": "A", "rating_agency": "Fitch", "sector": "Banks", "yield_to_maturity": 8.1, "country_of_risk": "Canada", "term_options": [1, 2], "min_investment": 10000}'::jsonb,
 '{"frequency": "QUARTERLY", "payment_months": [3, 6, 9, 12]}'::jsonb, true),

('FIXED_INCOME', 'Bank of Montreal', 'bmo.com', 'BMO-2027-9.05', 'USC0573CBQ99', 'USD',
 '{"name": "Bank of Montreal 9.05% 3dec2027", "coupon_rate": 9.05, "maturity": "2027-12-03", "issue_date": "2022-12-03", "rating": "A", "rating_agency": "DBRS", "sector": "Banks", "yield_to_maturity": 8.7, "country_of_risk": "Canada", "term_options": [1, 2], "min_investment": 10000}'::jsonb,
 '{"frequency": "QUARTERLY", "payment_months": [3, 6, 9, 12]}'::jsonb, true),

('FIXED_INCOME', 'National Australia Bank', 'nab.com.au', 'NAB-2033', 'USQ6535DBH63', 'USD',
 '{"name": "National Australia Bank 6.429% 12jan2033", "coupon_rate": 6.429, "maturity": "2033-01-12", "issue_date": "2023-01-12", "rating": "AA-", "rating_agency": "Fitch", "sector": "Banks", "yield_to_maturity": 6.3, "country_of_risk": "Australia", "term_options": [1, 2, 3], "min_investment": 10000}'::jsonb,
 '{"frequency": "QUARTERLY", "payment_months": [3, 6, 9, 12]}'::jsonb, true),

('FIXED_INCOME', 'Westpac Banking', 'westpac.com.au', 'WBC-2033', 'US961214FG36', 'USD',
 '{"name": "Westpac Banking 5.405% 10aug2033", "coupon_rate": 5.405, "maturity": "2033-08-10", "issue_date": "2023-08-10", "rating": "AA-", "rating_agency": "S&P", "sector": "Banks", "yield_to_maturity": 5.5, "country_of_risk": "Australia", "term_options": [1, 2, 3], "min_investment": 10000}'::jsonb,
 '{"frequency": "QUARTERLY", "payment_months": [3, 6, 9, 12]}'::jsonb, true),

('FIXED_INCOME', 'Toronto-Dominion Bank', 'td.com', 'TD-2082', 'US89117F8Z56', 'USD',
 '{"name": "Toronto-Dominion Bank 8.125% 31oct2082", "coupon_rate": 8.125, "maturity": "2082-10-31", "issue_date": "2022-10-17", "rating": "A", "rating_agency": "Moodys", "sector": "Banks", "yield_to_maturity": 7.9, "country_of_risk": "Canada", "term_options": [1, 2, 3], "min_investment": 10000}'::jsonb,
 '{"frequency": "BIANNUAL", "payment_months": [6, 12]}'::jsonb, true),

('FIXED_INCOME', 'Morgan Stanley B.V.', 'morganstanley.com', 'MS-2026', 'XS2655123219', 'USD',
 '{"name": "Morgan Stanley 9% 08sep2026", "coupon_rate": 9.0, "maturity": "2026-09-08", "issue_date": "2023-09-08", "rating": "A-", "rating_agency": "Fitch", "sector": "Banks", "yield_to_maturity": 8.8, "country_of_risk": "United States", "term_options": ["To Maturity"], "min_investment": 10000}'::jsonb,
 '{"frequency": "BIANNUAL", "payment_months": [6, 12]}'::jsonb, true),

('FIXED_INCOME', 'Goldman Sachs Group Inc.', 'goldmansachs.com', 'GS-2042', 'XS2470182473', 'USD',
 '{"name": "Goldman Sachs 9% 19may2042", "coupon_rate": 9.0, "maturity": "2042-05-19", "issue_date": "2023-05-19", "rating": "A-", "rating_agency": "S&P", "sector": "Banks", "yield_to_maturity": 8.7, "country_of_risk": "United States", "term_options": [1, 2, 3], "min_investment": 10000}'::jsonb,
 '{"frequency": "BIANNUAL", "payment_months": [6, 12]}'::jsonb, true),

('FIXED_INCOME', 'Nomura International Funding', 'nomura.com', 'NMR-2037', 'XS1690379224', 'USD',
 '{"name": "Nomura 7.65% 04oct2037", "coupon_rate": 7.65, "maturity": "2037-10-04", "issue_date": "2023-10-04", "rating": "BBB+", "rating_agency": "S&P", "sector": "Banks", "yield_to_maturity": 7.7, "country_of_risk": "Japan", "term_options": [1, 2, 3], "min_investment": 10000}'::jsonb,
 '{"frequency": "BIANNUAL", "payment_months": [6, 12]}'::jsonb, true),

('FIXED_INCOME', 'Crédit Agricole S.A.', 'credit-agricole.com', 'ACA-2035', 'USF2R125Q730', 'USD',
 '{"name": "Credit Agricole SA 6.251% 10jan2035", "coupon_rate": 6.251, "maturity": "2035-01-10", "issue_date": "2023-01-10", "rating": "A", "rating_agency": "Moodys", "sector": "Banks", "yield_to_maturity": 6.2, "country_of_risk": "France", "term_options": [1, 2, 3], "min_investment": 10000}'::jsonb,
 '{"frequency": "BIANNUAL", "payment_months": [6, 12]}'::jsonb, true);

-- ============================================
-- EUR Bonds (7 bonds)
-- ============================================

INSERT INTO instruments (asset_class, issuer_name, issuer_domain, symbol, isin, currency, metadata_json, coupon_schedule_json, is_active) VALUES
('FIXED_INCOME', 'Societe Generale', 'societegenerale.com', 'GLE-2038', 'XS2699556275', 'EUR',
 '{"name": "Societe Generale 7.7% 08nov2038", "coupon_rate": 7.7, "maturity": "2038-11-08", "issue_date": "2023-11-08", "rating": "A", "rating_agency": "Moodys", "sector": "Banks", "yield_to_maturity": 7.6, "country_of_risk": "France", "term_options": [1, 2, 3], "min_investment": 10000}'::jsonb,
 '{"frequency": "ANNUAL", "payment_months": [11]}'::jsonb, true),

('FIXED_INCOME', 'CaixaBank', 'caixabank.com', 'CABK-PERP', 'ES0840609053', 'EUR',
 '{"name": "CaixaBank 7.5% Perpetual AT1", "coupon_rate": 7.5, "maturity": "2099-12-31", "issue_date": "2024-01-16", "rating": "A", "rating_agency": "S&P", "sector": "Banks", "yield_to_maturity": 7.5, "country_of_risk": "Spain", "term_options": [1, 2, 3], "min_investment": 10000}'::jsonb,
 '{"frequency": "QUARTERLY", "payment_months": [1, 4, 7, 10]}'::jsonb, true),

('FIXED_INCOME', 'Banco Sabadell', 'bancosabadell.com', 'SAB-PERP', 'XS2471862040', 'EUR',
 '{"name": "Banco Sabadell 9.375% Perpetual AT1", "coupon_rate": 9.375, "maturity": "2099-12-31", "issue_date": "2023-01-18", "rating": "A-", "rating_agency": "S&P", "sector": "Banks", "yield_to_maturity": 9.375, "country_of_risk": "Spain", "term_options": [1, 2, 3], "min_investment": 10000}'::jsonb,
 '{"frequency": "BIANNUAL", "payment_months": [1, 7]}'::jsonb, true),

('FIXED_INCOME', 'Raiffeisen Bank International', 'rbinternational.com', 'RBI-PERP', 'XS2785548053', 'EUR',
 '{"name": "Raiffeisen Bank 7.375% Perpetual AT1", "coupon_rate": 7.375, "maturity": "2099-12-31", "issue_date": "2024-11-25", "rating": "A-", "rating_agency": "S&P", "sector": "Banks", "yield_to_maturity": 7.0, "country_of_risk": "Austria", "term_options": [1, 2, 3], "min_investment": 10000}'::jsonb,
 '{"frequency": "QUARTERLY", "payment_months": [2, 5, 8, 11]}'::jsonb, true),

('FIXED_INCOME', 'Crédit Agricole SA', 'credit-agricole.com', 'ACA-PERP', 'FR001400N2U2', 'EUR',
 '{"name": "Crédit Agricole SA 6.5% Perpetual", "coupon_rate": 6.5, "maturity": "2099-12-31", "issue_date": "2025-01-01", "rating": "A1 Stable", "rating_agency": "Moodys", "sector": "Banking", "yield_to_maturity": 6.5, "country_of_risk": "France", "term_options": [1, 2, 3], "min_investment": 10000}'::jsonb,
 '{"frequency": "ANNUAL", "payment_months": [1]}'::jsonb, true),

('FIXED_INCOME', 'Deutsche Bank', 'db.com', 'DBK-2038', 'DE000DB7UN09', 'EUR',
 '{"name": "Deutsche Bank 8.0% 15may2038", "coupon_rate": 8.0, "maturity": "2038-05-15", "issue_date": "2025-01-01", "rating": "A1 Stable", "rating_agency": "Moodys", "sector": "Banking", "yield_to_maturity": 8.0, "country_of_risk": "Germany", "term_options": [1, 2, 3], "min_investment": 10000}'::jsonb,
 '{"frequency": "ANNUAL", "payment_months": [5]}'::jsonb, true),

('FIXED_INCOME', 'Société Générale', 'societegenerale.com', 'GLE-PERP', 'XS0449487619', 'EUR',
 '{"name": "Société Générale 9.375% Perpetual", "coupon_rate": 9.375, "maturity": "2099-12-31", "issue_date": "2025-01-01", "rating": "A1 Stable", "rating_agency": "Moodys", "sector": "Banking", "yield_to_maturity": 9.375, "country_of_risk": "France", "term_options": [1, 2, 3], "min_investment": 10000}'::jsonb,
 '{"frequency": "ANNUAL", "payment_months": [1]}'::jsonb, true),

('FIXED_INCOME', 'Unicaja Banco', 'unicajabanco.com', 'UNI-2028', 'ES0380907073', 'EUR',
 '{"name": "Unicaja Banco 6.5% 10sep2028", "coupon_rate": 6.5, "maturity": "2028-09-10", "issue_date": "2025-01-01", "rating": "A3 Stable", "rating_agency": "Moodys", "sector": "Banking", "yield_to_maturity": 6.5, "country_of_risk": "Spain", "term_options": [1, 2], "min_investment": 10000}'::jsonb,
 '{"frequency": "BIANNUAL", "payment_months": [3, 9]}'::jsonb, true),

('FIXED_INCOME', 'UBS Group AG', 'ubs.com', 'UBS-2029', 'CH1214797172', 'EUR',
 '{"name": "UBS Group AG 7.75% 28feb2029", "coupon_rate": 7.75, "maturity": "2029-02-28", "issue_date": "2025-01-01", "rating": "A2 Stable", "rating_agency": "Moodys", "sector": "Banking", "yield_to_maturity": 7.75, "country_of_risk": "Switzerland", "term_options": [1, 2, 3], "min_investment": 10000}'::jsonb,
 '{"frequency": "ANNUAL", "payment_months": [2]}'::jsonb, true);

-- ============================================
-- MANAGED FUNDS (Kumbra Capital)
-- ============================================

INSERT INTO instruments (asset_class, issuer_name, issuer_domain, symbol, isin, currency, metadata_json, coupon_schedule_json, is_active) VALUES
('MANAGED_FUND', 'Kumbra Secure Income Fund', 'kumbra-capital.com', 'KSIF', null, 'AUD',
 '{"strategy": "Conservative fixed income with capital preservation focus", "fund_type": "Fixed Income", "benchmark": "Bloomberg AusBond Composite Index", "inception_date": "2020-01-01", "management_fee": 0.75, "performance_fee": 0, "distribution_policy": "Monthly", "min_investment": 5000, "description": "Capital preservation focused fixed income fund"}'::jsonb,
 '{"frequency": "MONTHLY", "payment_day": 15}'::jsonb, true),

('MANAGED_FUND', 'Kumbra Adventurous Fixed Income Fund', 'kumbra-capital.com', 'KAFIF', null, 'AUD',
 '{"strategy": "High-yield corporate bonds and emerging market debt", "fund_type": "Fixed Income", "benchmark": "50% Bloomberg Global High Yield / 50% JPM EMBI Global", "inception_date": "2019-06-01", "management_fee": 1.25, "performance_fee": 15, "distribution_policy": "Quarterly", "min_investment": 10000, "description": "High-yield focused bond fund with emerging market exposure"}'::jsonb,
 '{"frequency": "QUARTERLY", "payment_day": 20, "payment_months": [3, 6, 9, 12]}'::jsonb, true),

('MANAGED_FUND', 'Kumbra Crypto Managed Fund', 'kumbra-capital.com', 'KCMF', null, 'USD',
 '{"strategy": "Diversified digital asset portfolio with BTC, ETH, and select altcoins", "fund_type": "Cryptocurrency", "benchmark": "Custom crypto composite", "inception_date": "2021-03-01", "management_fee": 2, "performance_fee": 20, "distribution_policy": "Monthly", "min_investment": 5000, "description": "Multi-asset crypto fund with institutional-grade custody and diversified exposure to major cryptocurrencies"}'::jsonb,
 '{"frequency": "MONTHLY", "payment_day": 1}'::jsonb, true),

('MANAGED_FUND', 'Kumbra IPO/Pre-IPO Fund', 'kumbra-capital.com', 'KIPOF', null, 'USD',
 '{"strategy": "Late-stage private equity and IPO allocations", "fund_type": "Private Equity", "benchmark": "MSCI World Index + 500bps", "inception_date": "2022-01-01", "management_fee": 2.5, "performance_fee": 20, "distribution_policy": "Annual", "min_investment": 25000, "description": "Access to pre-IPO companies and IPO allocations with professional management"}'::jsonb,
 '{"frequency": "ANNUAL", "payment_day": 31, "payment_months": [12]}'::jsonb, true);

-- ============================================
-- GOLD CONTRACTS
-- ============================================

INSERT INTO instruments (asset_class, issuer_name, issuer_domain, symbol, isin, currency, metadata_json, coupon_schedule_json, is_active) VALUES
('GOLD_CONTRACT', 'Gold Forward Contract', 'kumbra-capital.com', 'XAU-FWD', null, 'USD',
 '{"type": "Forward", "settlement": "Cash", "underlying": "Gold (XAU)", "contract_size": "1 troy oz", "available_tenors": [3, 6, 12], "min_investment": 5000, "description": "Cash-settled gold forward contract with flexible tenor options"}'::jsonb,
 null, true),

('GOLD_CONTRACT', 'Gold Leveraged Contract', 'kumbra-capital.com', 'XAU-LEV', null, 'USD',
 '{"type": "Leveraged", "leverage": "5x", "settlement": "Cash", "underlying": "Gold (XAU)", "contract_size": "1 troy oz", "available_tenors": [3, 6, 12], "min_investment": 5000, "description": "5x leveraged gold exposure with cash settlement"}'::jsonb,
 null, true);

-- ============================================
-- PRE-IPO STOCKS
-- ============================================

INSERT INTO instruments (asset_class, issuer_name, issuer_domain, symbol, isin, currency, metadata_json, coupon_schedule_json, is_active) VALUES
('PRE_IPO', 'SpaceX', 'spacex.com', 'SPACEX', null, 'USD',
 '{"company_name": "Space Exploration Technologies Corp.", "sector": "Aerospace & Defense", "valuation": 180000000000, "price_per_share": 97, "min_investment": 25000, "expected_ipo": "2025-Q4", "description": "Leading space exploration and satellite internet provider with Starship and Starlink", "founded": 2002, "employees": 13000, "recent_round": "Series J", "investors": ["Fidelity", "Sequoia Capital", "Founders Fund"]}'::jsonb,
 null, true),

('PRE_IPO', 'Databricks', 'databricks.com', 'DATABRICKS', null, 'USD',
 '{"company_name": "Databricks Inc.", "sector": "Enterprise Software", "valuation": 43000000000, "price_per_share": 73.50, "min_investment": 25000, "expected_ipo": "2025-Q3", "description": "Unified analytics platform for big data and AI workloads", "founded": 2013, "employees": 6000, "recent_round": "Series I", "investors": ["Andreessen Horowitz", "NEA", "Coatue"]}'::jsonb,
 null, true),

('PRE_IPO', 'Stripe', 'stripe.com', 'STRIPE', null, 'USD',
 '{"company_name": "Stripe Inc.", "sector": "Financial Technology", "valuation": 65000000000, "price_per_share": 55, "min_investment": 25000, "expected_ipo": "2026-Q1", "description": "Global payment processing and financial infrastructure platform", "founded": 2010, "employees": 8000, "recent_round": "Series I", "investors": ["Sequoia Capital", "Thrive Capital", "General Catalyst"]}'::jsonb,
 null, true),

('PRE_IPO', 'Anthropic', 'anthropic.com', 'ANTHROPIC', null, 'USD',
 '{"company_name": "Anthropic PBC", "sector": "Artificial Intelligence", "valuation": 18000000000, "price_per_share": 120, "min_investment": 50000, "expected_ipo": "2026-Q2", "description": "AI safety and research company behind Claude AI assistant", "founded": 2021, "employees": 500, "recent_round": "Series C", "investors": ["Google", "Spark Capital", "Salesforce Ventures"]}'::jsonb,
 null, true),

('PRE_IPO', 'Canva', 'canva.com', 'CANVA', null, 'USD',
 '{"company_name": "Canva Pty Ltd", "sector": "Design Software", "valuation": 26000000000, "price_per_share": 32, "min_investment": 25000, "expected_ipo": "2025-Q4", "description": "Online graphic design platform with 150M+ users worldwide", "founded": 2013, "employees": 4000, "recent_round": "Series D", "investors": ["Blackbird Ventures", "Felicis Ventures", "Bond Capital"]}'::jsonb,
 null, true),

('PRE_IPO', 'Discord', 'discord.com', 'DISCORD', null, 'USD',
 '{"company_name": "Discord Inc.", "sector": "Communication & Social", "valuation": 15000000000, "price_per_share": 47, "min_investment": 25000, "expected_ipo": "2026-Q3", "description": "Communication platform with 500M+ registered users and growing gaming community", "founded": 2015, "employees": 700, "recent_round": "Series H", "investors": ["Greylock Partners", "Benchmark", "Tencent"]}'::jsonb,
 null, true),

('PRE_IPO', 'Chime', 'chime.com', 'CHIME', null, 'USD',
 '{"company_name": "Chime Financial Inc.", "sector": "Financial Technology", "valuation": 25000000000, "price_per_share": 85, "min_investment": 25000, "expected_ipo": "2025-Q3", "description": "Digital banking platform with no hidden fees serving 15M+ members", "founded": 2013, "employees": 1500, "recent_round": "Series G", "investors": ["DST Global", "Tiger Global", "Coatue"]}'::jsonb,
 null, true);
