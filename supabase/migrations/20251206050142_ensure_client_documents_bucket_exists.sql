/*
  # Ensure Client Documents Storage Bucket Exists

  1. Storage Bucket
    - Create or update 'client-documents' bucket
    - Configure as private with appropriate file size limits
    - Allow common document MIME types
    
  2. Storage Policies
    - Admins can upload, view, update, and delete documents
    - Clients can only view their own documents
    - Proper security checks for all operations
*/

-- Ensure the bucket exists (using DO block to handle if exists)
DO $$
BEGIN
  -- Insert bucket if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'client-documents') THEN
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
        'text/plain'
      ]
    );
  ELSE
    -- Update existing bucket configuration
    UPDATE storage.buckets
    SET 
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
        'text/plain'
      ]
    WHERE id = 'client-documents';
  END IF;
END $$;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Admins can upload client documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all client documents" ON storage.objects;
DROP POLICY IF EXISTS "Clients can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete client documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update client documents" ON storage.objects;

-- Policy: Admins can upload documents
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

-- Policy: Admins can view all documents
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

-- Policy: Clients can only view their own documents
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

-- Policy: Admins can update documents
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
