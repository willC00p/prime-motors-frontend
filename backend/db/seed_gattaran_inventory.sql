-- Seeder for Prime Motors Gattaran
-- Rules:
-- - If remarks contains 'tuguegarao' (case-insensitive) mark transferred = true
-- - If duplicate engine/chassis exists, still insert the new row but force transferred = false (these units are present at Gattaran)

DO $$
DECLARE
  r record;
  parsed_date date;
  clean_engine text;
  clean_chassis text;
  norm_item_no text;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      -- item_no, date_received, supplier, tin, dr_no, si_no, brand, model, color, engine_no, chassis_no, pnpc_status, beg_inv, purchased, transfer, sales, ending_inv, note_date, remarks
      ('TM125','09/08/2025','TRENDWELL MOTORS OPC','TRANSFER TO GATTARAN','11456',NULL,'MONARCH','MONARCH 125','BLUE','156FMI2S5106366','LX8PCJ508SE003866','AVAILABLE',1,NULL,NULL,NULL,1,NULL,'Tuguegarao'),
      ('TM125','09/08/2025','TRENDWELL MOTORS OPC','TRANSFER TO GATTARAN','11456',NULL,'MONARCH','MONARCH 125','BLUE','156FMI2S5106365','LX8PCJ508SE003865','AVAILABLE',1,NULL,'delivered',NULL,0,NULL,'Tuguegarao'),
      ('TM150T','09/23/2025','TMOPC-BATAAN','TRANSFER TO GATTARAN','11591',NULL,'MONARCH','P1 BOLT 150','BLACK/SILVER','1P57MJS1226921','LX8TDK8GXSB001354','AVAILABLE',1,NULL,NULL,NULL,1,NULL,'Tuguegarao'),
      ('TM150T','09/23/2025','TMOPC-BATAAN','TRANSFER TO GATTARAN','11591',NULL,'MONARCH','P1 BOLT 150','BLACK/SILVER','1P57MJS1226937','LX8TDK8G9SB001359','AVAILABLE',1,NULL,NULL,NULL,1,'10-18-2025','Tuguegarao'),
      ('TM150T','09/26/2025','TMOPC-BATAAN','TRANSFER TO GATTARAN','11649',NULL,'MONARCH','P1 BOLT 150','BROWN/SILVER','1P57MJS1227303','LX8TDK8GXSB001600','AVAILABLE',1,NULL,NULL,NULL,1,NULL,'Tuguegarao'),
      ('TM150T','09/26/2025','TMOPC-BATAAN','TRANSFER TO GATTARAN','11649',NULL,'MONARCH','P1 BOLT 150','BROWN/SILVER','1P57MJS1227297','LX8TDK8G2SB001588','AVAILABLE',1,NULL,NULL,NULL,1,NULL,'Tuguegarao'),
      ('TM150T','09/26/2025','TMOPC-BATAAN','TRANSFER TO GATTARAN','11649',NULL,'MONARCH','P1 BOLT 150','BROWN/SILVER','1P57MJS1227315','LX8TDK8G6SB001562','AVAILABLE',0,NULL,'DELIVERED',NULL,1,NULL,'Tuguegarao'),
      ('TM150T','10/29/2025','TMOPC-BATAAN',NULL,'12988',NULL,'MONARCH','MONARCH 150','RED','161FMJS5131263','LX8PCK505SE018623','AVAILABLE',NULL,NULL,NULL,NULL,1,NULL,''),
      ('TM150T','10/29/2025','TMOPC-BATAAN',NULL,'12988',NULL,'MONARCH','MONARCH 150','RED','161FMJS5131272','LX8PCK506SE018632','AVAILABLE',NULL,NULL,NULL,NULL,1,NULL,''),
      ('TM150T','10/29/2025','TMOPC-BATAAN',NULL,'12988',NULL,'MONARCH','MONARCH 150','RED','161FMJS5131275','LX8PCK501SE018635','AVAILABLE',NULL,NULL,NULL,NULL,1,NULL,''),
      ('TM150T','10/29/2025','TMOPC-BATAAN',NULL,'12988',NULL,'MONARCH','MONARCH 150','RED','161FMJS5131279','LX8PCK509SE018639','AVAILABLE',NULL,NULL,NULL,NULL,1,NULL,''),
      ('TM150T','10/29/2025','TMOPC-BATAAN',NULL,'12988',NULL,'MONARCH','MONARCH 150','RED','161FMJS5131291','LX8PCK50XSE018651','AVAILABLE',NULL,NULL,NULL,NULL,1,NULL,''),
      ('TM150T','10/29/2025','TMOPC-BATAAN',NULL,'12988',NULL,'MONARCH','MONARCH 150','RED','161FMJS5131306','LX8PCK501SE018666','AVAILABLE',NULL,NULL,NULL,NULL,1,NULL,''),
      ('TM150T','10/29/2025','TMOPC-BATAAN',NULL,'12988',NULL,'MONARCH','MONARCH 150','BLUE','161FMJS5131363','LX8PCK509SE018723','AVAILABLE',NULL,NULL,NULL,NULL,1,NULL,''),
      ('TM150T','10/29/2025','TMOPC-BATAAN',NULL,'12988',NULL,'MONARCH','MONARCH 150','BLUE','161FMJS5131375','LX8PCK505SE018735','AVAILABLE',NULL,NULL,NULL,NULL,1,NULL,''),
      ('TM150T','10/29/2025','TMOPC-BATAAN',NULL,'12988',NULL,'MONARCH','MONARCH 150','BLUE','161FMJS5131382','LX8PCK502SE018742','AVAILABLE',NULL,NULL,NULL,NULL,1,NULL,''),
      ('TM150T','10/29/2025','TMOPC-BATAAN',NULL,'12988',NULL,'MONARCH','MONARCH 150','RED','161FMJS5131254','LX8PCK504SE018614','AVAILABLE',NULL,NULL,NULL,NULL,1,NULL,''),
      ('TM150T','10/29/2025','TMOPC-BATAAN',NULL,'12987',NULL,'MONARCH','MONARCH 150','BLUE','161FMJS5131360','LX8PCK503SE018720','AVAILABLE',NULL,NULL,NULL,NULL,1,NULL,''),
      ('TM150T','10/29/2025','TMOPC-BATAAN',NULL,'12987',NULL,'MONARCH','MONARCH 150','BLUE','161FMJS5131361','LX8PCK505SE018721','AVAILABLE',NULL,NULL,NULL,NULL,1,NULL,''),
      ('TM150T','10/29/2025','TMOPC-BATAAN',NULL,'12987',NULL,'MONARCH','MONARCH 150','BLUE','161FMJS5131362','LX8PCK507SE018722','AVAILABLE',NULL,NULL,NULL,NULL,1,NULL,''),
      ('TM150T','10/29/2025','TMOPC-BATAAN',NULL,'12987',NULL,'MONARCH','MONARCH 150','BLUE','161FMJS5131372','LX8PCK50XSE018732','AVAILABLE',NULL,NULL,NULL,NULL,1,NULL,''),
      ('TM150T','10/29/2025','TMOPC-BATAAN',NULL,'12987',NULL,'MONARCH','MONARCH 150','BLUE','161FMJS5131373','LX8PCK501SE018733','AVAILABLE',NULL,NULL,NULL,NULL,1,NULL,''),
      ('TM150T','10/29/2025','TMOPC-BATAAN',NULL,'12987',NULL,'MONARCH','MONARCH 150','BLUE','161FMJS5131383','LX8PCK504SE018743','AVAILABLE',NULL,NULL,NULL,NULL,1,NULL,''),
      ('TM150T','10/29/2025','TMOPC-BATAAN',NULL,'12987',NULL,'MONARCH','MONARCH 150','BLUE','161FMJS5131385','LX8PCK508SE018745','AVAILABLE',NULL,NULL,NULL,NULL,1,NULL,''),
      ('TM150T','10/29/2025','TMOPC-BATAAN',NULL,'12987',NULL,'MONARCH','MONARCH 150','RED','161FMJS5131248','LX8PCK509SE018508','AVAILABLE',NULL,NULL,NULL,NULL,1,NULL,''),
      ('TM150T','10/29/2025','TMOPC-BATAAN',NULL,'12987',NULL,'MONARCH','MONARCH 150','RED','161FMJS5131252','LX8PCK500SE018612','AVAILABLE',NULL,NULL,NULL,NULL,1,NULL,''),
      ('TM150T','10/29/2025','TMOPC-BATAAN',NULL,'12987',NULL,'MONARCH','MONARCH 150','RED','161FMJS5131270','LX8PCK502SE018530','AVAILABLE',NULL,NULL,NULL,NULL,1,NULL,''),
      ('TM150T','10/29/2025','TMOPC-BATAAN',NULL,'12987',NULL,'MONARCH','MONARCH 150','RED','161FMJS5131281','LX8PCK507SE018641','AVAILABLE',NULL,NULL,NULL,NULL,1,NULL,''),
      ('TM150T','10/29/2025','TMOPC-BATAAN',NULL,'12987',NULL,'MONARCH','MONARCH 150','RED','161FMJS5131289','LX8PCK501SE018649','AVAILABLE',NULL,NULL,NULL,NULL,1,NULL,''),
      ('TM150T','10/29/2025','TMOPC-BATAAN',NULL,'12987',NULL,'MONARCH','MONARCH 150','RED','161FMJS5131290','LX8PCK508SE018650','AVAILABLE',NULL,NULL,NULL,NULL,1,NULL,''),
      ('TM150T','10/29/2025','TMOPC-BATAAN',NULL,'12987',NULL,'MONARCH','MONARCH 150','RED','161FMJS5131305','LX8PCK50XSE018665','AVAILABLE',NULL,NULL,NULL,NULL,1,NULL,''),
      ('TM150T','10/29/2025','TMOPC-BATAAN',NULL,'12987',NULL,'MONARCH','MONARCH 150','RED','161FMJS5131307','LX8PCK503SE018667','AVAILABLE',NULL,NULL,NULL,NULL,1,NULL,''),
      ('TM175','10/29/2025','TUGUEGARAO BRANCH',NULL,'12963',NULL,'MONARCH','MONARCH 175','BLACKGREEN','162FMKS5106919','LX8PCL504SE008140','AVAILABLE',NULL,NULL,NULL,NULL,1,NULL,''),
      ('TM175','10/29/2025','TUGUEGARAO BRANCH',NULL,'12963',NULL,'MONARCH','MONARCH 175','BLACKGREEN','162FMKS5106922','LX8PCL50XSE008143','AVAILABLE',NULL,NULL,NULL,NULL,1,NULL,''),
      ('TM175','10/29/2025','TUGUEGARAO BRANCH',NULL,'12963',NULL,'MONARCH','MONARCH 175','BLACKGREEN','162FMKS5106928','LX8PCL500SE008149','AVAILABLE',NULL,NULL,NULL,NULL,1,NULL,''),
      ('TM175','10/29/2025','TUGUEGARAO BRANCH',NULL,'12963',NULL,'MONARCH','MONARCH 175','BLUE','162FMKS5106971','LX8PCL501SE008192','AVAILABLE',NULL,NULL,NULL,NULL,1,NULL,''),
      ('TM175','10/29/2025','TUGUEGARAO BRANCH',NULL,'12963',NULL,'MONARCH','MONARCH 175','BLACKGREEN','162FMKS5106933','LX8PCL504SE008154','AVAILABLE',NULL,NULL,NULL,NULL,1,NULL,'')
    ) AS t(item_no, date_received, supplier, tin, dr_no, si_no, brand, model, color, engine_no, chassis_no, pnpc_status, beg_inv, purchased, transfer, sales, ending_inv, note_date, remarks)
  LOOP
    DECLARE
      br_id INT;
      sup_id INT;
      item_id INT;
      inv_id INT;
      sold_qty INT := 0;
      trans_flag BOOLEAN := false;
      exists_dup BOOLEAN := false;
      final_transferred BOOLEAN := false;
    BEGIN
      -- normalize date
      IF r.date_received IS NULL OR trim(r.date_received) = '' THEN
        parsed_date := CURRENT_DATE;
      ELSE
        BEGIN
          parsed_date := to_date(r.date_received, 'MM/DD/YYYY');
        EXCEPTION WHEN others THEN
          parsed_date := COALESCE(r.date_received::date, CURRENT_DATE);
        END;
      END IF;

      clean_engine := NULLIF(regexp_replace(coalesce(r.engine_no, ''), '\\s+', '', 'g'), '');
      clean_chassis := NULLIF(regexp_replace(coalesce(r.chassis_no, ''), '\\s+', '', 'g'), '');
      norm_item_no := regexp_replace(coalesce(r.item_no, ''), '\\s+', '', 'g');

      -- determine transfer flag from remarks containing 'tuguegarao'
      IF r.remarks IS NOT NULL AND lower(trim(r.remarks)) LIKE '%tuguegarao%' THEN
        trans_flag := true;
      ELSE
        trans_flag := false;
      END IF;

      -- resolve Gattaran branch
      SELECT id INTO br_id FROM branches WHERE name ILIKE '%gattaran%' LIMIT 1;
      IF br_id IS NULL THEN
        INSERT INTO branches (name, address, created_at) VALUES ('Prime Motors Gattaran', 'Gattaran, Cagayan', NOW()) RETURNING id INTO br_id;
      END IF;

      -- resolve supplier
      IF r.supplier IS NOT NULL AND trim(r.supplier) <> '' THEN
        SELECT id INTO sup_id FROM suppliers WHERE name ILIKE '%' || split_part(r.supplier, ' ', 1) || '%' LIMIT 1;
        IF sup_id IS NULL THEN
          INSERT INTO suppliers (name, tin_number, created_at) VALUES (r.supplier, r.tin, NOW()) RETURNING id INTO sup_id;
        END IF;
      END IF;

      -- resolve or create item
      SELECT id INTO item_id FROM items WHERE regexp_replace(coalesce(model,''), '\\s+', '', 'g') ILIKE norm_item_no AND brand ILIKE '%' || r.brand || '%' LIMIT 1;
      IF item_id IS NULL THEN
        SELECT id INTO item_id FROM items WHERE model ILIKE r.model AND brand ILIKE '%' || r.brand || '%' LIMIT 1;
      END IF;
      IF item_id IS NULL THEN
        SELECT id INTO item_id FROM items WHERE item_no ILIKE '%' || r.item_no || '%' LIMIT 1;
      END IF;
      IF item_id IS NULL THEN
        INSERT INTO items (item_no, brand, model, color, created_at) VALUES (coalesce(r.item_no,''), coalesce(r.brand,''), coalesce(r.model,''), ARRAY[coalesce(r.color,'')], NOW()) RETURNING id INTO item_id;
      END IF;

      -- sold flag
      IF r.ending_inv IS NOT NULL AND CAST(r.ending_inv AS TEXT) ~ '^[0-9]+$' AND CAST(r.ending_inv AS INT) = 0 THEN
        sold_qty := 1;
      ELSE
        sold_qty := 0;
      END IF;

      -- detect duplicates in vehicle_units AND transferred_history
      BEGIN
        SELECT EXISTS(
          SELECT 1 FROM vehicle_units v
          WHERE (clean_engine IS NOT NULL AND v.engine_no = clean_engine)
             OR (clean_chassis IS NOT NULL AND v.chassis_no = clean_chassis)
        ) INTO exists_dup;
        
        IF NOT exists_dup THEN
          SELECT EXISTS(
            SELECT 1 FROM transferred_history th
            WHERE (clean_engine IS NOT NULL AND th.engine_no = clean_engine)
               OR (clean_chassis IS NOT NULL AND th.chassis_no = clean_chassis)
          ) INTO exists_dup;
        END IF;
      EXCEPTION WHEN others THEN
        exists_dup := false;
      END;

      -- Route based on trans_flag: if true -> transferred_history, else -> active inventory
      IF trans_flag THEN
        -- This unit was transferred TO Gattaran, goes to transferred_history
        INSERT INTO transferred_history (
          branch_id, item_id, date_received, supplier_id, dr_no, si_no, cost,
          beginning_qty, purchased_qty, transferred_qty, sold_qty, ending_qty,
          color, srp, remarks, unit_created_at, chassis_no, engine_no, unit_number, unit_status
        )
        VALUES (
          br_id,
          item_id,
          parsed_date,
          sup_id,
          r.dr_no,
          r.si_no,
          COALESCE((SELECT cost_of_purchase FROM items WHERE id = item_id), (SELECT srp FROM items WHERE id = item_id), 0),
          CASE WHEN r.beg_inv IS NOT NULL AND CAST(r.beg_inv AS TEXT) ~ '^[0-9]+$' THEN CAST(r.beg_inv AS INT) ELSE 1 END,
          CASE WHEN r.purchased IS NOT NULL AND CAST(r.purchased AS TEXT) ~ '^[0-9]+$' THEN CAST(r.purchased AS INT) ELSE 1 END,
          1,
          sold_qty,
          CASE WHEN r.ending_inv IS NOT NULL AND CAST(r.ending_inv AS TEXT) ~ '^[0-9]+$' THEN CAST(r.ending_inv AS INT) ELSE 1 END,
          NULLIF(r.color, ''),
          (SELECT srp FROM items WHERE id = item_id),
          r.remarks,
          NOW(),
          clean_chassis,
          clean_engine,
          1,
          'available'
        );
        RAISE NOTICE 'Inserted Gattaran vehicle to transferred_history: chassis=% engine=% (dup=%)', clean_chassis, clean_engine, exists_dup;
      ELSE
        -- Regular inventory movement + vehicle unit for active inventory
        INSERT INTO inventory_movements (branch_id, item_id, date_received, supplier_id, dr_no, si_no, cost, beginning_qty, purchased_qty, transferred_qty, sold_qty, ending_qty, color, srp, remarks, created_at)
        VALUES (
          br_id,
          item_id,
          parsed_date,
          sup_id,
          r.dr_no,
          r.si_no,
          COALESCE((SELECT cost_of_purchase FROM items WHERE id = item_id), (SELECT srp FROM items WHERE id = item_id), 0),
          CASE WHEN r.beg_inv IS NOT NULL AND CAST(r.beg_inv AS TEXT) ~ '^[0-9]+$' THEN CAST(r.beg_inv AS INT) ELSE 1 END,
          CASE WHEN r.purchased IS NOT NULL AND CAST(r.purchased AS TEXT) ~ '^[0-9]+$' THEN CAST(r.purchased AS INT) ELSE 1 END,
          0,
          sold_qty,
          CASE WHEN r.ending_inv IS NOT NULL AND CAST(r.ending_inv AS TEXT) ~ '^[0-9]+$' THEN CAST(r.ending_inv AS INT) ELSE 1 END,
          NULLIF(r.color, ''),
          (SELECT srp FROM items WHERE id = item_id),
          r.remarks,
          NOW()
        ) RETURNING id INTO inv_id;

        INSERT INTO vehicle_units (inventory_id, chassis_no, engine_no, unit_number, created_at)
        VALUES (
          inv_id,
          clean_chassis,
          clean_engine,
          1,
          NOW()
        );

        RAISE NOTICE 'Inserted Gattaran vehicle to active inventory: chassis=% engine=% (dup=%)', clean_chassis, clean_engine, exists_dup;
      END IF;

    END;
  END LOOP;
END;
$$;

-- verification: show recent Gattaran inserts
SELECT b.name as branch, COUNT(im.*) as movements, SUM(COALESCE(im.ending_qty,0)) as total_units,
       SUM(COALESCE((SELECT COUNT(*) FROM vehicle_units v2 WHERE v2.inventory_id = im.id AND v2.transferred = true),0)) as transferred_units
FROM inventory_movements im
JOIN branches b ON b.id = im.branch_id
WHERE b.name ILIKE '%gattaran%'
  AND im.created_at > now() - interval '24 hour'
GROUP BY b.name;

SELECT v.id, v.engine_no, v.chassis_no, v.transferred, im.remarks, im.date_received
FROM vehicle_units v
JOIN inventory_movements im ON im.id = v.inventory_id
JOIN branches b ON b.id = im.branch_id
WHERE b.name ILIKE '%gattaran%'
  AND im.created_at > now() - interval '24 hour'
ORDER BY v.id;
