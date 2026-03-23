/*
  # Add Manual Workflow Fields for Admin Client Creation
  
  1. Schema Changes
    - Add new fields to `clients` table:
      - `country_of_residence` (text) - Client's country
      - `tax_residency` (text) - Tax residency country
      - `risk_profile` (text) - Low, Moderate, High
      - `kyc_documents_approved` (boolean) - KYC approval status
      - `assigned_advisor_name` (text) - Advisor name (Daniel Cavanaugh or David Perry)
      - `payment_reference_code` (text) - Unique reference for bank transfers
      - `member_since` (date) - When client joined
      
    - Add new fields to `profiles` table:
      - `country` (text) - For country of residence
      
    - Add new fields to `holdings` table to support PENDING status
      
  2. New Tables
    - `cash_transactions` - Manual cash balance adjustments by admin
      - `id` (uuid, primary key)
      - `client_id` (uuid, references clients)
      - `amount` (numeric)
      - `currency` (text)
      - `transaction_type` (enum: DEPOSIT, INVESTMENT_FUNDING)
      - `date_received` (date)
      - `notes` (text)
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamptz)
      
  3. Fixed Investment Products
    - Insert three specific bond products into instruments table
    
  4. Security
    - RLS policies for new tables
*/

-- Add new columns to clients table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'country_of_residence') THEN
    ALTER TABLE clients ADD COLUMN country_of_residence text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'tax_residency') THEN
    ALTER TABLE clients ADD COLUMN tax_residency text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'risk_profile') THEN
    ALTER TABLE clients ADD COLUMN risk_profile text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'kyc_documents_approved') THEN
    ALTER TABLE clients ADD COLUMN kyc_documents_approved boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'assigned_advisor_name') THEN
    ALTER TABLE clients ADD COLUMN assigned_advisor_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'payment_reference_code') THEN
    ALTER TABLE clients ADD COLUMN payment_reference_code text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'member_since') THEN
    ALTER TABLE clients ADD COLUMN member_since date DEFAULT CURRENT_DATE;
  END IF;
END $$;

-- Add country to profiles table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'country') THEN
    ALTER TABLE profiles ADD COLUMN country text;
  END IF;
END $$;

-- Create cash_transactions table
CREATE TABLE IF NOT EXISTS cash_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id),
  amount numeric NOT NULL,
  currency text NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('DEPOSIT', 'INVESTMENT_FUNDING')),
  date_received date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on cash_transactions
ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for cash_transactions
CREATE POLICY "Admins can view all cash transactions"
  ON cash_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('SUPER_ADMIN', 'ADMIN', 'OPS')
    )
  );

CREATE POLICY "Admins can insert cash transactions"
  ON cash_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('SUPER_ADMIN', 'ADMIN', 'OPS')
    )
  );

CREATE POLICY "Clients can view own cash transactions"
  ON cash_transactions FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

-- Insert fixed investment products
INSERT INTO instruments (id, asset_class, issuer_name, issuer_domain, isin, currency, metadata_json, is_active)
VALUES 
  (
    'a1111111-1111-1111-1111-111111111111',
    'FIXED_INCOME',
    'ANZ Global Holdings',
    'anz.com',
    'AU3CB0292472',
    'AUD',
    jsonb_build_object(
      'coupon_rate', 6.405,
      'term_years', 1,
      'minimum_investment', 50000,
      'payment_frequency', 'Semi-annual',
      'description', 'ANZ Global Holdings – AU3CB0292472 – AUD – 6.405% p.a. – 1 Year – Min $50,000 – Semi-annual'
    ),
    true
  ),
  (
    'a2222222-2222-2222-2222-222222222222',
    'FIXED_INCOME',
    'Goldman Sachs',
    'goldmansachs.com',
    'XS2470182473',
    'AUD',
    jsonb_build_object(
      'coupon_rate', 9.000,
      'term_years', 2,
      'minimum_investment', 100000,
      'payment_frequency', 'Semi-annual',
      'description', 'Goldman Sachs – XS2470182473 – AUD – 9.000% p.a. – 2 Year – Min $100,000 – Semi-annual'
    ),
    true
  ),
  (
    'a3333333-3333-3333-3333-333333333333',
    'FIXED_INCOME',
    'Queensland Treasury Corp',
    'qtc.com.au',
    'AU0000XQLQI5',
    'AUD',
    jsonb_build_object(
      'coupon_rate', 6.500,
      'term_years', 1,
      'minimum_investment', 50000,
      'payment_frequency', 'Semi-annual',
      'description', 'Queensland Treasury Corp – AU0000XQLQI5 – AUD – 6.500% p.a. – 1 Year – Min $50,000 – Semi-annual'
    ),
    true
  )
ON CONFLICT (id) DO NOTHING;
