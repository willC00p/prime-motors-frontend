-- Increase precision of decimal fields in purchase_orders and purchase_order_items
ALTER TABLE purchase_orders 
    ALTER COLUMN dealer_discount TYPE DECIMAL(12,2),
    DROP COLUMN IF EXISTS prompt_rebate_pct;

ALTER TABLE purchase_order_items
    ALTER COLUMN unit_price TYPE DECIMAL(12,2),
    ALTER COLUMN amount TYPE DECIMAL(12,2),
    ALTER COLUMN rebate_percentage TYPE DECIMAL(12,2);
