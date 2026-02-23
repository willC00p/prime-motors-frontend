-- Add cost column to sales_items table for tracking the cost of sold units
ALTER TABLE sales_items ADD COLUMN IF NOT EXISTS cost DECIMAL(12,2);
