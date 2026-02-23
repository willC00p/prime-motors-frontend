-- Add prepared_by and checked_by columns to purchase_orders table
ALTER TABLE purchase_orders 
ADD COLUMN IF NOT EXISTS prepared_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS checked_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(50);
