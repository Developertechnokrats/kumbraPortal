/*
  # Add Pending Payment Status for Holdings

  1. Changes
    - Add 'PENDING_PAYMENT' to holding_status enum
    - This allows admins to create investments that await payment/funding
  
  2. Purpose
    - Enable admins to override insufficient funds and create holdings
    - These holdings will show as "Pending Payment" until funded
    - Provides flexibility for manual investment workflows
*/

-- Add PENDING_PAYMENT to holding_status enum
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'PENDING_PAYMENT' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'holding_status')
  ) THEN
    ALTER TYPE holding_status ADD VALUE 'PENDING_PAYMENT';
  END IF;
END $$;
