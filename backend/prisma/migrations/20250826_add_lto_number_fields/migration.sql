-- Add new number fields to lto_registrations table
ALTER TABLE "lto_registrations"
ADD COLUMN IF NOT EXISTS "csr_number" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "sdr_number" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "insurance_number" VARCHAR(50);
