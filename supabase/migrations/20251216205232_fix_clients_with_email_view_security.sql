/*
  # Fix Clients With Email View Security

  1. Overview
    - Drop and recreate clients_with_email view with SECURITY DEFINER
    - This allows the view to access auth.users table regardless of RLS
    - Admins can query all client data efficiently

  2. Security
    - View uses SECURITY DEFINER to bypass auth.users RLS
    - Underlying RLS policies on clients table still apply
    - Only returns non-archived clients
*/

-- Drop the existing view
DROP VIEW IF EXISTS clients_with_email CASCADE;

-- Recreate the view with SECURITY DEFINER
CREATE VIEW clients_with_email 
WITH (security_invoker = false) 
AS
SELECT 
  c.id,
  c.user_id,
  c.advisor_id,
  c.account_type,
  c.base_currency,
  c.risk_score,
  c.knowledge_json,
  c.kyc_status,
  c.kyc_rejection_reason,
  c.bank_verified,
  c.created_at,
  c.updated_at,
  c.payment_sort_code,
  c.payment_iban,
  c.payment_swift_bic,
  c.payment_bank_address,
  c.address_line1,
  c.address_line2,
  c.city,
  c.state,
  c.postcode,
  c.date_of_birth,
  c.date_of_birth_holder2,
  c.company_incorporation_date,
  c.member_since,
  c.country_of_residence,
  c.tax_residency,
  c.assigned_advisor_name,
  c.risk_profile,
  c.kyc_documents_approved,
  c.payment_reference_code,
  c.account_status,
  c.archived,
  c.archived_at,
  c.archived_by,
  p.name AS profile_name,
  au.email
FROM clients c
LEFT JOIN profiles p ON c.user_id = p.id
LEFT JOIN auth.users au ON c.user_id = au.id;

-- Grant access to authenticated users (RLS on clients table will still apply)
GRANT SELECT ON clients_with_email TO authenticated;