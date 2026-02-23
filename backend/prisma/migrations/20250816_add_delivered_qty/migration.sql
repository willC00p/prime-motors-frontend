-- Add delivered_qty to purchase_order_items
ALTER TABLE purchase_order_items ADD COLUMN delivered_qty INTEGER NOT NULL DEFAULT 0;
