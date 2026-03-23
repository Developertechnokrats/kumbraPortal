/*
  # Revert Inbound Emails RLS Restrictions

  1. Changes
    - Remove Kumbra-specific RLS policies
    - Restore original policies allowing all admins to view inbound emails
    
  2. Security
    - Drop Kumbra-specific policies
    - Restore original admin access policies
*/

-- Drop the Kumbra-specific policies
DROP POLICY IF EXISTS "Only Kumbra admins can view inbound emails" ON inbound_emails;
DROP POLICY IF EXISTS "Only Kumbra admins can update inbound emails" ON inbound_emails;
DROP POLICY IF EXISTS "Service role can insert inbound emails" ON inbound_emails;

-- Restore original policies for all admins
CREATE POLICY "Admins can view all inbound emails"
  ON inbound_emails
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('SUPER_ADMIN', 'ADMIN', 'OPS', 'ADVISOR')
    )
  );

CREATE POLICY "Admins can update inbound emails"
  ON inbound_emails
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('SUPER_ADMIN', 'ADMIN', 'OPS', 'ADVISOR')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('SUPER_ADMIN', 'ADMIN', 'OPS', 'ADVISOR')
    )
  );

CREATE POLICY "System can insert inbound emails"
  ON inbound_emails
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
