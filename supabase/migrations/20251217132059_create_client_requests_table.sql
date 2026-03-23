/*
  # Create Client Requests Table

  1. New Tables
    - `client_requests` - Stores various client requests like call requests, withdrawals, etc.
      - `id` (uuid, primary key)
      - `client_id` (uuid, references clients)
      - `request_type` (text) - CALL_REQUEST, WITHDRAWAL_REQUEST, GENERAL_INQUIRY
      - `status` (text) - PENDING, IN_PROGRESS, COMPLETED, CANCELLED
      - `subject` (text) - Brief description
      - `details` (text) - Full details
      - `preferred_datetime` (timestamptz) - For call requests
      - `amount` (numeric) - For withdrawal requests
      - `currency` (text) - For withdrawal requests
      - `bank_account_id` (uuid) - For withdrawal requests
      - `handled_by` (uuid) - Admin who handled the request
      - `handled_at` (timestamptz)
      - `admin_notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Clients can insert and view their own requests
    - Admins can view and update all requests
*/

CREATE TABLE IF NOT EXISTS client_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  request_type text NOT NULL CHECK (request_type IN ('CALL_REQUEST', 'WITHDRAWAL_REQUEST', 'GENERAL_INQUIRY', 'DOCUMENT_REQUEST')),
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED')),
  subject text NOT NULL,
  details text,
  preferred_datetime timestamptz,
  amount numeric,
  currency text CHECK (currency IS NULL OR currency IN ('GBP', 'EUR', 'USD')),
  bank_account_id uuid REFERENCES client_bank_accounts(id),
  handled_by uuid REFERENCES profiles(id),
  handled_at timestamptz,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE client_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can insert their own requests"
  ON client_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = client_requests.client_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can view their own requests"
  ON client_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = client_requests.client_id
      AND c.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('SUPER_ADMIN', 'ADMIN', 'OPS', 'ADVISOR')
    )
  );

CREATE POLICY "Admins can update client requests"
  ON client_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('SUPER_ADMIN', 'ADMIN', 'OPS', 'ADVISOR')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('SUPER_ADMIN', 'ADMIN', 'OPS', 'ADVISOR')
    )
  );

CREATE INDEX idx_client_requests_client_id ON client_requests(client_id);
CREATE INDEX idx_client_requests_status ON client_requests(status);
CREATE INDEX idx_client_requests_type ON client_requests(request_type);
CREATE INDEX idx_client_requests_created_at ON client_requests(created_at DESC);
