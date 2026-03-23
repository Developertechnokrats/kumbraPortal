/*
  # Create Product Settings System

  1. New Tables
    - `product_settings`
      - `id` (uuid, primary key)
      - `product_type` (text) - 'BONDS', 'MANAGED_FUNDS', 'GOLD_CONTRACTS'
      - `setting_key` (text) - e.g., 'minimum_investment', 'payment_frequencies', 'term_options'
      - `setting_value` (jsonb) - flexible storage for different setting types
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `product_settings` table
    - Only super_admin users can read/write product settings

  3. Initial Data
    - Default bond settings with minimum investment, payment frequencies, and term options
*/

-- Create product_settings table
CREATE TABLE IF NOT EXISTS product_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type text NOT NULL CHECK (product_type IN ('BONDS', 'MANAGED_FUNDS', 'GOLD_CONTRACTS')),
  setting_key text NOT NULL,
  setting_value jsonb NOT NULL DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_type, setting_key)
);

-- Enable RLS
ALTER TABLE product_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only super_admin can access
CREATE POLICY "Super admin can view product settings"
  ON product_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "Super admin can insert product settings"
  ON product_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "Super admin can update product settings"
  ON product_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "Super admin can delete product settings"
  ON product_settings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SUPER_ADMIN'
    )
  );

-- Insert default bond settings
INSERT INTO product_settings (product_type, setting_key, setting_value) VALUES
('BONDS', 'minimum_investment', jsonb_build_object('value', 50000, 'currency', 'AUD')),
('BONDS', 'payment_frequencies', jsonb_build_object('options', ARRAY['Semi-annual', 'Annual', 'Quarterly'])),
('BONDS', 'term_options', jsonb_build_object('options', ARRAY[1, 2, 3]))
ON CONFLICT (product_type, setting_key) DO NOTHING;
