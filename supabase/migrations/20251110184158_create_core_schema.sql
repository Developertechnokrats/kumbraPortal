/*
  # Kumbra Capital Client Portal - Core Schema

  ## Overview
  Complete database schema for a regulated investment firm's client portal with role-based access control,
  multi-currency support, multiple asset classes (Fixed Income, Managed Funds, Gold Contracts), and secure document management.

  ## 1. New Tables

  ### Authentication & Users
  - `profiles` - Extended user profile data
    - `id` (uuid, references auth.users)
    - `role` (enum: SUPER_ADMIN, ADMIN, OPS, ADVISOR, CLIENT, AUDITOR)
    - `name` (text)
    - `phone` (text)
    - `locale` (text, default 'en-GB')
    - `is_demo` (boolean, default false)
    - `created_at`, `updated_at` (timestamptz)

  ### Advisors
  - `advisors` - Advisor-specific data
    - `id` (uuid, primary key)
    - `user_id` (uuid, references profiles)
    - `created_at` (timestamptz)

  ### Clients
  - `clients` - Client account data
    - `id` (uuid, primary key)
    - `user_id` (uuid, references profiles)
    - `advisor_id` (uuid, references advisors, nullable)
    - `account_type` (enum: INDIVIDUAL, JOINT, CORPORATE)
    - `base_currency` (text, default 'AUD')
    - `risk_score` (integer, 1-10)
    - `knowledge_json` (jsonb)
    - `kyc_status` (enum: PENDING, APPROVED, REJECTED)
    - `kyc_rejection_reason` (text, nullable)
    - `bank_verified` (boolean, default false)
    - `created_at`, `updated_at` (timestamptz)

  ### Cash Balances
  - `cash_balances` - Multi-currency cash wallets
    - `id` (uuid, primary key)
    - `client_id` (uuid, references clients)
    - `currency` (text: AUD, USD, EUR, GBP, CAD)
    - `balance` (numeric)
    - `updated_at` (timestamptz)

  ### Bank Accounts
  - `client_bank_accounts` - Verified bank accounts for withdrawals
    - `id` (uuid, primary key)
    - `client_id` (uuid, references clients)
    - `name_on_account` (text)
    - `account_number` (text, encrypted)
    - `iban` (text, encrypted, nullable)
    - `bsb_or_sort_code` (text, nullable)
    - `bank_name` (text)
    - `currency` (text)
    - `is_joint` (boolean, default false)
    - `joint_names` (text[], nullable)
    - `verified` (boolean, default false)
    - `created_at` (timestamptz)

  ### Instruments
  - `instruments` - Asset catalog (Bonds, Funds, Gold Contracts)
    - `id` (uuid, primary key)
    - `asset_class` (enum: FIXED_INCOME, MANAGED_FUND, GOLD_CONTRACT)
    - `issuer_name` (text)
    - `issuer_domain` (text) - for Clearbit logos
    - `symbol` (text, nullable)
    - `isin` (text, nullable)
    - `currency` (text)
    - `metadata_json` (jsonb) - asset-specific data
    - `coupon_schedule_json` (jsonb, nullable) - for bonds/funds
    - `is_active` (boolean, default true)
    - `created_at`, `updated_at` (timestamptz)

  ### Holdings
  - `holdings` - Client positions in instruments
    - `id` (uuid, primary key)
    - `client_id` (uuid, references clients)
    - `instrument_id` (uuid, references instruments)
    - `currency` (text)
    - `face_or_units` (numeric)
    - `price` (numeric)
    - `cost_basis` (numeric)
    - `current_value` (numeric)
    - `accrued_interest` (numeric, default 0)
    - `unrealised_pl` (numeric, default 0)
    - `start_date` (date)
    - `term_months` (integer) - 12, 24, 36, 48, 60, 120 for bonds; 3, 6, 12 for gold
    - `maturity_date` (date, nullable)
    - `payment_frequency` (enum: MONTHLY, QUARTERLY, BIANNUAL, ANNUAL, nullable)
    - `status` (enum: ACTIVE, MATURED, SOLD, CLOSED, default ACTIVE)
    - `created_at`, `updated_at` (timestamptz)

  ### Cashflows
  - `cashflows` - Expected/actual payment events
    - `id` (uuid, primary key)
    - `holding_id` (uuid, references holdings)
    - `client_id` (uuid, references clients)
    - `date` (date)
    - `type` (enum: COUPON, DIVIDEND, MATURITY, CAPITAL_RETURN)
    - `expected_amount` (numeric)
    - `actual_amount` (numeric, nullable)
    - `currency` (text)
    - `paid` (boolean, default false)
    - `created_at` (timestamptz)

  ### Transactions
  - `transactions` - All financial movements
    - `id` (uuid, primary key)
    - `client_id` (uuid, references clients)
    - `holding_id` (uuid, references holdings, nullable)
    - `type` (enum: DEPOSIT, WITHDRAWAL, COUPON, DIVIDEND, FEE, FX_CONVERSION, TRADE_EXECUTION, CORPORATE_ACTION, MATURITY)
    - `currency` (text)
    - `amount` (numeric)
    - `fx_rate` (numeric, nullable)
    - `status` (enum: PENDING, COMPLETED, FAILED, CANCELLED, default PENDING)
    - `created_by` (uuid, references profiles)
    - `metadata_json` (jsonb)
    - `created_at` (timestamptz)

  ### Documents
  - `documents` - KYC, contracts, statements
    - `id` (uuid, primary key)
    - `client_id` (uuid, references clients)
    - `type` (enum: AGREEMENT, CONTRACT_NOTE, STATEMENT, KYC, OTHER)
    - `title` (text)
    - `file_url` (text)
    - `file_size` (integer)
    - `status` (enum: AVAILABLE, NEEDS_SIGNATURE, SIGNED, REJECTED, default AVAILABLE)
    - `requires_signature` (boolean, default false)
    - `esign_envelope_id` (text, nullable)
    - `uploaded_by` (uuid, references profiles)
    - `created_at`, `updated_at` (timestamptz)

  ### Messages
  - `message_threads` - Chat threads
    - `id` (uuid, primary key)
    - `client_id` (uuid, references clients)
    - `participants` (uuid[]) - array of profile ids
    - `created_at`, `updated_at` (timestamptz)

  - `messages` - Individual messages
    - `id` (uuid, primary key)
    - `thread_id` (uuid, references message_threads)
    - `sender_id` (uuid, references profiles)
    - `body` (text)
    - `attachments` (jsonb[])
    - `read_by` (uuid[]) - array of profile ids who've read
    - `created_at` (timestamptz)

  ### FX Rates
  - `fx_rates` - Daily exchange rates
    - `id` (uuid, primary key)
    - `date` (date)
    - `base` (text, default 'AUD')
    - `quote` (text)
    - `rate` (numeric)
    - `created_at` (timestamptz)
    - Unique constraint on (date, base, quote)

  ### Applications
  - `applications` - Account opening requests
    - `id` (uuid, primary key)
    - `payload_json` (jsonb)
    - `status` (enum: PENDING, APPROVED, REJECTED, default PENDING)
    - `reviewer_id` (uuid, references profiles, nullable)
    - `review_notes` (text, nullable)
    - `created_at`, `updated_at` (timestamptz)

  ### Notifications
  - `notifications` - System alerts
    - `id` (uuid, primary key)
    - `type` (enum: KYC_APPROVED, KYC_REJECTED, DOC_SIGNED, DEPOSIT_CREDITED, COUPON_UPCOMING, MATURITY_UPCOMING, WITHDRAWAL_PAID, WITHDRAWAL_REJECTED)
    - `client_id` (uuid, references clients)
    - `data_json` (jsonb)
    - `read` (boolean, default false)
    - `created_at` (timestamptz)

  ### Audit Log
  - `audit_logs` - Compliance audit trail
    - `id` (uuid, primary key)
    - `actor_id` (uuid, references profiles)
    - `action` (text)
    - `entity` (text)
    - `entity_id` (uuid, nullable)
    - `before_json` (jsonb, nullable)
    - `after_json` (jsonb, nullable)
    - `created_at` (timestamptz)

  ### System Config
  - `system_config` - App-wide settings
    - `key` (text, primary key)
    - `value` (jsonb)
    - `updated_at` (timestamptz)

  ## 2. Security
  - Enable RLS on all tables
  - Policies ensure clients only see their own data
  - Advisors see only assigned clients
  - Admins see all
  - Auditors have read-only access to all

  ## 3. Indexes
  - Performance indexes on foreign keys and frequently queried columns
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create ENUMS
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'OPS', 'ADVISOR', 'CLIENT', 'AUDITOR');
CREATE TYPE account_type AS ENUM ('INDIVIDUAL', 'JOINT', 'CORPORATE');
CREATE TYPE kyc_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE asset_class AS ENUM ('FIXED_INCOME', 'MANAGED_FUND', 'GOLD_CONTRACT');
CREATE TYPE payment_frequency AS ENUM ('MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL');
CREATE TYPE holding_status AS ENUM ('ACTIVE', 'MATURED', 'SOLD', 'CLOSED');
CREATE TYPE cashflow_type AS ENUM ('COUPON', 'DIVIDEND', 'MATURITY', 'CAPITAL_RETURN');
CREATE TYPE transaction_type AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'COUPON', 'DIVIDEND', 'FEE', 'FX_CONVERSION', 'TRADE_EXECUTION', 'CORPORATE_ACTION', 'MATURITY');
CREATE TYPE transaction_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE document_type AS ENUM ('AGREEMENT', 'CONTRACT_NOTE', 'STATEMENT', 'KYC', 'OTHER');
CREATE TYPE document_status AS ENUM ('AVAILABLE', 'NEEDS_SIGNATURE', 'SIGNED', 'REJECTED');
CREATE TYPE application_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE notification_type AS ENUM ('KYC_APPROVED', 'KYC_REJECTED', 'DOC_SIGNED', 'DEPOSIT_CREDITED', 'COUPON_UPCOMING', 'MATURITY_UPCOMING', 'WITHDRAWAL_PAID', 'WITHDRAWAL_REJECTED');

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'CLIENT',
  name text NOT NULL,
  phone text,
  locale text DEFAULT 'en-GB',
  is_demo boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Advisors
CREATE TABLE IF NOT EXISTS advisors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  advisor_id uuid REFERENCES advisors(id) ON DELETE SET NULL,
  account_type account_type NOT NULL DEFAULT 'INDIVIDUAL',
  base_currency text NOT NULL DEFAULT 'AUD',
  risk_score integer CHECK (risk_score >= 1 AND risk_score <= 10),
  knowledge_json jsonb DEFAULT '{}'::jsonb,
  kyc_status kyc_status DEFAULT 'PENDING',
  kyc_rejection_reason text,
  bank_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Cash Balances
CREATE TABLE IF NOT EXISTS cash_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  currency text NOT NULL,
  balance numeric NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id, currency)
);

-- Client Bank Accounts
CREATE TABLE IF NOT EXISTS client_bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name_on_account text NOT NULL,
  account_number text NOT NULL,
  iban text,
  bsb_or_sort_code text,
  bank_name text NOT NULL,
  currency text NOT NULL,
  is_joint boolean DEFAULT false,
  joint_names text[],
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Instruments
CREATE TABLE IF NOT EXISTS instruments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_class asset_class NOT NULL,
  issuer_name text NOT NULL,
  issuer_domain text,
  symbol text,
  isin text,
  currency text NOT NULL,
  metadata_json jsonb DEFAULT '{}'::jsonb,
  coupon_schedule_json jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Holdings
CREATE TABLE IF NOT EXISTS holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  instrument_id uuid NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
  currency text NOT NULL,
  face_or_units numeric NOT NULL,
  price numeric NOT NULL,
  cost_basis numeric NOT NULL,
  current_value numeric NOT NULL,
  accrued_interest numeric DEFAULT 0,
  unrealised_pl numeric DEFAULT 0,
  start_date date NOT NULL,
  term_months integer NOT NULL,
  maturity_date date,
  payment_frequency payment_frequency,
  status holding_status DEFAULT 'ACTIVE',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Cashflows
CREATE TABLE IF NOT EXISTS cashflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  holding_id uuid NOT NULL REFERENCES holdings(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date date NOT NULL,
  type cashflow_type NOT NULL,
  expected_amount numeric NOT NULL,
  actual_amount numeric,
  currency text NOT NULL,
  paid boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  holding_id uuid REFERENCES holdings(id) ON DELETE SET NULL,
  type transaction_type NOT NULL,
  currency text NOT NULL,
  amount numeric NOT NULL,
  fx_rate numeric,
  status transaction_status DEFAULT 'PENDING',
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  metadata_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type document_type NOT NULL,
  title text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  status document_status DEFAULT 'AVAILABLE',
  requires_signature boolean DEFAULT false,
  esign_envelope_id text,
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Message Threads
CREATE TABLE IF NOT EXISTS message_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  participants uuid[] NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  attachments jsonb[] DEFAULT ARRAY[]::jsonb[],
  read_by uuid[] DEFAULT ARRAY[]::uuid[],
  created_at timestamptz DEFAULT now()
);

-- FX Rates
CREATE TABLE IF NOT EXISTS fx_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  base text NOT NULL DEFAULT 'AUD',
  quote text NOT NULL,
  rate numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(date, base, quote)
);

-- Applications
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payload_json jsonb NOT NULL,
  status application_status DEFAULT 'PENDING',
  reviewer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  review_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type notification_type NOT NULL,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  data_json jsonb DEFAULT '{}'::jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz DEFAULT now()
);

-- System Config
CREATE TABLE IF NOT EXISTS system_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_advisor_id ON clients(advisor_id);
CREATE INDEX IF NOT EXISTS idx_clients_kyc_status ON clients(kyc_status);
CREATE INDEX IF NOT EXISTS idx_cash_balances_client_id ON cash_balances(client_id);
CREATE INDEX IF NOT EXISTS idx_holdings_client_id ON holdings(client_id);
CREATE INDEX IF NOT EXISTS idx_holdings_instrument_id ON holdings(instrument_id);
CREATE INDEX IF NOT EXISTS idx_holdings_status ON holdings(status);
CREATE INDEX IF NOT EXISTS idx_cashflows_holding_id ON cashflows(holding_id);
CREATE INDEX IF NOT EXISTS idx_cashflows_client_id ON cashflows(client_id);
CREATE INDEX IF NOT EXISTS idx_cashflows_date ON cashflows(date);
CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_message_threads_client_id ON message_threads(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_client_id ON notifications(client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE fx_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;