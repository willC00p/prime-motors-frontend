-- Seeder for Prime Motors Ilagan
-- Inserts provided Ilagan rows. If remarks contains 'transfer' (case-insensitive) the inserted vehicle_unit.transferred = true.

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
      ('SG150-B','10/11/2025','TUMAUINI','669-059-669-00000','11640',NULL,'MONARCH','P1 BOLT 150','BROWN SILVER','1P57MJS1227329','LX8TDK8G0SB001573','Available at other Branch',1,NULL,NULL,NULL,0,'10/23/2025','RELEASED'),
      ('SG150-B','10/11/2025','TUMAUINI','669-059-669-00000','11640',NULL,'MONARCH','P1 BOLT 150','BROWN SILVER','1P57MJS1227300','LX8TDK8G1SB001551','Available at other Branch',1,NULL,NULL,NULL,1,NULL,'EXISTING UNIT'),
      ('WM125','10/11/2025','TUMAUINI',NULL,'11370',NULL,'MONARCH','OMNI 125','NIGHT GRAY','1P52QMIRTC01458','LWMTJV1C5RT001458','Available at other Branch',1,NULL,'TUMAUINI',NULL,1,'10/20/2025','TRANSFERED'),
      ('TM125','10/11/2025','TUMAUINI','669-059-669-00000','11559',NULL,'MONARCH','MONARCH 125','BLUE','156FMI2S5106374','LX8PCJ507SE003874','Available at other Branch',1,NULL,NULL,NULL,0,'10/20/2025','RELEASED'),
      ('TM175','10/11/2025','TUMAUINI','669-059-669-00000','11559',NULL,'MONARCH','MONARCH 175','RED','162FMKS5106702','LX8PCL509SE007923','Available at other Branch',1,NULL,NULL,NULL,1,NULL,'EXISTING UNIT'),
      ('TM175','10/11/2025','TUMAUINI',NULL,'11347',NULL,'MONARCH','MONARCH 175','RED','162FMKN5158804','LX8PCL506NE012985','Available at other Branch',1,NULL,'? ',NULL,1,NULL,'EXISTING UNIT'),
      ('TM175','10/11/2025','TUMAUINI','669-059-669-00000','11559',NULL,'MONARCH','MONARCH 175','RED','162FMKS5106714','LX8PCL505SE007935','Available at other Branch',1,NULL,'? ',NULL,1,NULL,'EXISTING UNIT'),
      ('SG150-L','10/25/2025','CAUAYAN CITY',NULL,NULL,NULL,'SKYGO','M1 LANCE 150','BLACK/GOLD','1P57MJS1067228','LX8TDK8U8SB000192','Available at other Branch',1,NULL,NULL,NULL,0,'10/27/2025','RELEASED'),
      ('TM150','11/03/2025','TRENDWELL MOTORS OPC',NULL,'11523',NULL,'MONARCH','MONARCH 150','BLACK/GREEN','161FMJS5105986','LX8PCK504SE011856','Available',1,NULL,NULL,NULL,1,NULL,'EXISTING UNIT'),
      ('TM150','11/03/2025','TRENDWELL MOTORS OPC',NULL,'11523',NULL,'MONARCH','MONARCH 150','BLACK/GREEN','161FMJS5105989','LX8PCK50XSE011859','Available',1,NULL,NULL,NULL,1,NULL,'EXISTING UNIT'),
      ('TM150','11/03/2025','TRENDWELL MOTORS OPC',NULL,'11523',NULL,'MONARCH','MONARCH 150','BLACK/GREEN','161FMJS5105988','LX8PCK508SE011858','Available',1,NULL,NULL,NULL,1,NULL,'EXISTING UNIT'),
      ('TM150','11/03/2025','TRENDWELL MOTORS OPC',NULL,'11523',NULL,'MONARCH','MONARCH 150','BLACK/GREEN','161FMJS5105987','LX8PCK506SE011857','Available',1,NULL,NULL,NULL,1,NULL,'EXISTING UNIT'),
      ('TM150','11/03/2025','TRENDWELL MOTORS OPC',NULL,'11457',NULL,'MONARCH','MONARCH 150','BLACK/GREEN','161FMJS5105852','LX8PCK505SE011722','Available',1,NULL,NULL,NULL,1,NULL,'EXISTING UNIT'),
      ('TM150','11/03/2025','TRENDWELL MOTORS OPC',NULL,'11457',NULL,'MONARCH','MONARCH 150','BLACK/GREEN','161FMJS5105828','LX8PCK501SE011698','Available',1,NULL,NULL,NULL,1,NULL,'EXISTING UNIT'),
      ('TM150','11/03/2025','TRENDWELL MOTORS OPC',NULL,'11457',NULL,'MONARCH','MONARCH 150','BLACK/GREEN','161FMJS5105829','LX8PCK503SE011699','Available',1,NULL,NULL,NULL,1,NULL,'EXISTING UNIT'),
      ('TM150','11/03/2025','TRENDWELL MOTORS OPC',NULL,'11457',NULL,'MONARCH','MONARCH 150','BLACK/GREEN','161FMJS5105832','LX8PCK50XSE011702','Available',1,NULL,NULL,NULL,1,NULL,'EXISTING UNIT'),
      ('TM150','11/03/2025','TRENDWELL MOTORS OPC',NULL,'11457',NULL,'MONARCH','MONARCH 150','BLACK/GREEN','161FMJS5105830','LX8PCK506SE011700','Available',1,NULL,NULL,NULL,1,NULL,'EXISTING UNIT'),
      ('TM150','11/03/2025','TRENDWELL MOTORS OPC',NULL,'11457',NULL,'MONARCH','MONARCH 150','BLACK/GREEN','161FMJS5105831','LX8PCK508SE011701','Available',1,NULL,NULL,NULL,1,NULL,'EXISTING UNIT')
    ) AS t(item_no, date_received, supplier, tin, dr_no, si_no, brand, model, color, engine_no, chassis_no, pnpc_status, beg_inv, purchased, transfer, sales, ending_inv, note_date, remarks)
  LOOP
    DECLARE
      br_id INT;
      sup_id INT;
      item_id INT;
      inv_id INT;
      sold_qty INT := 0;
      trans_qty INT := 0;
    BEGIN
      -- normalize date_received
      IF r.date_received IS NULL OR trim(r.date_received) = '' THEN
        parsed_date := CURRENT_DATE;
      ELSIF r.date_received ~ '^[0-9]{1,2}/[0-9]{1,2}/[0-9]{4}$' THEN
        parsed_date := to_date(r.date_received, 'MM/DD/YYYY');
      ELSE
        parsed_date := COALESCE(r.date_received::date, CURRENT_DATE);
      END IF;

      clean_engine := NULLIF(regexp_replace(coalesce(r.engine_no, ''), '\\s+', '', 'g'), '');
      clean_chassis := NULLIF(regexp_replace(coalesce(r.chassis_no, ''), '\\s+', '', 'g'), '');
      norm_item_no := regexp_replace(coalesce(r.item_no, ''), '\\s+', '', 'g');

      -- resolve branch (Ilagan)
      SELECT id INTO br_id FROM branches WHERE name ILIKE '%ilagan%' LIMIT 1;
      IF br_id IS NULL THEN
        INSERT INTO branches (name, address, created_at) VALUES ('Prime Motors Ilagan', 'Ilagan, Isabela', NOW()) RETURNING id INTO br_id;
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

      -- transfer detection from remarks (case-insensitive contains 'transfer')
      IF r.remarks IS NOT NULL AND lower(trim(r.remarks)) LIKE '%transfer%' THEN
        trans_qty := 1;
      ELSE
        trans_qty := 0;
      END IF;

      -- Check for duplicates in both vehicle_units AND transferred_history
      IF (clean_engine IS NOT NULL AND EXISTS(SELECT 1 FROM vehicle_units v WHERE v.engine_no = clean_engine))
         OR (clean_chassis IS NOT NULL AND EXISTS(SELECT 1 FROM vehicle_units v WHERE v.chassis_no = clean_chassis))
         OR (clean_engine IS NOT NULL AND EXISTS(SELECT 1 FROM transferred_history th WHERE th.engine_no = clean_engine))
         OR (clean_chassis IS NOT NULL AND EXISTS(SELECT 1 FROM transferred_history th WHERE th.chassis_no = clean_chassis)) THEN
        
        SELECT v.inventory_id INTO inv_id FROM vehicle_units v
        WHERE (clean_engine IS NOT NULL AND v.engine_no = clean_engine)
          OR (clean_chassis IS NOT NULL AND v.chassis_no = clean_chassis)
        LIMIT 1;

        IF inv_id IS NOT NULL THEN
          UPDATE inventory_movements im
          SET color = COALESCE(im.color, NULLIF(r.color, '')),
              srp = COALESCE(im.srp, (SELECT srp FROM items WHERE id = im.item_id)),
              cost = COALESCE(im.cost, COALESCE((SELECT cost_of_purchase FROM items WHERE id = im.item_id), (SELECT srp FROM items WHERE id = im.item_id), 0))
          WHERE im.id = inv_id;
        END IF;
        CONTINUE;
      END IF;

      -- Route based on trans_qty: if 1 -> transferred_history, else -> active inventory
      IF trans_qty = 1 THEN
        -- This unit was transferred, goes to transferred_history
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
        RAISE NOTICE 'Inserted Ilagan vehicle to transferred_history: chassis=% engine=%', clean_chassis, clean_engine;
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

        RAISE NOTICE 'Inserted Ilagan vehicle to active inventory: chassis=% engine=%', clean_chassis, clean_engine;
      END IF;

    END;
  END LOOP;
END;
$$;

-- verification: recent Ilagan inserts
SELECT b.name as branch, COUNT(im.*) as movements, SUM(COALESCE(im.ending_qty,0)) as total_units,
       SUM(COALESCE((SELECT COUNT(*) FROM vehicle_units v2 WHERE v2.inventory_id = im.id AND v2.transferred = true),0)) as transferred_units
FROM inventory_movements im
JOIN branches b ON b.id = im.branch_id
WHERE b.name ILIKE '%ilagan%'
  AND im.created_at > now() - interval '24 hour'
GROUP BY b.name;

SELECT v.id, v.engine_no, v.chassis_no, v.transferred, im.remarks, im.date_received
FROM vehicle_units v
JOIN inventory_movements im ON im.id = v.inventory_id
JOIN branches b ON b.id = im.branch_id
WHERE b.name ILIKE '%ilagan%'
  AND im.created_at > now() - interval '24 hour'
ORDER BY v.id;
