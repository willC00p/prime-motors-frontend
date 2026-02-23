-- Add check_date column to purchase_orders table
ALTER TABLE purchase_orders 
ADD COLUMN IF NOT EXISTS check_date DATE;
