/*
  # Restrict Instruments to SUPER_ADMIN Only

  ## Summary
  Updates RLS policies to ensure only SUPER_ADMIN users can add/modify/delete instruments.
  All authenticated users can still view active instruments.

  ## Changes
  - Drop existing instruments management policy
  - Create new policies that only allow SUPER_ADMIN to modify instruments
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Admins can manage instruments" ON instruments;

-- Allow all authenticated users to view active instruments
CREATE POLICY "Anyone can view active instruments"
  ON instruments FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Only SUPER_ADMIN can insert instruments
CREATE POLICY "SUPER_ADMIN can insert instruments"
  ON instruments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'SUPER_ADMIN'
    )
  );

-- Only SUPER_ADMIN can update instruments
CREATE POLICY "SUPER_ADMIN can update instruments"
  ON instruments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'SUPER_ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'SUPER_ADMIN'
    )
  );

-- Only SUPER_ADMIN can delete instruments
CREATE POLICY "SUPER_ADMIN can delete instruments"
  ON instruments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'SUPER_ADMIN'
    )
  );
