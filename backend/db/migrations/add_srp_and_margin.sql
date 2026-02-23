-- Add SRP column to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS srp NUMERIC(12,2);

-- Add SRP and margin columns to inventory_movements table
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS srp NUMERIC(12,2);
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS margin NUMERIC(12,2) GENERATED ALWAYS AS (
  CASE 
    WHEN srp IS NOT NULL AND cost > 0 
    THEN ((srp - cost) / cost) * 100 
    ELSE 0 
  END
) STORED;
