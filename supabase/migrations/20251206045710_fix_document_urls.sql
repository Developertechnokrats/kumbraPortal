/*
  # Fix Document URLs

  1. Changes
    - Updates all document records that have full public URLs
    - Extracts just the file path from the URL
    - This fixes admin-uploaded documents that can't be viewed

  2. Details
    - Searches for documents with URLs containing the full storage URL
    - Extracts the client-id/filename portion
    - Updates the file_url field to just the path
*/

-- Fix documents that have full public URLs instead of file paths
UPDATE documents
SET file_url = regexp_replace(
  file_url, 
  '^https?://[^/]+/storage/v1/object/public/client-documents/', 
  ''
)
WHERE file_url LIKE 'http%://%.supabase.co/storage/v1/object/public/client-documents/%';
