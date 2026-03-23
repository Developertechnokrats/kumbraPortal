/*
  # Seed Initial Data

  ## Overview
  Seeds the database with:
  1. Sample instruments (Bonds, Managed Funds, Gold Contracts)
  2. FX rates for major currencies
  3. System configuration
  4. Demo client with complete data
  
  ## Important Notes
  - Demo user must be created via auth before this can be fully utilized
  - In production, run separate migration after demo user is created
  - This provides catalog data that all users can reference
*/

-- Insert sample instruments

-- Fixed Income (Bonds)
INSERT INTO instruments (asset_class, issuer_name, issuer_domain, symbol, isin, currency, metadata_json, coupon_schedule_json) VALUES
('FIXED_INCOME', 'Barclays PLC', 'barclays.com', 'BARC', 'GB0031348658', 'GBP', 
 '{"coupon_rate": 10.0, "day_count": "30/360", "description": "Senior Unsecured Notes"}', 
 '{"frequency": "QUARTERLY", "payment_months": [3, 6, 9, 12]}'
),
('FIXED_INCOME', 'Commonwealth Bank of Australia', 'commbank.com.au', 'CBA', 'AU000000CBA7', 'AUD',
 '{"coupon_rate": 5.5, "day_count": "ACT/365", "description": "Tier 2 Capital Notes"}',
 '{"frequency": "QUARTERLY", "payment_months": [3, 6, 9, 12]}'
),
('FIXED_INCOME', 'National Australia Bank', 'nab.com.au', 'NAB', 'AU000000NAB4', 'AUD',
 '{"coupon_rate": 6.25, "day_count": "ACT/365", "description": "Subordinated Notes"}',
 '{"frequency": "BIANNUAL", "payment_months": [6, 12]}'
),
('FIXED_INCOME', 'Apple Inc', 'apple.com', 'AAPL', 'US037833AK68', 'USD',
 '{"coupon_rate": 4.65, "day_count": "30/360", "description": "Senior Notes"}',
 '{"frequency": "BIANNUAL", "payment_months": [5, 11]}'
);

-- Managed Funds
INSERT INTO instruments (asset_class, issuer_name, issuer_domain, currency, metadata_json, coupon_schedule_json) VALUES
('MANAGED_FUND', 'Kumbra Secure Income Fund', 'kumbra-capital.com', 'AUD',
 '{"strategy": "Conservative fixed income with capital preservation focus", "benchmark": "Bloomberg AusBond Composite Index", "management_fee": 0.75, "performance_fee": 0, "distribution_policy": "Monthly", "inception_date": "2020-01-01"}',
 '{"frequency": "MONTHLY", "payment_day": 15}'
),
('MANAGED_FUND', 'Kumbra Adventurous Fixed Income Fund', 'kumbra-capital.com', 'AUD',
 '{"strategy": "High-yield corporate bonds and emerging market debt", "benchmark": "50% Bloomberg Global High Yield / 50% JPM EMBI Global", "management_fee": 1.25, "performance_fee": 15, "distribution_policy": "Quarterly", "inception_date": "2019-06-01"}',
 '{"frequency": "QUARTERLY", "payment_months": [3, 6, 9, 12], "payment_day": 20}'
),
('MANAGED_FUND', 'Kumbra Crypto Managed Fund', 'kumbra-capital.com', 'USD',
 '{"strategy": "Diversified digital asset portfolio with BTC, ETH, and select altcoins", "benchmark": "Custom crypto composite", "management_fee": 2.0, "performance_fee": 20, "distribution_policy": "Monthly", "inception_date": "2021-03-01"}',
 '{"frequency": "MONTHLY", "payment_day": 1}'
),
('MANAGED_FUND', 'Kumbra IPO/Pre-IPO Fund', 'kumbra-capital.com', 'USD',
 '{"strategy": "Late-stage private equity and IPO allocations", "benchmark": "MSCI World Index + 500bps", "management_fee": 2.5, "performance_fee": 20, "distribution_policy": "Annual", "inception_date": "2022-01-01"}',
 '{"frequency": "ANNUAL", "payment_months": [12], "payment_day": 31}'
);

-- Gold Contracts (Derivatives)
INSERT INTO instruments (asset_class, issuer_name, issuer_domain, currency, metadata_json) VALUES
('GOLD_CONTRACT', 'Gold Forward Contract', 'kumbra-capital.com', 'USD',
 '{"type": "Forward", "underlying": "Gold (XAU)", "contract_size": "1 troy oz", "settlement": "Cash", "available_tenors": [3, 6, 12]}'
),
('GOLD_CONTRACT', 'Gold Leveraged Contract', 'kumbra-capital.com', 'USD',
 '{"type": "Leveraged", "underlying": "Gold (XAU)", "contract_size": "1 troy oz", "leverage": "5x", "settlement": "Cash", "available_tenors": [3, 6, 12]}'
);

-- Insert FX rates (recent rates as of end 2024)
INSERT INTO fx_rates (date, base, quote, rate) VALUES
(CURRENT_DATE, 'AUD', 'USD', 0.66),
(CURRENT_DATE, 'AUD', 'EUR', 0.62),
(CURRENT_DATE, 'AUD', 'GBP', 0.52),
(CURRENT_DATE, 'AUD', 'CAD', 0.92),
(CURRENT_DATE, 'AUD', 'AUD', 1.0),
(CURRENT_DATE, 'USD', 'AUD', 1.52),
(CURRENT_DATE, 'USD', 'EUR', 0.94),
(CURRENT_DATE, 'USD', 'GBP', 0.79),
(CURRENT_DATE, 'USD', 'CAD', 1.39),
(CURRENT_DATE, 'USD', 'USD', 1.0),
(CURRENT_DATE, 'EUR', 'AUD', 1.61),
(CURRENT_DATE, 'EUR', 'USD', 1.06),
(CURRENT_DATE, 'EUR', 'GBP', 0.84),
(CURRENT_DATE, 'EUR', 'CAD', 1.48),
(CURRENT_DATE, 'EUR', 'EUR', 1.0),
(CURRENT_DATE, 'GBP', 'AUD', 1.92),
(CURRENT_DATE, 'GBP', 'USD', 1.27),
(CURRENT_DATE, 'GBP', 'EUR', 1.19),
(CURRENT_DATE, 'GBP', 'CAD', 1.76),
(CURRENT_DATE, 'GBP', 'GBP', 1.0);

-- Insert system configuration
INSERT INTO system_config (key, value) VALUES
('base_currency', '"AUD"'),
('supported_currencies', '["AUD", "USD", "EUR", "GBP", "CAD"]'),
('bank_instructions', '{
  "AUD": {
    "bank_name": "National Australia Bank",
    "account_name": "Kumbra Capital Pty Ltd Client Trust Account",
    "bsb": "082-001",
    "account_number": "123456789",
    "swift": "NATAAU3303M",
    "reference_format": "QC-{CLIENT_ID}"
  },
  "USD": {
    "bank_name": "JPMorgan Chase Bank N.A.",
    "account_name": "Kumbra Capital Pty Ltd USD Client Account",
    "account_number": "987654321",
    "swift": "CHASUS33",
    "aba": "021000021",
    "reference_format": "QC-{CLIENT_ID}"
  },
  "EUR": {
    "bank_name": "Deutsche Bank AG",
    "account_name": "Kumbra Capital Pty Ltd EUR Client Account",
    "iban": "DE89370400440532013000",
    "swift": "DEUTDEFF",
    "reference_format": "QC-{CLIENT_ID}"
  },
  "GBP": {
    "bank_name": "Barclays Bank PLC",
    "account_name": "Kumbra Capital Pty Ltd GBP Client Account",
    "account_number": "12345678",
    "sort_code": "20-00-00",
    "swift": "BARCGB22",
    "reference_format": "QC-{CLIENT_ID}"
  }
}'),
('crypto_addresses', '{
  "BTC": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  "ETH": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "USDT": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}'),
('email_templates', '{
  "kyc_approved": {
    "subject": "KYC Approved - Welcome to Kumbra Capital",
    "body": "Your KYC documents have been approved. You can now fund your account and start investing."
  },
  "kyc_rejected": {
    "subject": "KYC Review Required",
    "body": "We need additional information to complete your verification. Please check your portal for details."
  },
  "deposit_credited": {
    "subject": "Deposit Confirmed",
    "body": "Your deposit of {AMOUNT} {CURRENCY} has been credited to your account."
  },
  "withdrawal_paid": {
    "subject": "Withdrawal Processed",
    "body": "Your withdrawal of {AMOUNT} {CURRENCY} has been processed and sent to your nominated bank account."
  }
}'),
('features', '{
  "card_payments_enabled": false,
  "crypto_deposits_enabled": true,
  "two_factor_required": false,
  "demo_account_enabled": true
}');

-- Create trigger function to auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_instruments_updated_at BEFORE UPDATE ON instruments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_holdings_updated_at BEFORE UPDATE ON holdings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_threads_updated_at BEFORE UPDATE ON message_threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cash_balances_updated_at BEFORE UPDATE ON cash_balances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate holding values (useful for updates)
CREATE OR REPLACE FUNCTION calculate_holding_value(
  face_or_units_val numeric,
  current_price numeric
)
RETURNS numeric AS $$
BEGIN
  RETURN face_or_units_val * current_price;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate cashflow schedule
CREATE OR REPLACE FUNCTION generate_cashflows(
  p_holding_id uuid,
  p_client_id uuid,
  p_start_date date,
  p_term_months integer,
  p_frequency payment_frequency,
  p_amount numeric,
  p_currency text,
  p_cashflow_type cashflow_type
)
RETURNS void AS $$
DECLARE
  v_current_date date;
  v_maturity_date date;
  v_interval interval;
BEGIN
  v_maturity_date := p_start_date + (p_term_months || ' months')::interval;
  
  -- Determine interval based on frequency
  CASE p_frequency
    WHEN 'MONTHLY' THEN v_interval := '1 month'::interval;
    WHEN 'QUARTERLY' THEN v_interval := '3 months'::interval;
    WHEN 'BIANNUAL' THEN v_interval := '6 months'::interval;
    WHEN 'ANNUAL' THEN v_interval := '12 months'::interval;
    ELSE v_interval := '3 months'::interval;
  END CASE;
  
  -- Generate payment dates
  v_current_date := p_start_date + v_interval;
  
  WHILE v_current_date <= v_maturity_date LOOP
    INSERT INTO cashflows (holding_id, client_id, date, type, expected_amount, currency)
    VALUES (p_holding_id, p_client_id, v_current_date, p_cashflow_type, p_amount, p_currency);
    
    v_current_date := v_current_date + v_interval;
  END LOOP;
  
  -- Add maturity event if it's a bond
  IF p_cashflow_type = 'COUPON' THEN
    INSERT INTO cashflows (holding_id, client_id, date, type, expected_amount, currency)
    VALUES (p_holding_id, p_client_id, v_maturity_date, 'MATURITY', 0, p_currency);
  END IF;
END;
$$ LANGUAGE plpgsql;