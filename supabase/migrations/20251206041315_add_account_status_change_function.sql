-- Add Function for Account Status Changes with Custom Reason/Notes
--
-- Overview:
-- Create a function to update account status with custom reason and notes
-- This ensures the audit trail captures the admin's reason for the change
--
-- Changes:
-- - Create update_account_status function that accepts reason and notes
-- - Function updates client record and logs to account_status_history
-- - Remove automatic trigger (replace with manual function calls)

-- Drop the old trigger that uses default reason
DROP TRIGGER IF EXISTS trigger_log_account_status_change ON clients;
DROP FUNCTION IF EXISTS log_account_status_change();

-- Create new function to update account status with reason
CREATE OR REPLACE FUNCTION update_account_status(
  p_client_id uuid,
  p_new_status account_status,
  p_reason text,
  p_notes text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_old_status account_status;
BEGIN
  -- Get current status
  SELECT account_status INTO v_old_status
  FROM clients
  WHERE id = p_client_id;

  -- Update client status
  UPDATE clients
  SET account_status = p_new_status,
      updated_at = now()
  WHERE id = p_client_id;

  -- Log the change
  INSERT INTO account_status_history (
    client_id,
    old_status,
    new_status,
    changed_by,
    reason,
    notes
  ) VALUES (
    p_client_id,
    COALESCE(v_old_status::text, 'ACTIVE'),
    p_new_status::text,
    auth.uid(),
    p_reason,
    p_notes
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;