-- Add status field to vehicle_units
ALTER TABLE vehicle_units
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'available';

-- Add constraint to vehicle_units status
ALTER TABLE vehicle_units
ADD CONSTRAINT valid_vehicle_status 
CHECK (status IN ('available', 'sold', 'reserved'));

-- Update schema to ensure proper relationships
ALTER TABLE sales_items
ADD CONSTRAINT fk_sales_items_vehicle_unit
FOREIGN KEY (vehicle_unit_id)
REFERENCES vehicle_units(id)
ON DELETE NO ACTION
ON UPDATE NO ACTION;
