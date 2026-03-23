/*
  # Restrict Inbound Emails to Kumbra Capital Admins

  1. Changes
    - Update RLS policies on inbound_emails table
    - Only carlito@kumbracapital.com and ad@kumbracapital.com can view/update emails
    - Service role can still insert (for webhook functionality)
    
  2. Security
    - Drop existing inbound_emails policies
    - Create new restrictive policies allowing only specific Kumbra admins
    - Emails sent to *@kumbracapital.com will only be visible to authorized users
*/

-- Drop existing inbound_emails policies
DROP POLICY IF EXISTS "Admins can view all inbound emails" ON inbound_emails;
DROP POLICY IF EXISTS "Admins can update inbound emails" ON inbound_emails;
DROP POLICY IF EXISTS "System can insert inbound emails" ON inbound_emails;

-- Create new restrictive policies for inbound_emails
CREATE POLICY "Only Kumbra admins can view inbound emails"
  ON inbound_emails
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN ('carlito@kumbracapital.com', 'ad@kumbracapital.com')
    )
  );

CREATE POLICY "Only Kumbra admins can update inbound emails"
  ON inbound_emails
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN ('carlito@kumbracapital.com', 'ad@kumbracapital.com')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN ('carlito@kumbracapital.com', 'ad@kumbracapital.com')
    )
  );

-- Service role can insert emails (this allows the webhook to work)
CREATE POLICY "Service role can insert inbound emails"
  ON inbound_emails
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
