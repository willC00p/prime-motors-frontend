-- Drop old status columns
ALTER TABLE lto_registrations 
DROP COLUMN IF EXISTS prf_status,
DROP COLUMN IF EXISTS stencil_status,
DROP COLUMN IF EXISTS emission_status,
DROP COLUMN IF EXISTS csr_status,
DROP COLUMN IF EXISTS dir_status,
DROP COLUMN IF EXISTS insurance_status;

-- Add new number columns
ALTER TABLE lto_registrations 
ADD COLUMN IF NOT EXISTS csr_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS sdr_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS insurance_number VARCHAR(50);
