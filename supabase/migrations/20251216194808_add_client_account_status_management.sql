/*
  # Client Account Status Management

  ## Overview
  Add account status management for clients with immutable audit trail.

  ## 1. New Features
    - Add `account_status` field to clients table (ACTIVE, SUSPENDED, DELETED)
    - Create `account_status_history` table for immutable audit trail
    - All status changes are permanently logged with admin details

  ## 2. Tables Modified
    - `clients` - Add account_status field (default: ACTIVE)
      - `account_status` (enum: ACTIVE, SUSPENDED, DELETED)

  ## 3. New Tables
    - `account_status_history` - Immutable audit trail for account status changes
      - `id` (uuid, primary key)
      - `client_id` (uuid, references clients)
      - `old_status` (text)
      - `new_status` (text)
      - `changed_by` (uuid, references profiles)
      - `reason` (text)
      - `notes` (text)
      - `created_at` (timestamptz)

  ## 4. Security
    - Enable RLS on account_status_history table
    - Only admins can read audit history
    - NO ONE can delete or update history records (immutable)
    - Trigger to automatically log status changes

  ## 5. Important Notes
    - Account status history is IMMUTABLE - records cannot be deleted or modified
    - DELETED status is a soft delete - data is retained for compliance
    - SUSPENDED accounts retain all data but users cannot access portal
    - All status changes must include reason and are logged to audit trail
*/

-- Create enum for account status if it doesn't exist
DO $$ BEGIN
  CREATE TYPE account_status AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add account_status field to clients table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'account_status'
  ) THEN
    ALTER TABLE clients ADD COLUMN account_status account_status DEFAULT 'ACTIVE' NOT NULL;
  END IF;
END $$;

-- Create immutable account status history table
CREATE TABLE IF NOT EXISTS account_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  old_status text NOT NULL,
  new_status text NOT NULL,
  changed_by uuid NOT NULL REFERENCES profiles(id),
  reason text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_account_status_history_client_id 
  ON account_status_history(client_id);

CREATE INDEX IF NOT EXISTS idx_account_status_history_created_at 
  ON account_status_history(created_at DESC);

-- Enable RLS
ALTER TABLE account_status_history ENABLE ROW LEVEL SECURITY;

-- Policy: Only Kumbra admins (SUPER_ADMIN, ADMIN, OPS) can read account status history
CREATE POLICY "Admins can read account status history"
  ON account_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('SUPER_ADMIN', 'ADMIN', 'OPS')
    )
  );

-- Policy: Only Kumbra admins can insert status history
CREATE POLICY "Admins can create account status history"
  ON account_status_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('SUPER_ADMIN', 'ADMIN', 'OPS')
    )
  );

-- NO UPDATE OR DELETE POLICIES - History is immutable!

-- Function to automatically log status changes
CREATE OR REPLACE FUNCTION log_account_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.account_status IS DISTINCT FROM NEW.account_status THEN
    INSERT INTO account_status_history (
      client_id,
      old_status,
      new_status,
      changed_by,
      reason,
      notes
    ) VALUES (
      NEW.id,
      OLD.account_status::text,
      NEW.account_status::text,
      auth.uid(),
      'Status changed via admin action',
      'Automatic log entry'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to log all status changes automatically
DROP TRIGGER IF EXISTS trigger_log_account_status_change ON clients;
CREATE TRIGGER trigger_log_account_status_change
  AFTER UPDATE OF account_status ON clients
  FOR EACH ROW
  EXECUTE FUNCTION log_account_status_change();