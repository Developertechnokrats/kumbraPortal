/*
  # Cash Ledger & Multi-Currency System

  ## Overview
  Creates a comprehensive cash management system with multi-currency support,
  deposit notifications, and full transaction tracking.

  ## New Tables

  ### 1. `client_cash_accounts`
  Tracks separate cash balances for each currency per client
  - `id` (uuid, primary key)
  - `client_id` (uuid, foreign key to clients)
  - `currency` (text) - GBP, EUR, or USD
  - `balance` (numeric) - current balance
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `cash_ledger`
  Full audit trail of all cash movements
  - `id` (uuid, primary key)
  - `client_id` (uuid, foreign key to clients)
  - `transaction_type` (text) - DEPOSIT, INVESTMENT_FUNDING, INTEREST, CAPITAL_RETURN, FX_CONVERSION, WITHDRAWAL
  - `currency` (text)
  - `amount` (numeric)
  - `running_balance` (numeric)
  - `status` (text) - PENDING, APPROVED, REJECTED
  - `reference` (text) - optional reference
  - `notes` (text)
  - `linked_transaction_id` (uuid) - for FX conversions
  - `fx_rate` (numeric) - for FX conversions
  - `fx_currency_from` (text)
  - `fx_currency_to` (text)
  - `approved_by` (uuid, foreign key to profiles) - admin who approved
  - `approved_at` (timestamptz)
  - `rejected_reason` (text)
  - `created_by` (uuid, foreign key to profiles)
  - `created_at` (timestamptz)

  ### 3. `deposit_notifications`
  Client deposit notifications awaiting admin approval
  - `id` (uuid, primary key)
  - `client_id` (uuid, foreign key to clients)
  - `amount` (numeric)
  - `currency` (text)
  - `payment_method` (text) - BANK_TRANSFER, CRYPTO, CREDIT_CARD
  - `reference` (text)
  - `receipt_url` (text) - document path
  - `status` (text) - PENDING, APPROVED, REJECTED
  - `approved_by` (uuid)
  - `approved_at` (timestamptz)
  - `rejected_reason` (text)
  - `ledger_entry_id` (uuid) - link to cash_ledger
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Clients can view own data only
  - Only admins can modify balances and approve transactions
*/

-- Create client_cash_accounts table
CREATE TABLE IF NOT EXISTS client_cash_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  currency text NOT NULL CHECK (currency IN ('GBP', 'EUR', 'USD')),
  balance numeric(20, 2) NOT NULL DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id, currency)
);

-- Create cash_ledger table
CREATE TABLE IF NOT EXISTS cash_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('DEPOSIT', 'INVESTMENT_FUNDING', 'INTEREST', 'CAPITAL_RETURN', 'FX_CONVERSION', 'WITHDRAWAL')),
  currency text NOT NULL CHECK (currency IN ('GBP', 'EUR', 'USD')),
  amount numeric(20, 2) NOT NULL,
  running_balance numeric(20, 2) NOT NULL DEFAULT 0.00,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  reference text,
  notes text,
  linked_transaction_id uuid REFERENCES cash_ledger(id),
  fx_rate numeric(20, 6),
  fx_currency_from text,
  fx_currency_to text,
  approved_by uuid REFERENCES profiles(id),
  approved_at timestamptz,
  rejected_reason text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Create deposit_notifications table
CREATE TABLE IF NOT EXISTS deposit_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  amount numeric(20, 2) NOT NULL,
  currency text NOT NULL CHECK (currency IN ('GBP', 'EUR', 'USD')),
  payment_method text NOT NULL CHECK (payment_method IN ('BANK_TRANSFER', 'CRYPTO', 'CREDIT_CARD')),
  reference text,
  receipt_url text,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  approved_by uuid REFERENCES profiles(id),
  approved_at timestamptz,
  rejected_reason text,
  ledger_entry_id uuid REFERENCES cash_ledger(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_cash_accounts_client_id ON client_cash_accounts(client_id);
CREATE INDEX IF NOT EXISTS idx_cash_ledger_client_id ON cash_ledger(client_id);
CREATE INDEX IF NOT EXISTS idx_cash_ledger_status ON cash_ledger(status);
CREATE INDEX IF NOT EXISTS idx_cash_ledger_created_at ON cash_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deposit_notifications_client_id ON deposit_notifications(client_id);
CREATE INDEX IF NOT EXISTS idx_deposit_notifications_status ON deposit_notifications(status);

-- Enable RLS
ALTER TABLE client_cash_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_cash_accounts
CREATE POLICY "Clients can view own cash accounts"
  ON client_cash_accounts FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all cash accounts"
  ON client_cash_accounts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

CREATE POLICY "Admins can manage cash accounts"
  ON client_cash_accounts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('SUPER_ADMIN', 'ADMIN')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

-- RLS Policies for cash_ledger
CREATE POLICY "Clients can view own ledger"
  ON cash_ledger FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all ledgers"
  ON cash_ledger FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

CREATE POLICY "Admins can manage ledger"
  ON cash_ledger FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('SUPER_ADMIN', 'ADMIN')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

-- RLS Policies for deposit_notifications
CREATE POLICY "Clients can view own deposit notifications"
  ON deposit_notifications FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can create deposit notifications"
  ON deposit_notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all deposit notifications"
  ON deposit_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

CREATE POLICY "Admins can manage deposit notifications"
  ON deposit_notifications FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('SUPER_ADMIN', 'ADMIN')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

-- Function to update cash account balance when ledger entry is approved
CREATE OR REPLACE FUNCTION update_cash_balance_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status changed to APPROVED
  IF NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status != 'APPROVED') THEN
    -- Ensure cash account exists for this client and currency
    INSERT INTO client_cash_accounts (client_id, currency, balance)
    VALUES (NEW.client_id, NEW.currency, 0.00)
    ON CONFLICT (client_id, currency) DO NOTHING;
    
    -- Update the balance
    UPDATE client_cash_accounts
    SET 
      balance = balance + NEW.amount,
      updated_at = now()
    WHERE client_id = NEW.client_id AND currency = NEW.currency;
    
    -- Update running balance
    NEW.running_balance := (
      SELECT balance FROM client_cash_accounts 
      WHERE client_id = NEW.client_id AND currency = NEW.currency
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update balances
CREATE TRIGGER update_balance_on_ledger_approval
  BEFORE UPDATE ON cash_ledger
  FOR EACH ROW
  EXECUTE FUNCTION update_cash_balance_on_approval();
