-- Seeder for Antipolo inventory
-- Rules:
-- - Normalize item_no (remove spaces)
-- - Ignore Sales column
-- - Insert inventory_movements and vehicle_units for each row; set inserted vehicle_units.transferred = false for all Antipolo rows

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      -- branch, item_no, date_received, supplier, tin, dr_no, si_no, brand, model, color, engine_no, chassis_no, pnpc_status, beg_inv, purchased, transfer, sales, ending_inv, note_date, remarks
      ('ANTIPOLO','SG150T KL','7/7/2025','SKYGO MARKETING CORP','225-520-539-00000','10897','3009','SKYGO','KPV 150 KEYLESS','GRAY','1P57MJP1133435','LX8TDK80XPA001063','Available',1,NULL,NULL,1,0,'10/30/2025','DELIVERED'),
      ('ANTIPOLO','SGT150T KL','7/4/2025','SKYGO MARKETING CORP','225-520-539-00000','10866','2978','SKYGO','KPV 150 KEYLESS','BLUE','1P57MJP1094523','LX8TDK808PA000834','Available',1,NULL,NULL,NULL,1,NULL,NULL),
      ('ANTIPOLO','WM125','7/4/2025','SKYGO MARKETING CORP','225-520-539-00000','10866','2978','SKYGO','OMNI 125','DARK BLUE','1P52QMIRTC01245','LWMTJV1C3RT001245','Available',1,NULL,NULL,NULL,1,NULL,NULL),
      ('ANTIPOLO','RM15ST','7/19/2025','SKYGO MARKETING CORP','225-520-539-00000','10883','2995','SKYGO','M1 ARROW 150','GRAY','JN1P57QMJ24045995','LRPRTJ500RA000298','Available',1,NULL,NULL,1,0,'10/30/2025','DELIVERED'),
      ('ANTIPOLO','RM175CB','12/8/2025','SKYGO MARKETING CORP','225-520-539-00000','11359','3171','SKYGO','SPEAR 180','BLACK','RW162FMK24000310','LRPRPK800RA000342','Available',1,NULL,NULL,1,0,'10/31/2025',NULL),
      ('ANTIPOLO','RM175CB','12/8/2025','SKYGO MARKETING CORP','225-520-539-00000','11359','3171','SKYGO','SPEAR 180','BLUE','RW162FMK24000340','LRPRPK80XRA000378','Available',1,NULL,NULL,NULL,1,NULL,NULL),
      ('ANTIPOLO','TM150T','10/3/2025','SKYGO MARKETING CORP','225-520-539-00000','11713',NULL,'MONARCH','P1 BOLT 150','BROWN/SILVER','1P57MJS1227287','LX8TDK8GXSB001547','Available',1,NULL,NULL,NULL,1,NULL,NULL),
      ('ANTIPOLO','TM150T','10/3/2025','SKYGO MARKETING CORP','225-520-539-00000','11713',NULL,'MONARCH','P1 BOLT 150','BROWN/SILVER','1P57MJS1227285','LX8TDK8G6SB001545','Available',1,NULL,NULL,NULL,1,NULL,NULL),
      ('ANTIPOLO','TM150T','10/3/2025','SKYGO MARKETING CORP','225-520-539-00000','11713',NULL,'MONARCH','P1 BOLT 150','BROWN/SILVER','1P57MJS1227280','LX8TDK8G4SB001544','Available',1,NULL,NULL,NULL,1,NULL,NULL),
      ('ANTIPOLO','TM150T','10/3/2025','SKYGO MARKETING CORP','225-520-539-00000','11713',NULL,'MONARCH','P1 BOLT 150','BROWN/SILVER','1P57MJS1227249','LX8TDK8G3SB001549','Available',1,NULL,NULL,NULL,1,NULL,NULL),
      ('ANTIPOLO','TM150T','10/3/2025','SKYGO MARKETING CORP','225-520-539-00000','11713',NULL,'MONARCH','P1 BOLT 150','BROWN/SILVER','1P57MJS1227278','LX8TDK8G0SB001525','Available',1,NULL,NULL,NULL,1,NULL,NULL),
      ('ANTIPOLO','TM150T','10/3/2025','SKYGO MARKETING CORP','225-520-539-00000','11713',NULL,'MONARCH','P1 BOLT 150','BROWN/SILVER','1P57MJS1227254','LX8TDK8G5SB001536','Available',1,NULL,NULL,NULL,1,NULL,NULL),
      ('ANTIPOLO','TM150T','10/3/2025','SKYGO MARKETING CORP','225-520-539-00000','11713',NULL,'MONARCH','P1 BOLT 150','BROWN/SILVER','1P57MJS1227273','LX8TDK8G7SB001523','Available',1,NULL,NULL,NULL,1,NULL,NULL),
      ('ANTIPOLO','TM150T','10/3/2025','SKYGO MARKETING CORP','225-520-539-00000','11713',NULL,'MONARCH','P1 BOLT 150','BROWN/SILVER','1P57MJS1227290','LX8TDK8G8SB001523','Available',1,NULL,NULL,NULL,1,NULL,NULL),
      ('ANTIPOLO','TM150T','3/10/2025','SKYGO MARKETING CORP','225-520-539-00000','11713',NULL,'MONARCH','P1 BOLT 150','BLACK/SILVER','1P57MJSI230049','LX8TDK8G1SB001677','Available',NULL,NULL,NULL,1,0,'10/11/2025','DELIVERED'),
      ('ANTIPOLO','TM150T','3/22/2025','SKYGO MARKETING CORP','225-520-539-00000','11713',NULL,'MONARCH','P1 BOLT 150','BLACK/SILVER','1P57MJS1230050','LX8TDK8G3SB001678','Available',NULL,NULL,NULL,1,0,'10/22/2025','DELIVERED')
    ) AS t(branch, item_no, date_received, supplier, tin, dr_no, si_no, brand, model, color, engine_no, chassis_no, pnpc_status, beg_inv, purchased, transfer, sales, ending_inv, note_date, remarks)
  LOOP
    DECLARE
      br_id INT;
      sup_id INT;
      item_id INT;
      inv_id INT;
      sold_qty INT := 0;
      normalized_item_no TEXT;
    BEGIN
      -- normalize item_no (remove spaces)
      normalized_item_no := regexp_replace(coalesce(r.item_no, ''), '\s+', '', 'g');

      -- resolve branch (Antipolo)
      SELECT id INTO br_id FROM branches WHERE name ILIKE '%' || r.branch || '%' LIMIT 1;
      IF br_id IS NULL THEN
        INSERT INTO branches (name) VALUES (r.branch) RETURNING id INTO br_id;
      END IF;

      -- resolve supplier
      IF r.supplier IS NOT NULL AND trim(r.supplier) <> '' THEN
        SELECT id INTO sup_id FROM suppliers WHERE name ILIKE '%' || split_part(r.supplier, ' ', 1) || '%' LIMIT 1;
        IF sup_id IS NULL THEN
          INSERT INTO suppliers (name, tin_number, created_at) VALUES (r.supplier, r.tin, NOW()) RETURNING id INTO sup_id;
        END IF;
      END IF;

      -- resolve item by normalized item_no or model+brand
      SELECT id INTO item_id FROM items WHERE item_no ILIKE normalized_item_no LIMIT 1;
      IF item_id IS NULL THEN
        SELECT id INTO item_id FROM items WHERE model ILIKE r.model AND brand ILIKE '%' || r.brand || '%' LIMIT 1;
      END IF;
      IF item_id IS NULL THEN
        INSERT INTO items (item_no, brand, model, color, created_at) VALUES (normalized_item_no, r.brand, r.model, ARRAY[r.color], NOW()) RETURNING id INTO item_id;
      END IF;

      -- sold flag from ending_inv
      IF r.ending_inv IS NOT NULL AND CAST(r.ending_inv AS TEXT) ~ '^[0-9]+$' AND CAST(r.ending_inv AS INT) = 0 THEN
        sold_qty := 1;
      ELSE
        sold_qty := 0;
      END IF;

      -- Insert inventory movement under Antipolo
      INSERT INTO inventory_movements (branch_id, item_id, date_received, supplier_id, dr_no, si_no, cost, beginning_qty, purchased_qty, transferred_qty, sold_qty, ending_qty, color, srp, remarks, created_at)
      VALUES (
        br_id,
        item_id,
        CASE WHEN r.date_received IS NOT NULL THEN to_date(r.date_received, 'MM/DD/YYYY') ELSE CURRENT_DATE END,
        sup_id,
        r.dr_no,
        r.si_no,
  COALESCE((SELECT cost_of_purchase FROM items WHERE id = item_id), 0),
        CASE WHEN r.beg_inv IS NOT NULL AND CAST(r.beg_inv AS TEXT) ~ '^[0-9]+$' THEN CAST(r.beg_inv AS INT) ELSE 1 END,
        CASE WHEN r.purchased IS NOT NULL AND CAST(r.purchased AS TEXT) ~ '^[0-9]+$' THEN CAST(r.purchased AS INT) ELSE 1 END,
        0, -- transferred_qty set to 0 for Antipolo per your instruction
        sold_qty,
        CASE WHEN r.ending_inv IS NOT NULL AND CAST(r.ending_inv AS TEXT) ~ '^[0-9]+$' THEN CAST(r.ending_inv AS INT) WHEN r.beg_inv IS NOT NULL AND CAST(r.beg_inv AS TEXT) ~ '^[0-9]+$' THEN CAST(r.beg_inv AS INT) ELSE 1 END,
        NULLIF(r.color, ''),
        (SELECT srp FROM items WHERE id = item_id),
        r.remarks,
        NOW()
      ) RETURNING id INTO inv_id;

      -- insert vehicle unit; for Antipolo set transferred = false explicitly
      INSERT INTO vehicle_units (inventory_id, chassis_no, engine_no, unit_number, transferred, created_at)
      VALUES (
        inv_id,
        r.chassis_no,
        r.engine_no,
        1,
        false,
        NOW()
      );

    END;
  END LOOP;
END;
$$;

-- Quick verification output for recent Antipolo inserts
SELECT v.id, v.engine_no, v.chassis_no, v.transferred, im.branch_id, im.item_id, im.date_received, im.remarks
FROM vehicle_units v
JOIN inventory_movements im ON im.id = v.inventory_id
WHERE im.branch_id IN (SELECT id FROM branches WHERE name ILIKE '%antipolo%')
  AND (im.created_at > now() - interval '24 hour' OR lower(coalesce(im.remarks, '')) LIKE '%antipolo%')
ORDER BY v.id;
