-- Create Client Documents Storage Bucket with Full Access
--
-- 1. Storage Bucket
--    Create client-documents bucket for storing client documents
--    Private bucket with 50MB file size limit
--    Allow common document and image MIME types
--
-- 2. Storage Policies
--    Admins can upload, view, update, and delete all documents
--    Clients can upload and view their own documents
--    Documents organized by client_id folders
--
-- 3. Security
--    Clients can only access documents in their own folder
--    Admins have full access to all documents
--    File type restrictions enforced at bucket level

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-documents',
  'client-documents',
  false,
  52428800,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/gif',
    'text/plain',
    'text/csv'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/gif',
    'text/plain',
    'text/csv'
  ];

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can upload client documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all client documents" ON storage.objects;
DROP POLICY IF EXISTS "Clients can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Clients can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete client documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update client documents" ON storage.objects;

-- Admins can upload documents
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

-- Admins can view all documents
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

-- Admins can update documents
CREATE POLICY "Admins can update client documents"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'client-documents'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('SUPER_ADMIN', 'ADMIN', 'OPS')
    )
  );

-- Admins can delete documents
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

-- Clients can upload their own documents
CREATE POLICY "Clients can upload their own documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'client-documents'
    AND EXISTS (
      SELECT 1 FROM clients
      WHERE clients.user_id = auth.uid()
      AND (storage.objects.name LIKE clients.id::text || '/%')
    )
  );

-- Clients can view their own documents
CREATE POLICY "Clients can view their own documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'client-documents'
    AND EXISTS (
      SELECT 1 FROM clients
      WHERE clients.user_id = auth.uid()
      AND (storage.objects.name LIKE clients.id::text || '/%')
    )
  );