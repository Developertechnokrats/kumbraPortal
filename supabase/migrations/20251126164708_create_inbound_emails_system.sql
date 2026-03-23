/*
  # Inbound Email System for Kumbra Capital
  
  1. New Tables
    - `inbound_emails` - Stores all incoming emails to *@kumbracapital.com
      - `id` (uuid, primary key)
      - `to_address` (text) - The recipient address (e.g., support@kumbracapital.com)
      - `from_address` (text) - Sender's email
      - `from_name` (text) - Sender's name
      - `subject` (text) - Email subject
      - `text_body` (text) - Plain text body
      - `html_body` (text) - HTML body
      - `headers_json` (jsonb) - Email headers
      - `attachments_json` (jsonb) - Attachment metadata
      - `is_read` (boolean) - Whether email has been read by admin
      - `assigned_to` (uuid, references profiles) - Admin assigned to handle
      - `client_id` (uuid, references clients, nullable) - Auto-matched client
      - `created_at` (timestamptz)
      
  2. Security
    - RLS policies for admin access only
*/

CREATE TABLE IF NOT EXISTS inbound_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_address text NOT NULL,
  from_address text NOT NULL,
  from_name text,
  subject text,
  text_body text,
  html_body text,
  headers_json jsonb,
  attachments_json jsonb,
  is_read boolean DEFAULT false,
  assigned_to uuid REFERENCES profiles(id),
  client_id uuid REFERENCES clients(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inbound_emails_to_address ON inbound_emails(to_address);
CREATE INDEX IF NOT EXISTS idx_inbound_emails_from_address ON inbound_emails(from_address);
CREATE INDEX IF NOT EXISTS idx_inbound_emails_created_at ON inbound_emails(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inbound_emails_is_read ON inbound_emails(is_read);

ALTER TABLE inbound_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all inbound emails"
  ON inbound_emails FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('SUPER_ADMIN', 'ADMIN', 'OPS', 'ADVISOR')
    )
  );

CREATE POLICY "Admins can update inbound emails"
  ON inbound_emails FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('SUPER_ADMIN', 'ADMIN', 'OPS', 'ADVISOR')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('SUPER_ADMIN', 'ADMIN', 'OPS', 'ADVISOR')
    )
  );

CREATE POLICY "System can insert inbound emails"
  ON inbound_emails FOR INSERT
  TO authenticated
  WITH CHECK (true);
