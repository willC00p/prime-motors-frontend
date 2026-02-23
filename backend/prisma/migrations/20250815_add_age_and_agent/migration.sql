-- Add age and agent columns to sales table
ALTER TABLE "sales" ADD COLUMN "age" INTEGER;
ALTER TABLE "sales" ADD COLUMN "agent" VARCHAR(100);

-- Add age validation constraint
ALTER TABLE "sales" ADD CONSTRAINT "age_validation" CHECK (age >= 18 AND age <= 120);
