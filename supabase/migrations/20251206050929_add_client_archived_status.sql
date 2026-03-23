/*
  # Add Client Archived Status

  1. Changes
    - Adds archived status to clients table for soft delete functionality
    - Archived clients will be hidden from admin views
    - Preserves data for historical/audit purposes

  2. New Fields
    - `archived` (boolean) - Whether the client account is archived/deleted
    - `archived_at` (timestamptz) - When the client was archived
    - `archived_by` (uuid) - Admin user who archived the client
*/

-- Add archived status fields to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at timestamptz,
ADD COLUMN IF NOT EXISTS archived_by uuid REFERENCES auth.users(id);

-- Create index for faster queries filtering out archived clients
CREATE INDEX IF NOT EXISTS idx_clients_archived ON clients(archived) WHERE archived = false;
