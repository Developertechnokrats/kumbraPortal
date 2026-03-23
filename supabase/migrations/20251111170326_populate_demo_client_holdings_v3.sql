/*
  # Populate Demo Client with Real Holdings v3

  ## Summary
  Adds a diverse portfolio of real holdings to demo@client.com from the available instruments

  ## Changes
  - Clear existing demo holdings
  - Add holdings across all asset classes: bonds, managed funds, gold, pre-IPO
  - Set realistic values and current prices
  - Include required term_months field
  - Update cash balance accordingly
*/

-- Clear existing holdings for demo client
DELETE FROM holdings WHERE client_id = 'd3e0c111-cccc-bbbb-aaaa-000000000001';

-- Add diverse holdings for demo client
INSERT INTO holdings (client_id, instrument_id, face_or_units, price, cost_basis, current_value, unrealised_pl, currency, status, start_date, term_months, maturity_date) VALUES
-- Bonds (5 holdings)
('d3e0c111-cccc-bbbb-aaaa-000000000001', 
 (SELECT id FROM instruments WHERE symbol = 'NAB-2039' LIMIT 1), 
 50000, 1.00, 50000, 52500, 2500, 'AUD', 'ACTIVE', '2024-06-15', 36, '2039-06-06'),

('d3e0c111-cccc-bbbb-aaaa-000000000001', 
 (SELECT id FROM instruments WHERE symbol = 'CBA-2039' LIMIT 1), 
 75000, 1.00, 75000, 77250, 2250, 'AUD', 'ACTIVE', '2024-07-20', 36, '2039-11-27'),

('d3e0c111-cccc-bbbb-aaaa-000000000001', 
 (SELECT id FROM instruments WHERE symbol = 'BMO-2027-8.4' LIMIT 1), 
 30000, 1.00, 30000, 31800, 1800, 'USD', 'ACTIVE', '2024-08-10', 24, '2027-12-16'),

('d3e0c111-cccc-bbbb-aaaa-000000000001', 
 (SELECT id FROM instruments WHERE symbol = 'GS-2042' LIMIT 1), 
 40000, 1.00, 40000, 43200, 3200, 'USD', 'ACTIVE', '2024-09-05', 36, '2042-05-19'),

('d3e0c111-cccc-bbbb-aaaa-000000000001', 
 (SELECT id FROM instruments WHERE symbol = 'DBK-2038' LIMIT 1), 
 25000, 1.00, 25000, 26500, 1500, 'EUR', 'ACTIVE', '2024-10-12', 36, '2038-05-15'),

-- Managed Funds (3 holdings)
('d3e0c111-cccc-bbbb-aaaa-000000000001', 
 (SELECT id FROM instruments WHERE symbol = 'QSIF' LIMIT 1), 
 15000, 1.00, 15000, 16200, 1200, 'AUD', 'ACTIVE', '2024-03-15', 12, NULL),

('d3e0c111-cccc-bbbb-aaaa-000000000001', 
 (SELECT id FROM instruments WHERE symbol = 'QCMF' LIMIT 1), 
 10000, 1.00, 10000, 13500, 3500, 'USD', 'ACTIVE', '2024-04-20', 12, NULL),

('d3e0c111-cccc-bbbb-aaaa-000000000001', 
 (SELECT id FROM instruments WHERE symbol = 'QAFIF' LIMIT 1), 
 20000, 1.00, 20000, 21800, 1800, 'AUD', 'ACTIVE', '2024-05-10', 12, NULL),

-- Gold Contracts (1 holding)
('d3e0c111-cccc-bbbb-aaaa-000000000001', 
 (SELECT id FROM instruments WHERE symbol = 'XAU-FWD' LIMIT 1), 
 5, 2400.00, 12000, 13200, 1200, 'USD', 'ACTIVE', '2024-11-01', 6, '2025-05-01'),

-- Pre-IPO (2 holdings)
('d3e0c111-cccc-bbbb-aaaa-000000000001', 
 (SELECT id FROM instruments WHERE symbol = 'SPACEX' LIMIT 1), 
 500, 97.00, 48500, 48500, 0, 'USD', 'ACTIVE', '2024-08-15', 12, NULL),

('d3e0c111-cccc-bbbb-aaaa-000000000001', 
 (SELECT id FROM instruments WHERE symbol = 'DATABRICKS' LIMIT 1), 
 350, 73.50, 25725, 25725, 0, 'USD', 'ACTIVE', '2024-09-20', 12, NULL);

-- Update cash balance
UPDATE cash_balances 
SET balance = 45000 
WHERE client_id = 'd3e0c111-cccc-bbbb-aaaa-000000000001' 
AND currency = 'GBP';
