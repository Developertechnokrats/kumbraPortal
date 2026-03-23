/*
  # Comprehensive Admin Dummy Data

  This migration adds extensive dummy data for all admin features:
  - Deposit requests (pending and processed)
  - KYC documents (pending approval)
  - Internal messages (client to admin)
  - Client documents
  - Transactions history
  - Audit logs
  - Price updates
  - Dividend payments
  - Cash balances
*/

DO $$
DECLARE
  v_demo_client_id uuid;
  v_admin_id uuid;
  v_instrument_id uuid;
  v_holding_id uuid;
BEGIN
  SELECT id INTO v_demo_client_id FROM clients WHERE user_id IN (
    SELECT id FROM profiles WHERE email = 'demo@example.com'
  ) LIMIT 1;

  SELECT id INTO v_admin_id FROM profiles WHERE role = 'ADMIN' LIMIT 1;

  IF v_admin_id IS NULL THEN
    SELECT id INTO v_admin_id FROM profiles LIMIT 1;
  END IF;

  INSERT INTO deposit_requests (client_id, amount, currency, method, status, bank_reference, notes, requested_at, approved_at, approved_by)
  VALUES
    (v_demo_client_id, 25000.00, 'AUD', 'Bank Transfer', 'PENDING', 'REF-2025-001', 'Transfer from CommBank account', NOW() - INTERVAL '2 hours', NULL, NULL),
    (v_demo_client_id, 50000.00, 'AUD', 'Bank Transfer', 'PENDING', 'REF-2025-002', 'Investment top-up', NOW() - INTERVAL '1 day', NULL, NULL),
    (v_demo_client_id, 15000.00, 'USD', 'Bank Transfer', 'PENDING', 'REF-2025-003', 'USD deposit for US bonds', NOW() - INTERVAL '3 hours', NULL, NULL),
    (v_demo_client_id, 100000.00, 'AUD', 'Bank Transfer', 'APPROVED', 'REF-2025-004', 'Initial investment', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days', v_admin_id),
    (v_demo_client_id, 75000.00, 'AUD', 'Bank Transfer', 'APPROVED', 'REF-2025-005', 'Additional funds', NOW() - INTERVAL '14 days', NOW() - INTERVAL '13 days', v_admin_id),
    (v_demo_client_id, 30000.00, 'AUD', 'Bank Transfer', 'REJECTED', 'REF-2025-006', 'Suspicious activity flagged', NOW() - INTERVAL '20 days', NULL, NULL)
  ON CONFLICT DO NOTHING;

  INSERT INTO kyc_documents (client_id, document_type, document_url, file_name, status, uploaded_at, reviewed_by, rejection_reason)
  VALUES
    (v_demo_client_id, 'PASSPORT', 'https://example.com/docs/passport.pdf', 'passport_james_martin.pdf', 'PENDING', NOW() - INTERVAL '5 hours', NULL, NULL),
    (v_demo_client_id, 'PROOF_OF_ADDRESS', 'https://example.com/docs/utility_bill.pdf', 'utility_bill_nov_2025.pdf', 'PENDING', NOW() - INTERVAL '5 hours', NULL, NULL),
    (v_demo_client_id, 'BANK_STATEMENT', 'https://example.com/docs/statement.pdf', 'bank_statement_oct_2025.pdf', 'PENDING', NOW() - INTERVAL '6 hours', NULL, NULL),
    (v_demo_client_id, 'DRIVERS_LICENSE', 'https://example.com/docs/license.pdf', 'drivers_license.pdf', 'APPROVED', NOW() - INTERVAL '30 days', v_admin_id, NULL),
    (v_demo_client_id, 'TAX_FILE_NUMBER', 'https://example.com/docs/tfn.pdf', 'tfn_certificate.pdf', 'REJECTED', NOW() - INTERVAL '25 days', v_admin_id, 'Document expired, please upload current TFN certificate')
  ON CONFLICT DO NOTHING;

  INSERT INTO internal_messages (client_id, sender_type, sender_id, subject, body, read_at)
  VALUES
    (v_demo_client_id, 'CLIENT', v_demo_client_id, 'Question about NAB Bond Investment', 'Hi, I am interested in purchasing more NAB 6.342% bonds. Can you please advise on availability and minimum investment amount? Thanks, James', NULL),
    (v_demo_client_id, 'CLIENT', v_demo_client_id, 'Dividend Payment Query', 'Hello, I noticed the CBA dividend payment is due next week. Will this be automatically credited to my cash account? Please confirm.', NULL),
    (v_demo_client_id, 'CLIENT', v_demo_client_id, 'Portfolio Rebalancing Request', 'Good afternoon, I would like to discuss rebalancing my portfolio to increase exposure to fixed income and reduce equity allocation. When would you be available for a call?', NULL),
    (v_demo_client_id, 'ADMIN', v_admin_id, 'Re: Question about NAB Bond Investment', 'Hi James, Yes, we have availability for NAB bonds. The minimum is AUD 10,000. Current yield is 6.342%. Let me know if you would like to proceed. Best, Admin Team', NOW() - INTERVAL '2 hours'),
    (v_demo_client_id, 'CLIENT', v_demo_client_id, 'KYC Documents Uploaded', 'Hi, I have just uploaded my passport and proof of address documents for KYC verification. Please let me know if you need anything else. Thanks!', NOW() - INTERVAL '1 day'),
    (v_demo_client_id, 'ADMIN', v_admin_id, 'Welcome to Kumbra Capital', 'Dear James, Welcome to Kumbra Capital! Your account has been successfully created. Our team will review your KYC documents within 24 hours. Feel free to reach out with any questions. Best regards, The Team', NOW() - INTERVAL '5 days')
  ON CONFLICT DO NOTHING;

  INSERT INTO client_documents (client_id, document_type, document_name, document_url, file_size, uploaded_by, is_visible_to_client)
  VALUES
    (v_demo_client_id, 'STATEMENT', 'October 2025 Portfolio Statement', 'https://example.com/statements/oct_2025.pdf', 245632, v_admin_id, true),
    (v_demo_client_id, 'STATEMENT', 'September 2025 Portfolio Statement', 'https://example.com/statements/sep_2025.pdf', 238941, v_admin_id, true),
    (v_demo_client_id, 'TAX_DOCUMENT', '2024-2025 Tax Summary', 'https://example.com/tax/fy2025.pdf', 189234, v_admin_id, true),
    (v_demo_client_id, 'CONTRACT', 'Investment Management Agreement', 'https://example.com/contracts/ima.pdf', 512000, v_admin_id, true),
    (v_demo_client_id, 'REPORT', 'Q3 2025 Performance Report', 'https://example.com/reports/q3_2025.pdf', 356789, v_admin_id, true),
    (v_demo_client_id, 'INTERNAL', 'Risk Assessment - Confidential', 'https://example.com/internal/risk.pdf', 123456, v_admin_id, false)
  ON CONFLICT DO NOTHING;

  INSERT INTO transactions (client_id, transaction_type, amount, currency, status, description, created_at, completed_at, created_by)
  VALUES
    (v_demo_client_id, 'DEPOSIT', 100000.00, 'AUD', 'COMPLETED', 'Initial deposit via bank transfer - REF-2025-004', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', v_admin_id),
    (v_demo_client_id, 'PURCHASE', -50000.00, 'AUD', 'COMPLETED', 'Purchase: Commonwealth Bank 6.411% 06 Oct 2033', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', v_admin_id),
    (v_demo_client_id, 'PURCHASE', -30000.00, 'AUD', 'COMPLETED', 'Purchase: National Australia Bank 6.342% 06 Jun 2039', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', v_admin_id),
    (v_demo_client_id, 'DIVIDEND', 1250.50, 'AUD', 'COMPLETED', 'Dividend payment: CBA Bond', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', NULL),
    (v_demo_client_id, 'PURCHASE', -20000.00, 'AUD', 'COMPLETED', 'Purchase: Kumbra Balanced Growth Fund', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', v_admin_id),
    (v_demo_client_id, 'DEPOSIT', 75000.00, 'AUD', 'COMPLETED', 'Additional deposit - REF-2025-005', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', v_admin_id),
    (v_demo_client_id, 'FEE', -250.00, 'AUD', 'COMPLETED', 'Management fee - Q3 2025', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days', NULL),
    (v_demo_client_id, 'INTEREST', 850.00, 'AUD', 'COMPLETED', 'Interest payment: ANZ Bond', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days', NULL),
    (v_demo_client_id, 'WITHDRAWAL', -10000.00, 'AUD', 'COMPLETED', 'Withdrawal to bank account', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', v_admin_id),
    (v_demo_client_id, 'PURCHASE', -15000.00, 'USD', 'PENDING', 'Purchase: US Treasury Bond', NOW() - INTERVAL '1 hour', NULL, v_admin_id)
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_instrument_id FROM instruments WHERE asset_class = 'MANAGED_FUND' LIMIT 1;

  IF v_instrument_id IS NOT NULL THEN
    INSERT INTO price_updates (instrument_id, old_price, new_price, effective_date, updated_by, notes)
    VALUES
      (v_instrument_id, 1.0245, 1.0312, CURRENT_DATE, v_admin_id, 'Monthly NAV update - strong performance'),
      (v_instrument_id, 1.0198, 1.0245, CURRENT_DATE - INTERVAL '30 days', v_admin_id, 'Monthly NAV update'),
      (v_instrument_id, 1.0156, 1.0198, CURRENT_DATE - INTERVAL '60 days', v_admin_id, 'Monthly NAV update - market volatility'),
      (v_instrument_id, 1.0089, 1.0156, CURRENT_DATE - INTERVAL '90 days', v_admin_id, 'Monthly NAV update')
    ON CONFLICT DO NOTHING;
  END IF;

  SELECT id INTO v_holding_id FROM holdings WHERE client_id = v_demo_client_id LIMIT 1;

  IF v_holding_id IS NOT NULL THEN
    INSERT INTO dividend_payments (holding_id, client_id, payment_date, amount, currency, payment_type, status)
    VALUES
      (v_holding_id, v_demo_client_id, CURRENT_DATE + INTERVAL '7 days', 1250.50, 'AUD', 'DIVIDEND', 'SCHEDULED'),
      (v_holding_id, v_demo_client_id, CURRENT_DATE + INTERVAL '14 days', 850.00, 'AUD', 'INTEREST', 'SCHEDULED'),
      (v_holding_id, v_demo_client_id, CURRENT_DATE + INTERVAL '30 days', 1100.00, 'AUD', 'DIVIDEND', 'SCHEDULED'),
      (v_holding_id, v_demo_client_id, CURRENT_DATE - INTERVAL '7 days', 1250.50, 'AUD', 'DIVIDEND', 'PAID'),
      (v_holding_id, v_demo_client_id, CURRENT_DATE - INTERVAL '37 days', 1250.50, 'AUD', 'DIVIDEND', 'PAID')
    ON CONFLICT DO NOTHING;
  END IF;

  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes)
  VALUES
    (v_admin_id, 'APPROVE_DEPOSIT', 'DEPOSIT_REQUEST', gen_random_uuid(), '{"amount": 100000, "currency": "AUD", "client_name": "James Martin"}'::jsonb),
    (v_admin_id, 'CREATE_HOLDING', 'HOLDING', gen_random_uuid(), '{"instrument": "CBA Bond", "amount": 50000, "currency": "AUD"}'::jsonb),
    (v_admin_id, 'UPDATE_PRICE', 'INSTRUMENT', gen_random_uuid(), '{"instrument": "Balanced Growth Fund", "old_price": 1.0245, "new_price": 1.0312}'::jsonb),
    (v_admin_id, 'APPROVE_KYC', 'KYC_DOCUMENT', gen_random_uuid(), '{"client_name": "James Martin", "document_type": "PASSPORT"}'::jsonb),
    (v_admin_id, 'UPLOAD_DOCUMENT', 'CLIENT_DOCUMENT', gen_random_uuid(), '{"document_name": "October 2025 Statement", "client_name": "James Martin"}'::jsonb),
    (v_admin_id, 'REJECT_DEPOSIT', 'DEPOSIT_REQUEST', gen_random_uuid(), '{"amount": 30000, "reason": "Suspicious activity"}'::jsonb),
    (v_admin_id, 'UPDATE_CLIENT', 'CLIENT', gen_random_uuid(), '{"field": "kyc_status", "old_value": "PENDING", "new_value": "APPROVED"}'::jsonb),
    (v_admin_id, 'SEND_MESSAGE', 'MESSAGE', gen_random_uuid(), '{"to": "James Martin", "subject": "Welcome to Kumbra Capital"}'::jsonb),
    (v_admin_id, 'PROCESS_WITHDRAWAL', 'TRANSACTION', gen_random_uuid(), '{"amount": 10000, "currency": "AUD", "client_name": "James Martin"}'::jsonb),
    (v_admin_id, 'UPDATE_HOLDING', 'HOLDING', gen_random_uuid(), '{"instrument": "NAB Bond", "field": "current_value", "change": "+2.3%"}'::jsonb)
  ON CONFLICT DO NOTHING;

  UPDATE cash_balances
  SET balance = 45000.00
  WHERE client_id = v_demo_client_id AND currency = 'AUD';

  INSERT INTO cash_balances (client_id, currency, balance)
  VALUES (v_demo_client_id, 'USD', 15000.00)
  ON CONFLICT (client_id, currency) DO UPDATE SET balance = 15000.00;

END $$;
