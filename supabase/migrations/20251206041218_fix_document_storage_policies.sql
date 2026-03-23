-- Fix Document Storage Policies
--
-- Overview:
-- Fix storage policies to allow clients to properly view documents uploaded by admins
--
-- Changes:
-- - Drop and recreate all storage policies for client-documents bucket
-- - Fix path matching to work correctly with Supabase storage
-- - Ensure clients can view documents in their folder
-- - Ensure admins can view, upload, and delete all documents

-- Drop existing storage policies for client-documents
DROP POLICY IF EXISTS "Admins can upload client documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all client documents" ON storage.objects;
DROP POLICY IF EXISTS "Clients can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Clients can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete client documents" ON storage.objects;

-- Policy: Admins can upload documents to any path in client-documents bucket
CREATE POLICY "Admins can upload client documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'client-documents'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('SUPER_ADMIN', 'ADMIN', 'OPS', 'ADVISOR')
    )
  );

-- Policy: Admins can view all documents in client-documents bucket
CREATE POLICY "Admins can view all client documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'client-documents'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('SUPER_ADMIN', 'ADMIN', 'OPS', 'ADVISOR')
    )
  );

-- Policy: Clients can view documents in their own folder
CREATE POLICY "Clients can view their own documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'client-documents'
    AND EXISTS (
      SELECT 1 FROM clients
      WHERE clients.user_id = auth.uid()
      AND name LIKE clients.id::text || '/%'
    )
  );

-- Policy: Clients can upload documents to their own folder only
CREATE POLICY "Clients can upload their own documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'client-documents'
    AND EXISTS (
      SELECT 1 FROM clients
      WHERE clients.user_id = auth.uid()
      AND name LIKE clients.id::text || '/%'
    )
  );

-- Policy: Admins can delete documents
CREATE POLICY "Admins can delete client documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'client-documents'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('SUPER_ADMIN', 'ADMIN')
    )
  );