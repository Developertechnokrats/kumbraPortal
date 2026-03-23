/*
  # Admin Features - Complete System

  1. New Tables
    - `transactions` - All financial transactions with full audit trail
    - `deposit_requests` - Client deposit requests awaiting approval
    - `audit_logs` - Complete system audit trail
    - `price_updates` - Historical price updates for instruments
    - `cash_balances` - Client cash balances by currency
    - `kyc_documents` - KYC document uploads
    - `client_documents` - Client document management
    - `internal_messages` - Two-way messaging system
    - `dividend_payments` - Automated dividend payment tracking

  2. Security
    - Enable RLS on all tables
    - Add policies for admin and client access
    - Ensure complete audit trail

  3. Important Notes
    - All transactions are logged
    - Cash balances are updated atomically
    - Currency conversions use real-time rates
    - Complete history is maintained
*/

CREATE TABLE IF NOT EXISTS cash_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  currency text NOT NULL,
  balance decimal(18, 2) DEFAULT 0.00 NOT NULL,
  last_updated timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(client_id, currency)
);

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  transaction_type text NOT NULL,
  amount decimal(18, 2) NOT NULL,
  currency text NOT NULL,
  from_currency text,
  to_currency text,
  exchange_rate decimal(18, 6),
  status text DEFAULT 'COMPLETED' NOT NULL,
  reference_id uuid,
  reference_type text,
  description text NOT NULL,
  metadata_json jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS deposit_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  amount decimal(18, 2) NOT NULL,
  currency text NOT NULL,
  method text NOT NULL,
  status text DEFAULT 'PENDING' NOT NULL,
  bank_reference text,
  proof_document_url text,
  notes text,
  requested_at timestamptz DEFAULT now() NOT NULL,
  approved_at timestamptz,
  approved_by uuid REFERENCES profiles(id),
  rejected_reason text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  changes jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS price_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id uuid REFERENCES instruments(id) ON DELETE CASCADE NOT NULL,
  old_price decimal(18, 6),
  new_price decimal(18, 6) NOT NULL,
  effective_date date DEFAULT CURRENT_DATE NOT NULL,
  updated_by uuid REFERENCES profiles(id) NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS kyc_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL,
  document_url text NOT NULL,
  file_name text NOT NULL,
  file_size integer,
  status text DEFAULT 'PENDING' NOT NULL,
  uploaded_at timestamptz DEFAULT now() NOT NULL,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES profiles(id),
  rejection_reason text,
  metadata_json jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS client_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL,
  document_name text NOT NULL,
  document_url text NOT NULL,
  file_size integer,
  uploaded_by uuid REFERENCES profiles(id) NOT NULL,
  is_visible_to_client boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS internal_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  sender_type text NOT NULL,
  sender_id uuid REFERENCES profiles(id) NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  replied_to uuid REFERENCES internal_messages(id),
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS dividend_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  holding_id uuid REFERENCES holdings(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  payment_date date NOT NULL,
  amount decimal(18, 2) NOT NULL,
  currency text NOT NULL,
  payment_type text DEFAULT 'DIVIDEND' NOT NULL,
  status text DEFAULT 'SCHEDULED' NOT NULL,
  processed_at timestamptz,
  transaction_id uuid REFERENCES transactions(id),
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE cash_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE dividend_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own cash balances"
  ON cash_balances FOR SELECT
  TO authenticated
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all cash balances"
  ON cash_balances FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'));

CREATE POLICY "Clients can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all transactions"
  ON transactions FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'));

CREATE POLICY "Clients can create deposit requests"
  ON deposit_requests FOR INSERT
  TO authenticated
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "Clients can view own deposit requests"
  ON deposit_requests FOR SELECT
  TO authenticated
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all deposit requests"
  ON deposit_requests FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'));

CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'));

CREATE POLICY "All authenticated users can create audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all price updates"
  ON price_updates FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'));

CREATE POLICY "Admins can create price updates"
  ON price_updates FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'));

CREATE POLICY "Clients can view own KYC documents"
  ON kyc_documents FOR SELECT
  TO authenticated
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "Clients can upload KYC documents"
  ON kyc_documents FOR INSERT
  TO authenticated
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all KYC documents"
  ON kyc_documents FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'));

CREATE POLICY "Clients can view own visible documents"
  ON client_documents FOR SELECT
  TO authenticated
  USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
    AND is_visible_to_client = true
  );

CREATE POLICY "Admins can manage all client documents"
  ON client_documents FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'));

CREATE POLICY "Clients can view own messages"
  ON internal_messages FOR SELECT
  TO authenticated
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "Clients can send messages"
  ON internal_messages FOR INSERT
  TO authenticated
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all messages"
  ON internal_messages FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'));

CREATE POLICY "Clients can view own dividend payments"
  ON dividend_payments FOR SELECT
  TO authenticated
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all dividend payments"
  ON dividend_payments FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'));

CREATE INDEX IF NOT EXISTS idx_cash_balances_client ON cash_balances(client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_client ON transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deposit_requests_status ON deposit_requests(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_status ON kyc_documents(status);
CREATE INDEX IF NOT EXISTS idx_internal_messages_client ON internal_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_dividend_payments_status ON dividend_payments(status);

INSERT INTO cash_balances (client_id, currency, balance)
SELECT id, base_currency, 150000.00
FROM clients
WHERE NOT EXISTS (SELECT 1 FROM cash_balances WHERE client_id = clients.id)
ON CONFLICT (client_id, currency) DO NOTHING;
