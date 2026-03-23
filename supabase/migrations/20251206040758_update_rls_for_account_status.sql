/*
  # Update RLS Policies for Account Status

  ## Overview
  Update Row Level Security policies to enforce account status restrictions.
  Suspended and deleted accounts should not be able to access the portal.

  ## Security Rules
    - SUSPENDED accounts: Cannot access portal, cannot perform any operations
    - DELETED accounts: Cannot access portal, cannot perform any operations
    - ACTIVE accounts: Full access as per existing RLS policies
    - Admins: Can always view all accounts regardless of status

  ## Important Notes
    - This migration updates existing RLS policies to check account_status
    - Only affects CLIENT role users
    - Admins maintain full access for account management
*/

-- Drop and recreate clients policies to include account status check

-- Clients can read their own data (only if ACTIVE)
DROP POLICY IF EXISTS "Clients can read own data" ON clients;
CREATE POLICY "Clients can read own data"
  ON clients FOR SELECT
  TO authenticated
  USING (
    -- Admins can see all clients
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('SUPER_ADMIN', 'ADMIN', 'OPS', 'ADVISOR')
    )
    OR
    -- Clients can only see their own data if account is ACTIVE
    (user_id = auth.uid() AND (account_status = 'ACTIVE' OR account_status IS NULL))
  );

-- Update holdings policies to check account status
DROP POLICY IF EXISTS "Clients can read own holdings" ON holdings;
CREATE POLICY "Clients can read own holdings"
  ON holdings FOR SELECT
  TO authenticated
  USING (
    -- Admins can see all holdings
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('SUPER_ADMIN', 'ADMIN', 'OPS', 'ADVISOR')
    )
    OR
    -- Clients can only see their holdings if account is ACTIVE
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = holdings.client_id
      AND clients.user_id = auth.uid()
      AND (clients.account_status = 'ACTIVE' OR clients.account_status IS NULL)
    )
  );

-- Update cash_balances policies to check account status
DROP POLICY IF EXISTS "Clients can read own cash balances" ON cash_balances;
CREATE POLICY "Clients can read own cash balances"
  ON cash_balances FOR SELECT
  TO authenticated
  USING (
    -- Admins can see all balances
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('SUPER_ADMIN', 'ADMIN', 'OPS', 'ADVISOR')
    )
    OR
    -- Clients can only see their balances if account is ACTIVE
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = cash_balances.client_id
      AND clients.user_id = auth.uid()
      AND (clients.account_status = 'ACTIVE' OR clients.account_status IS NULL)
    )
  );

-- Update transactions policies to check account status
DROP POLICY IF EXISTS "Clients can read own transactions" ON transactions;
CREATE POLICY "Clients can read own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    -- Admins can see all transactions
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('SUPER_ADMIN', 'ADMIN', 'OPS', 'ADVISOR')
    )
    OR
    -- Clients can only see their transactions if account is ACTIVE
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = transactions.client_id
      AND clients.user_id = auth.uid()
      AND (clients.account_status = 'ACTIVE' OR clients.account_status IS NULL)
    )
  );

-- Update documents policies to check account status
DROP POLICY IF EXISTS "Clients can read own documents" ON documents;
CREATE POLICY "Clients can read own documents"
  ON documents FOR SELECT
  TO authenticated
  USING (
    -- Admins can see all documents
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('SUPER_ADMIN', 'ADMIN', 'OPS')
    )
    OR
    -- Clients can only see their documents if account is ACTIVE
    (client_id IN (
      SELECT id FROM clients
      WHERE clients.user_id = auth.uid()
      AND (clients.account_status = 'ACTIVE' OR clients.account_status IS NULL)
    ))
  );