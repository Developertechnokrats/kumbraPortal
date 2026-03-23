/*
  # Create Admin User with Authentication

  Creates the admin user with:
  - Email: admin@kumbra.com
  - Password: Admin123!
  - Role: SUPER_ADMIN
  
  This migration ensures the admin can log in to the admin portal.
*/

-- Clean up any existing admin data to ensure a fresh start
DELETE FROM profiles WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'admin@kumbra.com'
);

-- Create the admin user with proper password hashing
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
  'a1111111-aaaa-bbbb-cccc-000000000001'::uuid,
  'authenticated',
  'authenticated',
  'admin@kumbra.com',
  crypt('Admin123!', gen_salt('bf')),
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
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  updated_at = NOW();

-- Create admin profile with SUPER_ADMIN role
INSERT INTO profiles (id, name, role, is_demo) VALUES
  ('a1111111-aaaa-bbbb-cccc-000000000001'::uuid, 'System Admin', 'SUPER_ADMIN', false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = NOW();

SELECT 'Admin user created successfully! Email: admin@kumbra.com, Password: Admin123!' as result;
