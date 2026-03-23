/*
  # Row Level Security Policies

  ## Overview
  Comprehensive RLS policies enforcing role-based access control:
  - SUPER_ADMIN: Full access to everything
  - ADMIN/OPS: Manage clients, holdings, documents, transactions
  - ADVISOR: Read assigned clients only
  - CLIENT: Own data only
  - AUDITOR: Read-only access to all data

  ## Security Principles
  1. All policies check authentication via auth.uid()
  2. Clients can only access their own data
  3. Advisors can only access assigned clients
  4. Admins (SUPER_ADMIN, ADMIN, OPS) have full access
  5. Auditors have read-only access to all
  6. Demo accounts have read-only restrictions enforced at application layer

  ## Policy Structure
  - SELECT policies use USING clause
  - INSERT policies use WITH CHECK clause
  - UPDATE policies use both USING and WITH CHECK
  - DELETE policies use USING clause
*/

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('SUPER_ADMIN', 'ADMIN', 'OPS')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if user is auditor
CREATE OR REPLACE FUNCTION is_auditor()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'AUDITOR'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to get client_id for current user
CREATE OR REPLACE FUNCTION get_client_id()
RETURNS uuid AS $$
  SELECT id FROM clients WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if advisor can access client
CREATE OR REPLACE FUNCTION can_advisor_access_client(target_client_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM clients c
    JOIN advisors a ON a.id = c.advisor_id
    WHERE c.id = target_client_id
    AND a.user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- PROFILES
-- ============================================

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Auditors can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_auditor());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- ADVISORS
-- ============================================

CREATE POLICY "Advisors can view own record"
  ON advisors FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all advisors"
  ON advisors FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Auditors can view all advisors"
  ON advisors FOR SELECT
  TO authenticated
  USING (is_auditor());

CREATE POLICY "Admins can insert advisors"
  ON advisors FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update advisors"
  ON advisors FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete advisors"
  ON advisors FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================
-- CLIENTS
-- ============================================

CREATE POLICY "Clients can view own record"
  ON clients FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Advisors can view assigned clients"
  ON clients FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM advisors a
      WHERE a.user_id = auth.uid()
      AND a.id = clients.advisor_id
    )
  );

CREATE POLICY "Admins can view all clients"
  ON clients FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Auditors can view all clients"
  ON clients FOR SELECT
  TO authenticated
  USING (is_auditor());

CREATE POLICY "Admins can insert clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Clients can update own record"
  ON clients FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update any client"
  ON clients FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- CASH BALANCES
-- ============================================

CREATE POLICY "Clients can view own cash balances"
  ON cash_balances FOR SELECT
  TO authenticated
  USING (client_id = get_client_id());

CREATE POLICY "Advisors can view assigned clients' cash"
  ON cash_balances FOR SELECT
  TO authenticated
  USING (can_advisor_access_client(client_id));

CREATE POLICY "Admins can view all cash balances"
  ON cash_balances FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Auditors can view all cash balances"
  ON cash_balances FOR SELECT
  TO authenticated
  USING (is_auditor());

CREATE POLICY "Admins can manage cash balances"
  ON cash_balances FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- CLIENT BANK ACCOUNTS
-- ============================================

CREATE POLICY "Clients can view own bank accounts"
  ON client_bank_accounts FOR SELECT
  TO authenticated
  USING (client_id = get_client_id());

CREATE POLICY "Advisors can view assigned clients' banks"
  ON client_bank_accounts FOR SELECT
  TO authenticated
  USING (can_advisor_access_client(client_id));

CREATE POLICY "Admins can view all bank accounts"
  ON client_bank_accounts FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Auditors can view all bank accounts"
  ON client_bank_accounts FOR SELECT
  TO authenticated
  USING (is_auditor());

CREATE POLICY "Clients can insert own bank accounts"
  ON client_bank_accounts FOR INSERT
  TO authenticated
  WITH CHECK (client_id = get_client_id());

CREATE POLICY "Clients can update own bank accounts"
  ON client_bank_accounts FOR UPDATE
  TO authenticated
  USING (client_id = get_client_id())
  WITH CHECK (client_id = get_client_id());

CREATE POLICY "Admins can manage all bank accounts"
  ON client_bank_accounts FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- INSTRUMENTS (visible to all authenticated)
-- ============================================

CREATE POLICY "Authenticated users can view instruments"
  ON instruments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage instruments"
  ON instruments FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- HOLDINGS
-- ============================================

CREATE POLICY "Clients can view own holdings"
  ON holdings FOR SELECT
  TO authenticated
  USING (client_id = get_client_id());

CREATE POLICY "Advisors can view assigned clients' holdings"
  ON holdings FOR SELECT
  TO authenticated
  USING (can_advisor_access_client(client_id));

CREATE POLICY "Admins can view all holdings"
  ON holdings FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Auditors can view all holdings"
  ON holdings FOR SELECT
  TO authenticated
  USING (is_auditor());

CREATE POLICY "Admins can manage holdings"
  ON holdings FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- CASHFLOWS
-- ============================================

CREATE POLICY "Clients can view own cashflows"
  ON cashflows FOR SELECT
  TO authenticated
  USING (client_id = get_client_id());

CREATE POLICY "Advisors can view assigned clients' cashflows"
  ON cashflows FOR SELECT
  TO authenticated
  USING (can_advisor_access_client(client_id));

CREATE POLICY "Admins can view all cashflows"
  ON cashflows FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Auditors can view all cashflows"
  ON cashflows FOR SELECT
  TO authenticated
  USING (is_auditor());

CREATE POLICY "Admins can manage cashflows"
  ON cashflows FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- TRANSACTIONS
-- ============================================

CREATE POLICY "Clients can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (client_id = get_client_id());

CREATE POLICY "Advisors can view assigned clients' transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (can_advisor_access_client(client_id));

CREATE POLICY "Admins can view all transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Auditors can view all transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (is_auditor());

CREATE POLICY "Admins can manage transactions"
  ON transactions FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- DOCUMENTS
-- ============================================

CREATE POLICY "Clients can view own documents"
  ON documents FOR SELECT
  TO authenticated
  USING (client_id = get_client_id());

CREATE POLICY "Advisors can view assigned clients' documents"
  ON documents FOR SELECT
  TO authenticated
  USING (can_advisor_access_client(client_id));

CREATE POLICY "Admins can view all documents"
  ON documents FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Auditors can view all documents"
  ON documents FOR SELECT
  TO authenticated
  USING (is_auditor());

CREATE POLICY "Clients can upload own documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (client_id = get_client_id());

CREATE POLICY "Advisors can upload for assigned clients"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (can_advisor_access_client(client_id));

CREATE POLICY "Admins can manage all documents"
  ON documents FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- MESSAGE THREADS
-- ============================================

CREATE POLICY "Users can view threads they're in"
  ON message_threads FOR SELECT
  TO authenticated
  USING (auth.uid() = ANY(participants));

CREATE POLICY "Admins can view all threads"
  ON message_threads FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Clients can create threads"
  ON message_threads FOR INSERT
  TO authenticated
  WITH CHECK (client_id = get_client_id());

CREATE POLICY "Advisors can create threads with assigned clients"
  ON message_threads FOR INSERT
  TO authenticated
  WITH CHECK (can_advisor_access_client(client_id));

CREATE POLICY "Admins can manage all threads"
  ON message_threads FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- MESSAGES
-- ============================================

CREATE POLICY "Users can view messages in their threads"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM message_threads mt
      WHERE mt.id = messages.thread_id
      AND auth.uid() = ANY(mt.participants)
    )
  );

CREATE POLICY "Admins can view all messages"
  ON messages FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Thread participants can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM message_threads mt
      WHERE mt.id = thread_id
      AND auth.uid() = ANY(mt.participants)
    )
  );

CREATE POLICY "Admins can manage all messages"
  ON messages FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- FX RATES (read by all, write by admins)
-- ============================================

CREATE POLICY "Authenticated users can view fx rates"
  ON fx_rates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage fx rates"
  ON fx_rates FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- APPLICATIONS
-- ============================================

CREATE POLICY "Admins can view all applications"
  ON applications FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Anyone can submit applications"
  ON applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage applications"
  ON applications FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE POLICY "Clients can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (client_id = get_client_id());

CREATE POLICY "Admins can view all notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Clients can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (client_id = get_client_id())
  WITH CHECK (client_id = get_client_id());

CREATE POLICY "Admins can manage all notifications"
  ON notifications FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- AUDIT LOGS (read by admins/auditors only)
-- ============================================

CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Auditors can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (is_auditor());

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- SYSTEM CONFIG (admin only)
-- ============================================

CREATE POLICY "Admins can view system config"
  ON system_config FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can manage system config"
  ON system_config FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());