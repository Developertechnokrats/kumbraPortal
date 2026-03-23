/*
  # Add PRE_IPO to asset_class enum

  1. Changes
    - Add PRE_IPO value to asset_class enum type
*/

-- Add PRE_IPO to asset_class enum
ALTER TYPE asset_class ADD VALUE IF NOT EXISTS 'PRE_IPO';