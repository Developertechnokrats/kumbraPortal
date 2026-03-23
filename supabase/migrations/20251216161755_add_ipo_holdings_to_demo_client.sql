/*
  # Add Pre-IPO Holdings to Demo Client

  1. Updates
    - Add Pre-IPO holdings to existing demo@client.com user
    - SpaceX: 50 shares
    - Databricks: 100 shares
    - Klarna: 150 shares
    - Stripe: 200 shares
  
  2. Changes
    - Add USD cash balance if needed
    - Calculate proper cost basis and current values
*/

DO $$
DECLARE
  demo_user_id uuid;
  demo_client_id uuid;
  spacex_id uuid;
  databricks_id uuid;
  klarna_id uuid;
  stripe_id uuid;
  spacex_price numeric;
  databricks_price numeric;
  klarna_price numeric;
  stripe_price numeric;
BEGIN
  -- Get demo user and client IDs
  SELECT id INTO demo_user_id FROM auth.users WHERE email = 'demo@client.com';
  
  IF demo_user_id IS NULL THEN
    RAISE NOTICE 'Demo user not found';
    RETURN;
  END IF;

  SELECT id INTO demo_client_id FROM clients WHERE user_id = demo_user_id;
  
  IF demo_client_id IS NULL THEN
    RAISE NOTICE 'Demo client not found';
    RETURN;
  END IF;

  -- Get instrument IDs and current prices
  SELECT id, (metadata_json->>'share_price')::numeric INTO spacex_id, spacex_price 
  FROM instruments WHERE symbol = 'SPACEX' AND asset_class = 'PRE_IPO';
  
  SELECT id, (metadata_json->>'share_price')::numeric INTO databricks_id, databricks_price 
  FROM instruments WHERE symbol = 'DATABRICKS' AND asset_class = 'PRE_IPO';
  
  SELECT id, (metadata_json->>'share_price')::numeric INTO klarna_id, klarna_price 
  FROM instruments WHERE symbol = 'KLARNA' AND asset_class = 'PRE_IPO';
  
  SELECT id, (metadata_json->>'share_price')::numeric INTO stripe_id, stripe_price 
  FROM instruments WHERE symbol = 'STRIPE' AND asset_class = 'PRE_IPO';

  -- Update client base currency to USD
  UPDATE clients SET base_currency = 'USD' WHERE id = demo_client_id;

  -- Ensure USD cash balance exists
  INSERT INTO cash_balances (client_id, currency, balance)
  VALUES (demo_client_id, 'USD', 50000.00)
  ON CONFLICT (client_id, currency) DO UPDATE SET
    balance = GREATEST(cash_balances.balance, 50000.00);

  -- Delete any existing IPO holdings for this client to avoid duplicates
  DELETE FROM holdings 
  WHERE client_id = demo_client_id 
  AND instrument_id IN (spacex_id, databricks_id, klarna_id, stripe_id);

  -- Create SpaceX holding
  IF spacex_id IS NOT NULL THEN
    INSERT INTO holdings (
      client_id,
      instrument_id,
      currency,
      face_or_units,
      price,
      cost_basis,
      current_value,
      unrealised_pl,
      start_date,
      term_months,
      status
    ) VALUES (
      demo_client_id,
      spacex_id,
      'USD',
      50,
      spacex_price,
      50 * 105.00,
      50 * spacex_price,
      50 * (spacex_price - 105.00),
      '2025-02-01',
      0,
      'ACTIVE'
    );
  END IF;

  -- Create Databricks holding
  IF databricks_id IS NOT NULL THEN
    INSERT INTO holdings (
      client_id,
      instrument_id,
      currency,
      face_or_units,
      price,
      cost_basis,
      current_value,
      unrealised_pl,
      start_date,
      term_months,
      status
    ) VALUES (
      demo_client_id,
      databricks_id,
      'USD',
      100,
      databricks_price,
      100 * 70.00,
      100 * databricks_price,
      100 * (databricks_price - 70.00),
      '2025-02-10',
      0,
      'ACTIVE'
    );
  END IF;

  -- Create Klarna holding
  IF klarna_id IS NOT NULL THEN
    INSERT INTO holdings (
      client_id,
      instrument_id,
      currency,
      face_or_units,
      price,
      cost_basis,
      current_value,
      unrealised_pl,
      start_date,
      term_months,
      status
    ) VALUES (
      demo_client_id,
      klarna_id,
      'USD',
      150,
      klarna_price,
      150 * 42.00,
      150 * klarna_price,
      150 * (klarna_price - 42.00),
      '2025-03-01',
      0,
      'ACTIVE'
    );
  END IF;

  -- Create Stripe holding
  IF stripe_id IS NOT NULL THEN
    INSERT INTO holdings (
      client_id,
      instrument_id,
      currency,
      face_or_units,
      price,
      cost_basis,
      current_value,
      unrealised_pl,
      start_date,
      term_months,
      status
    ) VALUES (
      demo_client_id,
      stripe_id,
      'USD',
      200,
      stripe_price,
      200 * 25.00,
      200 * stripe_price,
      200 * (stripe_price - 25.00),
      '2025-03-15',
      0,
      'ACTIVE'
    );
  END IF;

  RAISE NOTICE 'Pre-IPO holdings added to demo client successfully';
END $$;