/*
  # Add Client Payment Instructions

  1. Changes
    - Adds payment instruction fields to clients table
    - Account name, BSB, and account number for bank transfers
    - Allows admins to provide unique payment details per client

  2. New Fields
    - `payment_account_name` (text) - Name on the bank account
    - `payment_bsb` (text) - 6-digit BSB number
    - `payment_account_number` (text) - 6-9 digit account number
*/

-- Add payment instruction fields to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS payment_account_name text,
ADD COLUMN IF NOT EXISTS payment_bsb text,
ADD COLUMN IF NOT EXISTS payment_account_number text;
