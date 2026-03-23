/*
  # Update Quotient Capital to Kumbra Capital

  1. Updates
    - Replace all "Quotient" references with "Kumbra" in instruments table
    - Replace all "quotient-capital.com" with "kumbra-capital.com" in instruments
    - Update fund symbols (QSIF -> KSIF, QAFIF -> KAFIF, QCMF -> KCMF, QIPOF -> KIPOF)
    - Update system_config bank instructions account names
    - Update email templates to reference Kumbra Capital
    - Update messages with Quotient references
*/

-- Update instruments table: issuer_name
UPDATE instruments 
SET issuer_name = REPLACE(issuer_name, 'Quotient', 'Kumbra')
WHERE issuer_name LIKE '%Quotient%';

-- Update instruments table: issuer_domain
UPDATE instruments 
SET issuer_domain = 'kumbra-capital.com'
WHERE issuer_domain = 'quotient-capital.com';

-- Update instruments table: symbols
UPDATE instruments 
SET symbol = 'KSIF'
WHERE symbol = 'QSIF';

UPDATE instruments 
SET symbol = 'KAFIF'
WHERE symbol = 'QAFIF';

UPDATE instruments 
SET symbol = 'KCMF'
WHERE symbol = 'QCMF';

UPDATE instruments 
SET symbol = 'KIPOF'
WHERE symbol = 'QIPOF';

-- Update system_config: bank_instructions
UPDATE system_config
SET value = REPLACE(value::text, 'Quotient Capital', 'Kumbra Capital')::jsonb
WHERE key = 'bank_instructions';

-- Update system_config: email_templates
UPDATE system_config
SET value = REPLACE(value::text, 'Quotient Capital', 'Kumbra Capital')::jsonb
WHERE key = 'email_templates';

-- Update messages with Quotient references in body
UPDATE messages
SET body = REPLACE(body, 'Quotient Capital', 'Kumbra Capital')
WHERE body LIKE '%Quotient Capital%';