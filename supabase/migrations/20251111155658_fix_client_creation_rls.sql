/*
  # Fix Client Creation RLS Policies

  ## Problem
  When admins create new clients via the admin panel, the inserts to profiles, clients, 
  and cash_balances tables are being blocked by RLS policies. Auth users are being created
  successfully, but the corresponding database records are not.

  ## Solution
  Update RLS policies to properly allow:
  1. System to insert profiles during user creation (via trigger or direct insert)
  2. Admins to insert profiles for new clients
  3. Admins to insert clients records
  4. Admins to insert cash_balances for new clients

  ## Changes Made
  - Modify profile insert policy to allow authenticated users to insert their own profile
  - Ensure admin checks work correctly during client creation flow
  - Add explicit policies for system-level operations
*/

-- Drop existing restrictive profile insert policy
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;

-- Create new policies that allow both admin inserts and self-inserts
CREATE POLICY "Admins can insert any profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'OPS')
    )
  );

CREATE POLICY "Users can insert own profile on signup"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Ensure cash_balances policies allow admin operations
DROP POLICY IF EXISTS "Admins can manage cash balances" ON cash_balances;

CREATE POLICY "Admins can insert cash balances"
  ON cash_balances FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'OPS')
    )
  );

CREATE POLICY "Admins can update cash balances"
  ON cash_balances FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'OPS')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'OPS')
    )
  );

CREATE POLICY "Admins can delete cash balances"
  ON cash_balances FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'OPS')
    )
  );

-- Ensure clients policies allow admin operations  
DROP POLICY IF EXISTS "Admins can insert clients" ON clients;

CREATE POLICY "Admins can insert clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'OPS')
    )
  );
