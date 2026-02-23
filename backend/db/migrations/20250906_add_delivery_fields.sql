-- Migration: add delivery_status and delivery_date to sales
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(20) DEFAULT 'pending';

ALTER TABLE sales
ADD COLUMN IF NOT EXISTS delivery_date DATE;
