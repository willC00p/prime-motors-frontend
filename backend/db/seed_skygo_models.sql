-- Idempotent seeder for SKYGO models
-- Inserts items for SKYGO brand if they don't already exist (by item_no)

BEGIN;

-- Ensure items have cost_of_purchase column (no-op if exists)
ALTER TABLE items ADD COLUMN IF NOT EXISTS cost_of_purchase DECIMAL(12,2);

-- Upsert using item_no as key so re-running is safe
INSERT INTO items (item_no, brand, model, color, srp, cost_of_purchase, created_at)
VALUES ('SG-TM175','SKYGO','MONARCH 175', ARRAY['Black Green','Blue','Red'], 50000.00, 44500.00, NOW())
ON CONFLICT (item_no) DO UPDATE SET brand = EXCLUDED.brand, model = EXCLUDED.model, color = EXCLUDED.color, srp = EXCLUDED.srp, cost_of_purchase = EXCLUDED.cost_of_purchase;

INSERT INTO items (item_no, brand, model, color, srp, cost_of_purchase, created_at)
VALUES ('SG-TM150','SKYGO','MONARCH 150', ARRAY['Black Green','Blue','Red'], 48000.00, 42720.00, NOW())
ON CONFLICT (item_no) DO UPDATE SET brand = EXCLUDED.brand, model = EXCLUDED.model, color = EXCLUDED.color, srp = EXCLUDED.srp, cost_of_purchase = EXCLUDED.cost_of_purchase;

INSERT INTO items (item_no, brand, model, color, srp, cost_of_purchase, created_at)
VALUES ('SG-TM125','SKYGO','MONARCH 125', ARRAY['Blue'], 46000.00, 40940.00, NOW())
ON CONFLICT (item_no) DO UPDATE SET brand = EXCLUDED.brand, model = EXCLUDED.model, color = EXCLUDED.color, srp = EXCLUDED.srp, cost_of_purchase = EXCLUDED.cost_of_purchase;

INSERT INTO items (item_no, brand, model, color, srp, cost_of_purchase, created_at)
VALUES ('SG-WM125','SKYGO','OMNI 125', ARRAY['Matte Blue','Pearl White','Night Gray'], 72000.00, 64080.00, NOW())
ON CONFLICT (item_no) DO UPDATE SET brand = EXCLUDED.brand, model = EXCLUDED.model, color = EXCLUDED.color, srp = EXCLUDED.srp, cost_of_purchase = EXCLUDED.cost_of_purchase;

INSERT INTO items (item_no, brand, model, color, srp, cost_of_purchase, created_at)
VALUES ('SG-RM150ST','SKYGO','M1 ARROW 150', ARRAY['Silverblade','Obsidian Black'], 79000.00, 70310.00, NOW())
ON CONFLICT (item_no) DO UPDATE SET brand = EXCLUDED.brand, model = EXCLUDED.model, color = EXCLUDED.color, srp = EXCLUDED.srp, cost_of_purchase = EXCLUDED.cost_of_purchase;

INSERT INTO items (item_no, brand, model, color, srp, cost_of_purchase, created_at)
VALUES ('SG-RM125','SKYGO','CAFE 125', ARRAY['Bee Yellow','Bright Orange'], 52000.00, 46280.00, NOW())
ON CONFLICT (item_no) DO UPDATE SET brand = EXCLUDED.brand, model = EXCLUDED.model, color = EXCLUDED.color, srp = EXCLUDED.srp, cost_of_purchase = EXCLUDED.cost_of_purchase;

INSERT INTO items (item_no, brand, model, color, srp, cost_of_purchase, created_at)
VALUES ('SG-RM110CB','SKYGO','CUB 110', ARRAY['Blue','Steel Gray'], 48000.00, 42720.00, NOW())
ON CONFLICT (item_no) DO UPDATE SET brand = EXCLUDED.brand, model = EXCLUDED.model, color = EXCLUDED.color, srp = EXCLUDED.srp, cost_of_purchase = EXCLUDED.cost_of_purchase;

INSERT INTO items (item_no, brand, model, color, srp, cost_of_purchase, created_at)
VALUES ('SG-RM125CB','SKYGO','E1 AXIS 125', ARRAY['Frost White','Frost Green'], 77000.00, 68530.00, NOW())
ON CONFLICT (item_no) DO UPDATE SET brand = EXCLUDED.brand, model = EXCLUDED.model, color = EXCLUDED.color, srp = EXCLUDED.srp, cost_of_purchase = EXCLUDED.cost_of_purchase;

INSERT INTO items (item_no, brand, model, color, srp, cost_of_purchase, created_at)
VALUES ('SG-RM175CB','SKYGO','M1 SPEAR 180 FI', ARRAY['Navy Blue','Black Gold'], 110000.00, 97900.00, NOW())
ON CONFLICT (item_no) DO UPDATE SET brand = EXCLUDED.brand, model = EXCLUDED.model, color = EXCLUDED.color, srp = EXCLUDED.srp, cost_of_purchase = EXCLUDED.cost_of_purchase;

INSERT INTO items (item_no, brand, model, color, srp, cost_of_purchase, created_at)
VALUES ('SG-RM250ST','SKYGO','P1 TEMPEST 250', ARRAY['Matte Black','Classic Yellow'], 135000.00, 120150.00, NOW())
ON CONFLICT (item_no) DO UPDATE SET brand = EXCLUDED.brand, model = EXCLUDED.model, color = EXCLUDED.color, srp = EXCLUDED.srp, cost_of_purchase = EXCLUDED.cost_of_purchase;

INSERT INTO items (item_no, brand, model, color, srp, cost_of_purchase, created_at)
VALUES ('SG-SG150-L','SKYGO','M1 LANCE 150', ARRAY['Black Gold','White Gold'], 97000.00, 86330.00, NOW())
ON CONFLICT (item_no) DO UPDATE SET brand = EXCLUDED.brand, model = EXCLUDED.model, color = EXCLUDED.color, srp = EXCLUDED.srp, cost_of_purchase = EXCLUDED.cost_of_purchase;

INSERT INTO items (item_no, brand, model, color, srp, cost_of_purchase, created_at)
VALUES ('SG-TM150T','SKYGO','P1 BOLT 150', ARRAY['Black Silver','Brown Silver'], 115000.00, 102350.00, NOW())
ON CONFLICT (item_no) DO UPDATE SET brand = EXCLUDED.brand, model = EXCLUDED.model, color = EXCLUDED.color, srp = EXCLUDED.srp, cost_of_purchase = EXCLUDED.cost_of_purchase;

INSERT INTO items (item_no, brand, model, color, srp, cost_of_purchase, created_at)
VALUES ('SG-SG150T-KL','SKYGO','KPV 150 KEYLESS', ARRAY['Blue'], 118000.00, 105020.00, NOW())
ON CONFLICT (item_no) DO UPDATE SET brand = EXCLUDED.brand, model = EXCLUDED.model, color = EXCLUDED.color, srp = EXCLUDED.srp, cost_of_purchase = EXCLUDED.cost_of_purchase;

COMMIT;

-- Return inserted/available SKYGO items
SELECT id, item_no, brand, model, srp FROM items WHERE brand = 'SKYGO' ORDER BY item_no;
