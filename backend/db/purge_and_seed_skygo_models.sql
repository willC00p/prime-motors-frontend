-- Purge SKYGO items and related inventory, add cost_of_purchase to items, and seed SKYGO models
BEGIN;

-- Add cost_of_purchase column if missing
ALTER TABLE items ADD COLUMN IF NOT EXISTS cost_of_purchase DECIMAL(12,2);

-- Remove vehicle_units and inventory_movements that reference SKYGO items
DELETE FROM vehicle_units v
USING inventory_movements im, items it
WHERE v.inventory_id = im.id AND im.item_id = it.id AND it.brand = 'SKYGO';

DELETE FROM inventory_movements im
USING items it
WHERE im.item_id = it.id AND it.brand = 'SKYGO';

-- Remove SKYGO items (we will re-insert canonical list)
DELETE FROM items WHERE brand = 'SKYGO';

-- Insert/update SKYGO items with SRP, cost_of_purchase and colors
-- Using ON CONFLICT on item_no to be idempotent

INSERT INTO items (item_no, brand, model, color, srp, cost_of_purchase, created_at)
VALUES
  ('TM175','SKYGO','MONARCH 175', ARRAY['Black Green','Blue','Red'], 50000.00, 44500.00, NOW()),
  ('TM150','SKYGO','MONARCH 150', ARRAY['Black Green','Blue','Red'], 48000.00, 42720.00, NOW()),
  ('TM125','SKYGO','MONARCH 125', ARRAY['Blue'], 46000.00, 40940.00, NOW()),
  ('WM125','SKYGO','OMNI 125', ARRAY['Matte Blue','Pearl White','Night Gray'], 72000.00, 64080.00, NOW()),
  ('RM150ST','SKYGO','M1 ARROW 150', ARRAY['Silverblade','Obsidian Black'], 79000.00, 70310.00, NOW()),
  ('RM125','SKYGO','CAFE 125', ARRAY['Bee Yellow','Bright Orange'], 52000.00, 46280.00, NOW()),
  ('RM110CB','SKYGO','CUB 110', ARRAY['Blue','Steel Gray'], 48000.00, 42720.00, NOW()),
  ('RM125CB','SKYGO','E1 AXIS 125', ARRAY['Frost White','Frost Green'], 77000.00, 68530.00, NOW()),
  ('RM175CB','SKYGO','M1 SPEAR 180 FI', ARRAY['Navy Blue','Black Gold'], 110000.00, 97900.00, NOW()),
  ('RM250ST','SKYGO','P1 TEMPEST 250', ARRAY['Matte Black','Classic Yellow'], 135000.00, 120150.00, NOW()),
  ('SG150-L','SKYGO','M1 LANCE 150', ARRAY['Black Gold','White Gold'], 97000.00, 86330.00, NOW()),
  ('TM150T','SKYGO','P1 BOLT 150', ARRAY['Black Silver','Brown Silver'], 115000.00, 102350.00, NOW()),
  ('SG150T KL','SKYGO','KPV 150 KEYLESS', ARRAY['Blue'], 118000.00, 105020.00, NOW())
ON CONFLICT (item_no) DO UPDATE
  SET model = EXCLUDED.model,
      color = EXCLUDED.color,
      srp = EXCLUDED.srp,
      cost_of_purchase = EXCLUDED.cost_of_purchase;

COMMIT;

-- Return SKYGO items for verification
SELECT id, item_no, model, srp, cost_of_purchase, color FROM items WHERE brand = 'SKYGO' ORDER BY item_no;
