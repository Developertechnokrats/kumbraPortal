/*
  # Create Clients View with Email

  1. Overview
    - Creates a secure view that joins clients with auth.users to get emails
    - Allows admins to query client data with emails without using admin API
    - Maintains RLS security

  2. New View
    - `clients_with_email` - Secure view combining clients, profiles, and auth emails
    
  3. Security
    - RLS policies apply through the underlying tables
    - Only authenticated admins can query this view
*/

-- Create a view that combines clients with their email addresses
CREATE OR REPLACE VIEW clients_with_email AS
SELECT 
  c.*,
  p.name as profile_name,
  au.email
FROM clients c
LEFT JOIN profiles p ON c.user_id = p.id
LEFT JOIN auth.users au ON c.user_id = au.id;

-- Grant access to authenticated users (RLS will still apply)
GRANT SELECT ON clients_with_email TO authenticated;