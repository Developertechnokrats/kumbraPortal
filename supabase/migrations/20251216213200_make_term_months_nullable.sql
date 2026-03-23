/*
  # Make term_months nullable for IPO holdings

  1. Changes
    - Alter holdings table to make term_months nullable
    - IPO investments and other asset classes don't have term lengths
    - Only bonds and managed funds typically have terms

  2. Security
    - No changes to RLS policies
*/

ALTER TABLE holdings 
ALTER COLUMN term_months DROP NOT NULL;
