/*
  # Add PRE_IPO Asset Class

  ## Summary
  Adds PRE_IPO to the asset_class enum to support Pre-IPO stock investments

  ## Changes
  - Add PRE_IPO value to asset_class enum type
*/

ALTER TYPE asset_class ADD VALUE IF NOT EXISTS 'PRE_IPO';
