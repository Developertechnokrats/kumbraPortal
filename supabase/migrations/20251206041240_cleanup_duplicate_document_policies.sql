-- Cleanup Duplicate Document Policies
--
-- Overview:
-- Remove all duplicate and overlapping RLS policies on documents table
-- Create clean, simple policies that cover all use cases
--
-- Final policies:
-- - Admins can manage all documents (SELECT, INSERT, UPDATE, DELETE)
-- - Advisors can view assigned clients documents
-- - Clients can view their own documents (only if account is ACTIVE)
-- - Clients can insert their own documents

-- Drop ALL existing document policies
DROP POLICY IF EXISTS "Admins can view all documents" ON documents;
DROP POLICY IF EXISTS "Clients can view their own documents" ON documents;
DROP POLICY IF EXISTS "Admins can insert documents" ON documents;
DROP POLICY IF EXISTS "Admins can update documents" ON documents;
DROP POLICY IF EXISTS "Admins can delete documents" ON documents;
DROP POLICY IF EXISTS "Admins can manage all documents" ON documents;
DROP POLICY IF EXISTS "Advisors can view assigned clients' documents" ON documents;
DROP POLICY IF EXISTS "Auditors can view all documents" ON documents;
DROP POLICY IF EXISTS "Clients can view own documents" ON documents;
DROP POLICY IF EXISTS "Clients can upload own documents" ON documents;
DROP POLICY IF EXISTS "Clients can insert their own document records" ON documents;
DROP POLICY IF EXISTS "Clients can view own KYC documents" ON documents;
DROP POLICY IF EXISTS "Clients can upload KYC documents" ON documents;
DROP POLICY IF EXISTS "Admins can manage all KYC documents" ON documents;
DROP POLICY IF EXISTS "Clients can view own visible documents" ON documents;
DROP POLICY IF EXISTS "Admins can manage all client documents" ON documents;
DROP POLICY IF EXISTS "Advisors can upload for assigned clients" ON documents;
DROP POLICY IF EXISTS "Clients can read own documents" ON documents;

-- Policy 1: Admins and OPS can manage ALL documents (full access)
CREATE POLICY "Admins can manage all documents"
  ON documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('SUPER_ADMIN', 'ADMIN', 'OPS')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('SUPER_ADMIN', 'ADMIN', 'OPS')
    )
  );

-- Policy 2: Advisors can view documents for their assigned clients
CREATE POLICY "Advisors can view assigned clients documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'ADVISOR'
    )
    AND EXISTS (
      SELECT 1 FROM clients
      JOIN advisors ON advisors.id = clients.advisor_id
      WHERE clients.id = documents.client_id
      AND advisors.user_id = auth.uid()
    )
  );

-- Policy 3: Auditors can view all documents
CREATE POLICY "Auditors can view all documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'AUDITOR'
    )
  );

-- Policy 4: Clients can view their own documents (only if account is ACTIVE)
CREATE POLICY "Clients can view own documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.user_id = auth.uid()
      AND clients.id = documents.client_id
      AND (clients.account_status = 'ACTIVE' OR clients.account_status IS NULL)
    )
  );

-- Policy 5: Clients can insert their own documents
CREATE POLICY "Clients can insert own documents"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.user_id = auth.uid()
      AND clients.id = documents.client_id
      AND (clients.account_status = 'ACTIVE' OR clients.account_status IS NULL)
    )
  );