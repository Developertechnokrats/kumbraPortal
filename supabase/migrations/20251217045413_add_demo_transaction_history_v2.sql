/*
  # Add Comprehensive Demo Transaction History
  
  1. Purpose
    - Populate demo client account with realistic transaction history
    - Show variety of transaction types across multiple currencies
    - Demonstrate complete cash flow scenarios
  
  2. Transaction Types Included
    - Incoming wire transfers (deposits)
    - Incoming crypto transfers
    - Incoming dividend payments
    - Outgoing investment funding
    - Currency exchange (FX) transactions
    - Outgoing transfers to personal bank accounts
  
  3. Currencies
    - GBP, USD, EUR transactions
    - Multi-currency balance demonstration
*/

DO $$
DECLARE
  v_demo_client_id uuid;
  v_admin_id uuid;
  v_running_balance_gbp numeric := 0;
  v_running_balance_usd numeric := 0;
  v_running_balance_eur numeric := 0;
BEGIN
  -- Get demo client ID by joining with auth.users
  SELECT c.id INTO v_demo_client_id
  FROM clients c
  JOIN auth.users u ON c.user_id = u.id
  WHERE u.email = 'demo@client.com'
  LIMIT 1;
  
  -- Get admin user ID
  SELECT id INTO v_admin_id
  FROM auth.users
  WHERE email = 'admin@kumbrawealth.com'
  LIMIT 1;
  
  -- If admin doesn't exist, use demo client user_id as creator
  IF v_admin_id IS NULL THEN
    SELECT user_id INTO v_admin_id
    FROM clients
    WHERE id = v_demo_client_id;
  END IF;
  
  IF v_demo_client_id IS NOT NULL THEN
    
    -- Clear existing transactions for demo client to avoid duplicates
    DELETE FROM cash_ledger WHERE client_id = v_demo_client_id;
    
    -- Transaction 1: Initial wire deposit in GBP (3 months ago)
    v_running_balance_gbp := 50000.00;
    INSERT INTO cash_ledger (
      client_id, transaction_type, currency, amount, running_balance,
      status, reference, notes, created_at, approved_at, approved_by, created_by
    ) VALUES (
      v_demo_client_id, 'DEPOSIT', 'GBP', 50000.00, v_running_balance_gbp,
      'APPROVED', 'WIRE-GB-2024-09-15-001', 'Initial wire transfer from Barclays Bank',
      NOW() - INTERVAL '90 days', NOW() - INTERVAL '90 days', v_admin_id, v_admin_id
    );
    
    -- Transaction 2: Wire deposit in USD (2.5 months ago)
    v_running_balance_usd := 75000.00;
    INSERT INTO cash_ledger (
      client_id, transaction_type, currency, amount, running_balance,
      status, reference, notes, created_at, approved_at, approved_by, created_by
    ) VALUES (
      v_demo_client_id, 'DEPOSIT', 'USD', 75000.00, v_running_balance_usd,
      'APPROVED', 'WIRE-US-2024-09-28-003', 'Wire transfer from Chase Bank',
      NOW() - INTERVAL '75 days', NOW() - INTERVAL '75 days', v_admin_id, v_admin_id
    );
    
    -- Transaction 3: Crypto transfer in EUR (2 months ago)
    v_running_balance_eur := 30000.00;
    INSERT INTO cash_ledger (
      client_id, transaction_type, currency, amount, running_balance,
      status, reference, notes, created_at, approved_at, approved_by, created_by
    ) VALUES (
      v_demo_client_id, 'DEPOSIT', 'EUR', 30000.00, v_running_balance_eur,
      'APPROVED', 'CRYPTO-EUR-2024-10-10-BTC', 'Bitcoin conversion to EUR via Kraken',
      NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days', v_admin_id, v_admin_id
    );
    
    -- Transaction 4: Investment funding - Bond purchase in GBP (2 months ago)
    v_running_balance_gbp := v_running_balance_gbp - 25000.00;
    INSERT INTO cash_ledger (
      client_id, transaction_type, currency, amount, running_balance,
      status, reference, notes, created_at, approved_at, approved_by, created_by
    ) VALUES (
      v_demo_client_id, 'INVESTMENT_FUNDING', 'GBP', -25000.00, v_running_balance_gbp,
      'APPROVED', 'INV-BOND-GB-001', 'Purchase of UK Government Bond 4.25% 2027',
      NOW() - INTERVAL '58 days', NOW() - INTERVAL '58 days', v_admin_id, v_admin_id
    );
    
    -- Transaction 5: Dividend payment in USD (1.5 months ago)
    v_running_balance_usd := v_running_balance_usd + 2340.50;
    INSERT INTO cash_ledger (
      client_id, transaction_type, currency, amount, running_balance,
      status, reference, notes, created_at, approved_at, approved_by, created_by
    ) VALUES (
      v_demo_client_id, 'INTEREST', 'USD', 2340.50, v_running_balance_usd,
      'APPROVED', 'DIV-US-CORP-2024-Q3', 'Quarterly dividend payment - US Corporate Bonds',
      NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days', v_admin_id, v_admin_id
    );
    
    -- Transaction 6: Wire deposit in GBP (1 month ago)
    v_running_balance_gbp := v_running_balance_gbp + 30000.00;
    INSERT INTO cash_ledger (
      client_id, transaction_type, currency, amount, running_balance,
      status, reference, notes, created_at, approved_at, approved_by, created_by
    ) VALUES (
      v_demo_client_id, 'DEPOSIT', 'GBP', 30000.00, v_running_balance_gbp,
      'APPROVED', 'WIRE-GB-2024-11-15-007', 'Wire transfer from HSBC',
      NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days', v_admin_id, v_admin_id
    );
    
    -- Transaction 7: FX Conversion - GBP to EUR (3 weeks ago)
    v_running_balance_gbp := v_running_balance_gbp - 10000.00;
    INSERT INTO cash_ledger (
      client_id, transaction_type, currency, amount, running_balance,
      status, reference, notes, fx_rate, fx_currency_from, fx_currency_to,
      created_at, approved_at, approved_by, created_by
    ) VALUES (
      v_demo_client_id, 'FX_CONVERSION', 'GBP', -10000.00, v_running_balance_gbp,
      'APPROVED', 'FX-2024-11-24-001', 'Currency exchange GBP to EUR',
      1.1850, 'GBP', 'EUR',
      NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days', v_admin_id, v_admin_id
    );
    
    v_running_balance_eur := v_running_balance_eur + 11850.00;
    INSERT INTO cash_ledger (
      client_id, transaction_type, currency, amount, running_balance,
      status, reference, notes, fx_rate, fx_currency_from, fx_currency_to,
      created_at, approved_at, approved_by, created_by
    ) VALUES (
      v_demo_client_id, 'FX_CONVERSION', 'EUR', 11850.00, v_running_balance_eur,
      'APPROVED', 'FX-2024-11-24-001', 'Currency exchange GBP to EUR',
      1.1850, 'GBP', 'EUR',
      NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days', v_admin_id, v_admin_id
    );
    
    -- Transaction 8: Crypto transfer in USD (2 weeks ago)
    v_running_balance_usd := v_running_balance_usd + 12500.00;
    INSERT INTO cash_ledger (
      client_id, transaction_type, currency, amount, running_balance,
      status, reference, notes, created_at, approved_at, approved_by, created_by
    ) VALUES (
      v_demo_client_id, 'DEPOSIT', 'USD', 12500.00, v_running_balance_usd,
      'APPROVED', 'CRYPTO-USD-2024-12-01-ETH', 'Ethereum conversion to USD via Coinbase',
      NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', v_admin_id, v_admin_id
    );
    
    -- Transaction 9: Investment funding - Pre-IPO purchase in USD (10 days ago)
    v_running_balance_usd := v_running_balance_usd - 50000.00;
    INSERT INTO cash_ledger (
      client_id, transaction_type, currency, amount, running_balance,
      status, reference, notes, created_at, approved_at, approved_by, created_by
    ) VALUES (
      v_demo_client_id, 'INVESTMENT_FUNDING', 'USD', -50000.00, v_running_balance_usd,
      'APPROVED', 'INV-IPO-SPACEX-001', 'SpaceX Pre-IPO Share Purchase',
      NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', v_admin_id, v_admin_id
    );
    
    -- Transaction 10: Dividend payment in GBP (1 week ago)
    v_running_balance_gbp := v_running_balance_gbp + 437.50;
    INSERT INTO cash_ledger (
      client_id, transaction_type, currency, amount, running_balance,
      status, reference, notes, created_at, approved_at, approved_by, created_by
    ) VALUES (
      v_demo_client_id, 'INTEREST', 'GBP', 437.50, v_running_balance_gbp,
      'APPROVED', 'INT-GB-BOND-2024-Q4', 'Quarterly interest payment - UK Government Bonds',
      NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', v_admin_id, v_admin_id
    );
    
    -- Transaction 11: Withdrawal to personal bank account in EUR (5 days ago)
    v_running_balance_eur := v_running_balance_eur - 5000.00;
    INSERT INTO cash_ledger (
      client_id, transaction_type, currency, amount, running_balance,
      status, reference, notes, created_at, approved_at, approved_by, created_by
    ) VALUES (
      v_demo_client_id, 'WITHDRAWAL', 'EUR', -5000.00, v_running_balance_eur,
      'APPROVED', 'WD-EUR-2024-12-10-BNP', 'Wire transfer to BNP Paribas personal account',
      NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', v_admin_id, v_admin_id
    );
    
    -- Transaction 12: FX Conversion - USD to GBP (3 days ago)
    v_running_balance_usd := v_running_balance_usd - 20000.00;
    INSERT INTO cash_ledger (
      client_id, transaction_type, currency, amount, running_balance,
      status, reference, notes, fx_rate, fx_currency_from, fx_currency_to,
      created_at, approved_at, approved_by, created_by
    ) VALUES (
      v_demo_client_id, 'FX_CONVERSION', 'USD', -20000.00, v_running_balance_usd,
      'APPROVED', 'FX-2024-12-12-002', 'Currency exchange USD to GBP',
      0.7850, 'USD', 'GBP',
      NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', v_admin_id, v_admin_id
    );
    
    v_running_balance_gbp := v_running_balance_gbp + 15700.00;
    INSERT INTO cash_ledger (
      client_id, transaction_type, currency, amount, running_balance,
      status, reference, notes, fx_rate, fx_currency_from, fx_currency_to,
      created_at, approved_at, approved_by, created_by
    ) VALUES (
      v_demo_client_id, 'FX_CONVERSION', 'GBP', 15700.00, v_running_balance_gbp,
      'APPROVED', 'FX-2024-12-12-002', 'Currency exchange USD to GBP',
      0.7850, 'USD', 'GBP',
      NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', v_admin_id, v_admin_id
    );
    
    -- Transaction 13: Investment funding - Bond purchase in EUR (2 days ago)
    v_running_balance_eur := v_running_balance_eur - 15000.00;
    INSERT INTO cash_ledger (
      client_id, transaction_type, currency, amount, running_balance,
      status, reference, notes, created_at, approved_at, approved_by, created_by
    ) VALUES (
      v_demo_client_id, 'INVESTMENT_FUNDING', 'EUR', -15000.00, v_running_balance_eur,
      'APPROVED', 'INV-BOND-EUR-003', 'German Bund 3.5% 2028 Purchase',
      NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', v_admin_id, v_admin_id
    );
    
    -- Transaction 14: Dividend payment in EUR (1 day ago)
    v_running_balance_eur := v_running_balance_eur + 525.00;
    INSERT INTO cash_ledger (
      client_id, transaction_type, currency, amount, running_balance,
      status, reference, notes, created_at, approved_at, approved_by, created_by
    ) VALUES (
      v_demo_client_id, 'INTEREST', 'EUR', 525.00, v_running_balance_eur,
      'APPROVED', 'INT-EUR-CORP-2024-Q4', 'Quarterly interest - European Corporate Bonds',
      NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', v_admin_id, v_admin_id
    );
    
    -- Transaction 15: Withdrawal to personal bank account in GBP (today)
    v_running_balance_gbp := v_running_balance_gbp - 10000.00;
    INSERT INTO cash_ledger (
      client_id, transaction_type, currency, amount, running_balance,
      status, reference, notes, created_at, approved_at, approved_by, created_by
    ) VALUES (
      v_demo_client_id, 'WITHDRAWAL', 'GBP', -10000.00, v_running_balance_gbp,
      'APPROVED', 'WD-GBP-2024-12-15-HSBC', 'Wire transfer to HSBC personal account',
      NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours', v_admin_id, v_admin_id
    );
    
    -- Update the client cash accounts with final balances
    UPDATE client_cash_accounts
    SET balance = v_running_balance_gbp, updated_at = NOW()
    WHERE client_id = v_demo_client_id AND currency = 'GBP';
    
    UPDATE client_cash_accounts
    SET balance = v_running_balance_usd, updated_at = NOW()
    WHERE client_id = v_demo_client_id AND currency = 'USD';
    
    UPDATE client_cash_accounts
    SET balance = v_running_balance_eur, updated_at = NOW()
    WHERE client_id = v_demo_client_id AND currency = 'EUR';
    
  END IF;
END $$;
