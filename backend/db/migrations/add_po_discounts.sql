-- Add rebate percentage and dealer discount columns to purchase orders and items tables
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS dealer_discount DECIMAL(5,2);

ALTER TABLE purchase_order_items
ADD COLUMN IF NOT EXISTS rebate_percentage DECIMAL(5,2);
