/*
  # Remove James Mitchell Client

  1. Overview
    - Completely removes James Mitchell demo client and all associated data
    - Client ID: d3e0c111-cccc-bbbb-aaaa-000000000001
    - User ID: d3e0c111-aaaa-bbbb-cccc-000000000001

  2. Data Deletion (in correct order to respect foreign keys)
    - Notifications
    - Messages and message threads
    - Documents
    - Cashflows
    - Transactions
    - Holdings
    - Cash balances
    - Client record
    - Profile record
    - Auth user

  3. Important Notes
    - This is a permanent deletion
    - All related data will be removed
    - Foreign key constraints are respected
*/

-- Delete notifications
DELETE FROM notifications
WHERE client_id = 'd3e0c111-cccc-bbbb-aaaa-000000000001';

-- Delete messages (from threads where client is participant)
DELETE FROM messages
WHERE thread_id IN (
  SELECT id FROM message_threads
  WHERE client_id = 'd3e0c111-cccc-bbbb-aaaa-000000000001'
);

-- Delete message threads
DELETE FROM message_threads
WHERE client_id = 'd3e0c111-cccc-bbbb-aaaa-000000000001';

-- Delete documents
DELETE FROM documents
WHERE client_id = 'd3e0c111-cccc-bbbb-aaaa-000000000001';

-- Delete cashflows
DELETE FROM cashflows
WHERE client_id = 'd3e0c111-cccc-bbbb-aaaa-000000000001';

-- Delete transactions
DELETE FROM transactions
WHERE client_id = 'd3e0c111-cccc-bbbb-aaaa-000000000001';

-- Delete holdings
DELETE FROM holdings
WHERE client_id = 'd3e0c111-cccc-bbbb-aaaa-000000000001';

-- Delete cash balances
DELETE FROM cash_balances
WHERE client_id = 'd3e0c111-cccc-bbbb-aaaa-000000000001';

-- Delete client record
DELETE FROM clients
WHERE id = 'd3e0c111-cccc-bbbb-aaaa-000000000001';

-- Delete profile record
DELETE FROM profiles
WHERE id = 'd3e0c111-aaaa-bbbb-cccc-000000000001';

-- Delete auth user
DELETE FROM auth.users
WHERE id = 'd3e0c111-aaaa-bbbb-cccc-000000000001';
