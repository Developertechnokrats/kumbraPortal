/*
  # Allow Clients to Upload Documents

  1. Changes
    - Allow clients to upload documents to storage (their own folder only)
    - Allow clients to insert document records (for their own documents)
    - Maintain security: clients can only upload to their own client_id folder
    
  2. Security
    - Clients can only upload to paths that start with their client_id
    - Clients can only insert document records for their own client_id
    - All existing admin policies remain unchanged
*/

-- Policy: Clients can upload documents to their own folder
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

-- Policy: Clients can insert document records for themselves
CREATE POLICY "Clients can insert their own document records"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.user_id = auth.uid()
      AND clients.id = documents.client_id
    )
  );
