/*
  # Recreate Demo User with Proper Authentication
  
  Creates the demo client user with email: demo@client.com and password: Demo123!
  This migration ensures the user can log in properly.
*/

-- First, ensure any existing demo data is cleaned up
DELETE FROM profiles WHERE id = 'd3e0c111-aaaa-bbbb-cccc-000000000001'::uuid;
DELETE FROM clients WHERE id = 'd3e0c111-cccc-bbbb-aaaa-000000000001'::uuid;

-- Create the demo user using Supabase's crypt function for proper password hashing
-- Password: Demo123!
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'd3e0c111-aaaa-bbbb-cccc-000000000001'::uuid,
  'authenticated',
  'authenticated',
  'demo@client.com',
  crypt('Demo123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Create profile
INSERT INTO profiles (id, name, role, is_demo) VALUES
  ('d3e0c111-aaaa-bbbb-cccc-000000000001'::uuid, 'James Mitchell', 'CLIENT', true);

-- Create client record
INSERT INTO clients (
  id,
  user_id,
  account_type,
  kyc_status,
  base_currency,
  risk_score,
  bank_verified
) VALUES (
  'd3e0c111-cccc-bbbb-aaaa-000000000001'::uuid,
  'd3e0c111-aaaa-bbbb-cccc-000000000001'::uuid,
  'INDIVIDUAL',
  'APPROVED',
  'GBP',
  7,
  true
);

-- Restore cash balances
INSERT INTO cash_balances (client_id, currency, balance) VALUES
  ('d3e0c111-cccc-bbbb-aaaa-000000000001'::uuid, 'GBP', 45250.00),
  ('d3e0c111-cccc-bbbb-aaaa-000000000001'::uuid, 'USD', 12500.00),
  ('d3e0c111-cccc-bbbb-aaaa-000000000001'::uuid, 'EUR', 8750.00)
ON CONFLICT (client_id, currency) DO UPDATE SET balance = EXCLUDED.balance;

SELECT 'Demo user recreated successfully! Email: demo@client.com, Password: Demo123!' as result;
