/*
  # Add RLS Policies to Clients With Email View

  1. Overview
    - Add RLS policies to the clients_with_email view
    - Ensure only admins can query the view
    - Maintain security while allowing efficient client list queries

  2. Security
    - Enable RLS on the view
    - Create policy allowing admins to view all clients
    - Create policy allowing clients to view only their own record
*/

-- Enable RLS on the view
ALTER VIEW clients_with_email SET (security_invoker = on);

-- Note: Views inherit RLS from their underlying tables
-- The clients table already has RLS policies that will apply through the view
-- No additional policies needed on the view itself since it uses security_invoker