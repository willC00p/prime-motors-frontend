-- Add age and agent columns to sales table
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS agent VARCHAR(100);

-- Add check constraint for age
ALTER TABLE sales
ADD CONSTRAINT valid_age CHECK (age IS NULL OR (age >= 18 AND age <= 120));
