-- Idempotent seeder for Sta Mesa branch vehicle inventory
-- Mirrors the Kamias seeder logic: finds branch/supplier/item, inserts inventory_movements and vehicle_units per-row,
-- and is safe to re-run (skips existing engine_no or chassis_no).

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      -- branch, item_no, date_received, supplier, tin, dr_no, si_no, brand, model, color, engine_no, chassis_no, pnpc_status, beg_inv, purchased, transfer, sales, ending_inv, note_date, remarks
      ('Prime Motors Sta. Mesa','SGT150T KL','07/05/2025','SKYGO MARKETING CORP','225-520-539-00000',NULL,NULL,'SKYGO','KPV 150','BLUE','1P57MJP1094560','LX8DTK806PA000766','Available',1,0,NULL,0,1,NULL,NULL),
      ('Prime Motors Sta. Mesa','WM125','07/05/2025','SKYGO MARKETING CORP','225-520-539-00000',NULL,NULL,'MONARCH','OMNI 125','BLUE','1P52QMIRTC01233','LWMTJV1C3RT001233','Available',1,1,NULL,1,0,'08/14/2025','RELEASE'),
      ('Prime Motors Sta. Mesa','SG150T 8U','07/07/2025','SKYGO MARKETING CORP','225-520-539-00000',NULL,NULL,'SKYGO','M1 LANCE 150','WHITE/GOLD','1P57MJR1343555','LX8TDK8U1RB001467','Available',1,1,NULL,1,0,'08/12/2025','RELEASE'),
      ('Prime Motors Sta. Mesa','SG150T 8U','07/07/2025','SKYGO MARKETING CORP','225-520-539-00000',NULL,NULL,'SKYGO','M1 LANCE 150','BLACK/GOLD','1P57MJR1343560','LX8TDK8U6RB001450','Available',1,1,NULL,1,0,'07/08/2025','RELEASE'),
      ('Prime Motors Sta. Mesa','TM150T','07/07/2025','SKYGO MARKETING CORP','225-520-539-00000',NULL,NULL,'MONARCH','BOLT 150','BLACK/SILVER','1P57MJS1121595','LX8TDK8G1SB000996','Available',1,1,NULL,1,0,'07/18/2025','RELEASE'),
      ('Prime Motors Sta. Mesa','TM150T','07/07/2025','SKYGO MARKETING CORP','225-520-539-00000',NULL,NULL,'MONARCH','BOLT 150','BLACK/SILVER','1P57MJS1121587','LX8TDK8G7SB000999','Available',1,1,NULL,1,0,'07/15/2025','RELEASE'),
      ('Prime Motors Sta. Mesa','TM150T','07/22/2025','SKYGO MARKETING CORP','225-520-539-00000',NULL,NULL,'MONARCH','BOLT 150','BLACK/SILVER','1P57MJS1121602','LX8TDK8G5SB000998','Available',1,1,NULL,1,0,'07/23/2025','RELEASE'),
      ('Prime Motors Sta. Mesa','SG150T 8U','07/22/2025','SKYGO MARKETING CORP','225-520-539-00000',NULL,NULL,'SKYGO','M1 LANCE 150','BLACK/GOLD','1P57MJR1343559','LX8TDK8UXRB001449','Available',1,1,NULL,1,0,'07/24/2025','RELEASE'),
      ('Prime Motors Sta. Mesa','RM15ST','08/01/2025','MONARCH PH','',NULL,NULL,'MONARCH','ARROW 150','BLACK/SILVER','LRPRTJ500RA000237','JN1P57QMJ24045934','Available',1,0,NULL,0,1,NULL,NULL),
      ('Prime Motors Sta. Mesa','TM150T','08/07/2025','SKYGO MARKETING CORP','225-520-539-00000',NULL,NULL,'MONARCH','BOLT 150','BLACK/SILVER','1P57MJS1121568','LX8TDK8G2SB000988','Available',1,1,NULL,1,0,'08/23/2025','RELEASE'),
      ('Prime Motors Sta. Mesa','TM150T','08/28/2025','SKYGO MARKETING CORP','225-520-539-00000',NULL,NULL,'MONARCH','BOLT 150','BROWN/SILVER','1P57MJR1342607','LX8TDK8GXRB002692','Available',1,1,NULL,1,0,'08/19/2025','RELEASE'),
      ('Prime Motors Sta. Mesa','SG150T 8U','08/28/2025','SKYGO MARKETING CORP','225-520-539-00000',NULL,NULL,'SKYGO','M1 LANCE 150','BLACK/GOLD','1P57MJS1067188','LX8TDK8U3SB000181','Available',1,1,NULL,1,0,'08/29/2025','RELEASE'),
      ('Prime Motors Sta. Mesa','SG150T 8U','08/28/2025','SKYGO MARKETING CORP','225-520-539-00000',NULL,NULL,'SKYGO','M1 LANCE 150','BLACK/GOLD','1P57MJS1067189','LX8TDK8U5SB000182','Available',1,1,NULL,1,0,'09/03/2025','RELEASE'),
      ('Prime Motors Sta. Mesa','SG150T 8U','08/28/2025','SKYGO MARKETING CORP','225-520-539-00000',NULL,NULL,'SKYGO','M1 LANCE 150','BLACK/GOLD','1P57MJS1067199','LX8TDK8U9SB000184','Available',1,1,NULL,1,0,'09/19/2025','RELEASE'),
      ('Prime Motors Sta. Mesa','SG150T 8U','08/28/2025','SKYGO MARKETING CORP','225-520-539-00000',NULL,NULL,'SKYGO','M1 LANCE 150','WHITE/GOLD','1P57MJS1067217','LX8TDK8UXSB000159','Available',1,1,NULL,1,0,'10/09/2025','RELEASE'),
      ('Prime Motors Sta. Mesa','SG150T 8U','08/28/2025','SKYGO MARKETING CORP','225-520-539-00000',NULL,NULL,'SKYGO','M1 LANCE 150','WHITE/GOLD','1P57MJS1067179','LX8TDK8U7SB000135','Available',1,1,NULL,1,0,'09/18/2025','RELEASE'),
      ('Prime Motors Sta. Mesa','TM150T','08/28/2025','SKYGO MARKETING CORP','225-520-539-00000',NULL,NULL,'MONARCH','BOLT 150','BROWN/SILVER','1P57MJS1120599','LX8TDK8G3SB000868','Available',1,1,NULL,1,0,'09/30/2025','RELEASE'),
      ('Prime Motors Sta. Mesa','TM150T','08/28/2025','SKYGO MARKETING CORP','225-520-539-00000',NULL,NULL,'MONARCH','BOLT 150','BROWN/SILVER','1P57MJS1120584','LX8TDK8GXSB000883','Available',1,1,NULL,1,0,'08/14/2025','RELEASE'),
      ('Prime Motors Sta. Mesa','TM150T','10/08/2025','SKYGO MARKETING CORP','225-520-539-00000',NULL,NULL,'MONARCH','BOLT 150','BLACK/SILVER','1P57MJS1230037','LX8TDK8G65SB001691','Available',1,1,NULL,1,0,'10/18/2025','RELEASE'),
      ('Prime Motors Sta. Mesa','TM150T','10/08/2025','SKYGO MARKETING CORP','225-520-539-00000',NULL,NULL,'MONARCH','BOLT 150','BLACK/SILVER','1P57MJS1230007','LX8TDK8G0SB001699','Available',1,0,NULL,0,1,NULL,NULL),
      ('Prime Motors Sta. Mesa','TM150T','10/08/2025','SKYGO MARKETING CORP','225-520-539-00000',NULL,NULL,'MONARCH','BOLT 150','BLACK/SILVER','1P57MJS1230030','LX8TDK8G6SB001660','Available',1,1,NULL,1,0,'10/27/2025','RELEASE'),
      ('Prime Motors Sta. Mesa','TM150T','10/08/2025','SKYGO MARKETING CORP','225-520-539-00000',NULL,NULL,'MONARCH','BOLT 150','BROWN/SILVER','1P57MJS1227272','LX8TDK8G5SB001522','Available',1,1,NULL,1,0,'10/11/2025','RELEASE'),
      ('Prime Motors Sta. Mesa','SG150 8U','10/23/2025','SKYGO MARKETING CORP','225-520-539-00000',NULL,NULL,'SKYGO','M1 LANCE 150','WHITE/GOLD','1P57MJR1297929','LX8TDK8U0RB001086','Available',1,1,NULL,1,0,'10/24/2025','RELEASE')
    ) AS t(branch, item_no, date_received, supplier, tin, dr_no, si_no, brand, model, color, engine_no, chassis_no, pnpc_status, beg_inv, purchased, transfer, sales, ending_inv, note_date, remarks)
  LOOP
    DECLARE
      br_id INT;
      sup_id INT;
      item_id INT;
      inv_id INT;
      sold_qty INT := 0;
      trans_qty INT := 0;
    BEGIN
      -- resolve branch
      SELECT id INTO br_id FROM branches WHERE name ILIKE '%' || r.branch || '%' LIMIT 1;
      IF br_id IS NULL THEN
        INSERT INTO branches (name) VALUES (r.branch) RETURNING id INTO br_id;
      END IF;

      -- resolve supplier (try fuzzy match)
      SELECT id INTO sup_id FROM suppliers WHERE name ILIKE '%' || split_part(r.supplier, ' ', 1) || '%' LIMIT 1;
      IF sup_id IS NULL THEN
        INSERT INTO suppliers (name, tin_number, created_at) VALUES (r.supplier, r.tin, NOW()) RETURNING id INTO sup_id;
      END IF;

      -- resolve item by model + brand, fallback to item_no
      SELECT id INTO item_id FROM items WHERE model ILIKE r.model AND brand ILIKE '%' || r.brand || '%' LIMIT 1;
      IF item_id IS NULL THEN
        SELECT id INTO item_id FROM items WHERE item_no ILIKE '%' || r.item_no || '%' LIMIT 1;
      END IF;
      IF item_id IS NULL THEN
        -- if still not found, create a minimal item row
        INSERT INTO items (item_no, brand, model, color, created_at) VALUES (r.item_no, r.brand, r.model, ARRAY[r.color], NOW()) RETURNING id INTO item_id;
      END IF;

      -- determine sold / transfer flags
      IF r.ending_inv IS NOT NULL AND r.ending_inv = 0 THEN
        sold_qty := 1;
      ELSE
        sold_qty := 0;
      END IF;
      -- Check for transfer indicators: purchased=0, transfer column, or remarks indicate transfer
      -- All rows with ANY transfer indication should go to transferred_history
      IF COALESCE(r.purchased, 1) = 0
         OR (r.transfer IS NOT NULL AND trim(r.transfer) <> '' AND trim(r.transfer) <> '-')
         OR (r.remarks IS NOT NULL AND lower(trim(r.remarks)) LIKE '%transfer%') THEN
        trans_qty := 1;
      ELSE
        trans_qty := 0;
      END IF;

      -- skip if vehicle unit already exists (by engine_no OR chassis_no) in active units OR transferred history
      IF (r.engine_no IS NOT NULL AND r.engine_no <> '' AND (
          EXISTS(SELECT 1 FROM vehicle_units v WHERE v.engine_no = r.engine_no)
        OR EXISTS(SELECT 1 FROM transferred_history th WHERE th.engine_no = r.engine_no)
        ))
         OR (r.chassis_no IS NOT NULL AND r.chassis_no <> '' AND (
          EXISTS(SELECT 1 FROM vehicle_units v WHERE v.chassis_no = r.chassis_no)
        OR EXISTS(SELECT 1 FROM transferred_history th WHERE th.chassis_no = r.chassis_no)
        )) THEN
        -- already present: update the existing inventory_movements color if missing, then skip
        SELECT v.inventory_id INTO inv_id FROM vehicle_units v
        WHERE (r.engine_no IS NOT NULL AND r.engine_no <> '' AND v.engine_no = r.engine_no)
           OR (r.chassis_no IS NOT NULL AND r.chassis_no <> '' AND v.chassis_no = r.chassis_no)
        LIMIT 1;
        IF inv_id IS NOT NULL THEN
          -- update color, srp and cost if missing or different to keep inventory consistent with model
      UPDATE inventory_movements im
      SET color = COALESCE(im.color, NULLIF(r.color, '')),
        srp = COALESCE(im.srp, (SELECT srp FROM items WHERE id = im.item_id)),
        cost = COALESCE(im.cost, COALESCE((SELECT cost_of_purchase FROM items WHERE id = im.item_id), (SELECT srp FROM items WHERE id = im.item_id), 0))
      WHERE im.id = inv_id;
        END IF;
        CONTINUE;
      END IF;

      IF trans_qty = 1 THEN
        -- Route transferred units to transferred_history instead of active inventory
        INSERT INTO transferred_history (
          branch_id, item_id, date_received, supplier_id, dr_no, si_no,
          cost, beginning_qty, purchased_qty, transferred_qty, sold_qty, ending_qty,
          remarks, created_at, srp, margin, color, status,
          chassis_no, engine_no, unit_number, unit_created_at, unit_status
        ) VALUES (
          br_id,
          item_id,
          CASE WHEN r.date_received IS NOT NULL THEN to_date(r.date_received, 'MM/DD/YYYY') ELSE CURRENT_DATE END,
          sup_id,
          r.dr_no,
          r.si_no,
  COALESCE((SELECT cost_of_purchase FROM items WHERE id = item_id), (SELECT srp FROM items WHERE id = item_id), 0),
          COALESCE(r.beg_inv,1),
          COALESCE(r.purchased,1),
          trans_qty,
          sold_qty,
          COALESCE(r.ending_inv, r.beg_inv),
          r.remarks,
          NOW(),
          (SELECT srp FROM items WHERE id = item_id),
          CASE WHEN (SELECT srp FROM items WHERE id = item_id) IS NOT NULL AND COALESCE((SELECT cost_of_purchase FROM items WHERE id = item_id),0) > 0
               THEN (((SELECT srp FROM items WHERE id = item_id) - COALESCE((SELECT cost_of_purchase FROM items WHERE id = item_id),0)) / COALESCE((SELECT cost_of_purchase FROM items WHERE id = item_id),1)) * 100
               ELSE 0 END,
          NULLIF(r.color, ''),
          'transferred',
          r.chassis_no,
          r.engine_no,
          1,
          NOW(),
          'transferred'
        );
      ELSE
        -- insert inventory_movements for this single unit
        INSERT INTO inventory_movements (branch_id, item_id, date_received, supplier_id, dr_no, si_no, cost, beginning_qty, purchased_qty, transferred_qty, sold_qty, ending_qty, color, srp, remarks, created_at)
        VALUES (
          br_id,
          item_id,
          CASE WHEN r.date_received IS NOT NULL THEN to_date(r.date_received, 'MM/DD/YYYY') ELSE CURRENT_DATE END,
          sup_id,
          r.dr_no,
          r.si_no,
  COALESCE((SELECT cost_of_purchase FROM items WHERE id = item_id), (SELECT srp FROM items WHERE id = item_id), 0),
          COALESCE(r.beg_inv,1),
          COALESCE(r.purchased,1),
          trans_qty,
          sold_qty,
          COALESCE(r.ending_inv, r.beg_inv),
          NULLIF(r.color, ''),
          (SELECT srp FROM items WHERE id = item_id),
          r.remarks,
          NOW()
        ) RETURNING id INTO inv_id;

        -- insert vehicle unit tied to the inventory movement
        INSERT INTO vehicle_units (inventory_id, chassis_no, engine_no, unit_number, created_at)
        VALUES (inv_id, r.chassis_no, r.engine_no, 1, NOW());
      END IF;

    END;
  END LOOP;
END;
$$;

-- Return a summary of inserted/updated vehicle units for verification
SELECT v.id, v.engine_no, v.chassis_no, b.name AS branch, i.item_no, im.date_received, im.ending_qty, im.remarks
FROM vehicle_units v
JOIN inventory_movements im ON im.id = v.inventory_id
JOIN branches b ON b.id = im.branch_id
JOIN items i ON i.id = im.item_id
WHERE im.created_at > now() - interval '1 hour'
ORDER BY v.id;
