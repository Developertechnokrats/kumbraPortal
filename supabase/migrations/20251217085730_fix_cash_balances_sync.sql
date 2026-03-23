/*
  # Fix Cash Balance Synchronization

  This migration recalculates and fixes all cash balances to ensure:
  1. Running balances in cash_ledger are correct
  2. client_cash_accounts balances match the final ledger state

  ## Process:
  - Calculate correct running balances for each currency/client
  - Update cash_ledger with correct running_balance values
  - Update client_cash_accounts with final balances
*/

DO $$
DECLARE
  rec RECORD;
  running_total NUMERIC(18,2);
  prev_currency TEXT;
  prev_client_id UUID;
BEGIN
  prev_currency := '';
  prev_client_id := NULL;
  running_total := 0;
  
  FOR rec IN 
    SELECT id, client_id, currency, amount, created_at
    FROM cash_ledger
    WHERE status = 'APPROVED'
    ORDER BY client_id, currency, created_at ASC
  LOOP
    IF rec.client_id IS DISTINCT FROM prev_client_id OR rec.currency IS DISTINCT FROM prev_currency THEN
      running_total := 0;
      prev_client_id := rec.client_id;
      prev_currency := rec.currency;
    END IF;
    
    running_total := running_total + rec.amount;
    
    UPDATE cash_ledger
    SET running_balance = running_total
    WHERE id = rec.id;
  END LOOP;
END $$;

UPDATE client_cash_accounts cca
SET balance = COALESCE(
  (
    SELECT cl.running_balance
    FROM cash_ledger cl
    WHERE cl.client_id = cca.client_id
      AND cl.currency = cca.currency
      AND cl.status = 'APPROVED'
    ORDER BY cl.created_at DESC
    LIMIT 1
  ),
  0
),
updated_at = NOW();
