-- Idempotent per-unit seeder for Tumauini branch
-- Normalizes model strings by removing spaces when matching existing items (TM 125 -> TM125)

DO $$
DECLARE
  r record;
  parsed_date date;
  clean_engine text;
  clean_chassis text;
  norm_model text;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      -- branch, item_no, date_received, supplier, tin, dr_no, si_no, brand, model, color, engine_no, chassis_no, pnpc_status, beg_inv, purchased, transfer, sales, ending_inv, note_date, remarks
      ('TUMAUINI','TM175','8/5/2025','ROXAS, ISABELA','669-059-669-00000','11346',NULL,'MONARCH','MONARCH 175','BLACK','162FMKN5158478','LX8TDK50XNE012651','Available at other Branch',1,NULL,NULL,0,0,'08/30/2025','Tumauini'),
      ('TUMAUINI','TM175','8/5/2025','ROXAS, ISABELA','669-059-669-00000','11347',NULL,'MONARCH','MONARCH 175','RED','162FMKN5158804','LX8PCL506NE012985','Available at other Branch',1,NULL,NULL,1,0,NULL,'Ilagan'),
      ('TUMAUINI','TM175','8/5/2025','ROXAS, ISABELA','669-059-669-00000','11346',NULL,'MONARCH','MONARCH 175','RED','162FMKN5158769','LX8PCL500NE012948','Available at other Branch',1,NULL,NULL,1,0,NULL,'Tumauini'),
      ('TUMAUINI','TM175','8/5/2025','ROXAS, ISABELA','669-059-669-00000','11345',NULL,'MONARCH','MONARCH 175','RED','162FMKN5158762','LX8PCL505NE012945','Available at other Branch',1,NULL,NULL,1,0,NULL,'Aurora'),
      ('TUMAUINI','TM175','8/5/2025','ROXAS, ISABELA','669-059-669-00000','11346',NULL,'MONARCH','MONARCH 175','BLACK','162FMKN5158471','LX8PCL503NE012653','Available at other Branch',1,NULL,NULL,1,0,'10/07/2025','Roxas'),
      ('TUMAUINI','TM175','8/5/2025','ROXAS, ISABELA','669-059-669-00000','11346',NULL,'MONARCH','MONARCH 175','RED','162FMKN5158749','LX8PCL500NE012934','Available at other Branch',1,NULL,NULL,1,0,'10/06/2025','Tumauini'),
      ('TUMAUINI','TM125','08/22/2025','TRENDWELL MOTORS OPC','669-059-669-00000','11491',NULL,'MONARCH','MONARCH 125','BLUE','156FMI2S5106357','LX8PCJ507SSE003857','Available',1,NULL,NULL,1,0,'10/28/2025','Roxas'),
      ('TUMAUINI','TM125','08/22/2025','TRENDWELL MOTORS OPC','669-059-669-00000','11491',NULL,'MONARCH','MONARCH 125','BLUE','156FMI2S5106359','LX8PCJ500SE003859','Available',1,NULL,NULL,0,0,'09/29/2025','Tumauini'),
      ('TUMAUINI','TM125','08/22/2025','TRENDWELL MOTORS OPC','669-059-669-00000','11491',NULL,'MONARCH','MONARCH 125','BLUE','156FMI2R5123842','LX8PCJ502RE011116','Available',1,NULL,NULL,0,0,'9/5/2025','Tumauini'),
      ('TUMAUINI','TM125','09/09/2025','TRENDWELL MOTORS OPC','669-059-669-00000','11559',NULL,'MONARCH','MONARCH 125','RED','156FMI2S5106274','LX8PCJ503SE003774','Available',1,NULL,NULL,1,0,NULL,'Tumauini'),
      ('TUMAUINI','TM125','09/09/2025','TRENDWELL MOTORS OPC','669-059-669-00000','11559',NULL,'MONARCH','MONARCH 125','RED','156FMI2S5106243','LX8PCJ503SE003743','Available',1,NULL,NULL,1,0,NULL,'Tumauini'),
      ('TUMAUINI','TM125','09/09/2025','TRENDWELL MOTORS OPC','669-059-669-00000','11559',NULL,'MONARCH','MONARCH 125','RED','156FMI2S5106275','LX8PCJ505SE003775','Available',1,NULL,NULL,1,0,NULL,'Aurora'),
      ('TUMAUINI','TM125','09/09/2025','TRENDWELL MOTORS OPC','669-059-669-00000','11559',NULL,'MONARCH','MONARCH 125','BLUE','156FMI2S5106374','LX8PCJ507SE003874','Available',1,NULL,NULL,1,0,'10/28/2025','Roxas'),
      ('TUMAUINI','TM125','09/09/2025','TRENDWELL MOTORS OPC','669-059-669-00000','11559',NULL,'MONARCH','MONARCH 125','BLUE','156FMI2S5106327','LX8PCJ509SE003827','Available',1,NULL,NULL,1,0,NULL,'Aurora'),
      ('TUMAUINI','TM175','09/09/2025','TRENDWELL MOTORS OPC','669-059-669-00000','11559',NULL,'MONARCH','MONARCH 175','RED','162FMKS5106720','LX8PCL500SE007941','Available',1,NULL,NULL,1,0,NULL,'Aurora'),
      ('TUMAUINI','TM175','09/09/2025','TRENDWELL MOTORS OPC','669-059-669-00000','11559',NULL,'MONARCH','MONARCH 175','RED','162FMKS5106702','LX8PCL509SE007923','Available',1,NULL,NULL,1,0,NULL,'Ilagan'),
      ('TUMAUINI','TM175','09/09/2025','TRENDWELL MOTORS OPC','669-059-669-00000','11559',NULL,'MONARCH','MONARCH 175','RED','162FMKS5106714','LX8PCL505SE007935','Available',1,NULL,NULL,1,0,NULL,'Tumauini'),
      ('TUMAUINI','TM175','09/09/2025','TRENDWELL MOTORS OPC','669-059-669-00000','11559',NULL,'MONARCH','MONARCH 175','RED','162FMKS5106732','LX8PCL507SE007953','Available',1,NULL,NULL,0,0,'10/20/2025','Tumauini'),
      ('TUMAUINI','TM175','09/09/2025','TRENDWELL MOTORS OPC','669-059-669-00000','11559',NULL,'MONARCH','MONARCH 175','RED','162FMKS5106713','LX8PCL503SE007934','Available',1,NULL,NULL,1,0,NULL,'Tumauini'),
      ('TUMAUINI','SG150-B','09/16/2025','ROXAS, ISABELA','669-059-669-00000','11586',NULL,'MONARCH','P1 BOLT 150','BLACK SILVER','1P57MJS1121603','LX8TDK8GXSB001001','Available at other Branch',1,NULL,NULL,0,0,'9/18/2025','Tumauini'),
      ('TUMAUINI','SG150-B','09/27/2025','TRENDWELL MOTORS OPC','669-059-669-00000','11640',NULL,'MONARCH','P1 BOLT 150','BROWN SILVER','1P57MJS1227309','LX8TDK8G0SB001556','Available at other Branch',1,NULL,NULL,1,0,NULL,'Tumauini'),
      ('TUMAUINI','SG150-B','09/27/2025','TRENDWELL MOTORS OPC','669-059-669-00000','11640',NULL,'MONARCH','P1 BOLT 150','BROWN SILVER','1P57MJS1227300','LX8TDK8G1SB001551','Available at other Branch',1,NULL,NULL,1,0,NULL,'Ilagan'),
      ('TUMAUINI','SG150-B','09/27/2025','TRENDWELL MOTORS OPC','669-059-669-00000','11641',NULL,'MONARCH','P1 BOLT 150','BROWN SILVER','1P57MJS1227305','LX8TDK8G7SB001554','Available at other Branch',1,NULL,NULL,1,0,NULL,'Tumauini'),
      ('TUMAUINI','SG150-B','09/27/2025','TRENDWELL MOTORS OPC','669-059-669-00000','11640',NULL,'MONARCH','P1 BOLT 150','BROWN SILVER','1P57MJS1227302','LX8TDK8G5SB001558','Available at other Branch',1,NULL,NULL,1,0,NULL,'Tumauini'),
      ('TUMAUINI','SG150-B','09/27/2025','TRENDWELL MOTORS OPC','669-059-669-00000','11640',NULL,'MONARCH','P1 BOLT 150','BROWN SILVER','1P57MJS1227329','LX8TDK8G0SB001573','Available at other Branch',1,NULL,NULL,1,0,NULL,'Ilagan'),
      ('TUMAUINI','SG150-B','09/27/2025','TRENDWELL MOTORS OPC','669-059-669-00000','11641',NULL,'MONARCH','P1 BOLT 150','BROWN SILVER','1P57MJS1227308','LX8TDK8G7SB001571','Available at other Branch',1,NULL,NULL,1,0,NULL,'Tumauini'),
      ('TUMAUINI','SG150-B','09/27/2025','TRENDWELL MOTORS OPC','669-059-669-00000','11640',NULL,'MONARCH','P1 BOLT 150','BROWN SILVER','1P57MJS1227310','LX8TDK8G2SB001557','Available at other Branch',1,NULL,NULL,1,0,NULL,'Tumauini'),
      ('TUMAUINI','SG150-B','09/27/2025','TRENDWELL MOTORS OPC','669-059-669-00000','11641',NULL,'MONARCH','P1 BOLT 150','BROWN SILVER','1P57MJS1227307','LX8TDK8G5SB001570','Available at other Branch',1,NULL,NULL,1,0,NULL,'Tumauini'),
      ('TUMAUINI','SG150-B','09/27/2025','TRENDWELL MOTORS OPC','669-059-669-00000','11641',NULL,'MONARCH','P1 BOLT 150','BROWN SILVER','1P57MJS1227335','LX8TDK8G8SB001577','Available at other Branch',1,NULL,NULL,1,0,NULL,'Tumauini'),
      ('TUMAUINI','SG150-B','09/27/2025','TRENDWELL MOTORS OPC','669-059-669-00000','11641',NULL,'MONARCH','P1 BOLT 150','BROWN SILVER','1P57MJS1227338','LX8TDK8G8SB001580','Available at other Branch',1,NULL,NULL,1,0,NULL,'Tumauini'),
      ('TUMAUINI','SG150-B','09/27/2025','TRENDWELL MOTORS OPC','669-059-669-00000','11641',NULL,'MONARCH','P1 BOLT 150','BROWN SILVER','1P57MJS1227293','LX8TDK8G5SB001584','Available at other Branch',1,NULL,NULL,1,0,NULL,'Tumauini'),
      ('TUMAUINI','WM125','09/27/2025','TRENDWELL MOTORS OPC','669-059-669-00000','11370',NULL,'MONARCH','OMNI 125','NIGHT GRAY','1P52QMIRTC01479','LWMTJV1C2RT001479','Available at other Branch',1,NULL,NULL,1,0,NULL,'Aurora'),
      ('TUMAUINI','WM125','09/27/2025','TRENDWELL MOTORS OPC','669-059-669-00000','11370',NULL,'MONARCH','OMNI 125','NIGHT GRAY','1P52QMIRTC01458','LWMTJV1C5RT001458','Available at other Branch',1,NULL,NULL,1,0,NULL,'Tumauini'),
      ('TUMAUINI','SG150T-8U','10/23/2025','SKYGO MARKETING CORP','225-520-539-00000','012970',NULL,'SKYGO','M1 LANCE 150','WHITE/GOLD','1P57MJR1343579','LX8TDK8URRB001486','Available',1,NULL,NULL,1,0,NULL,'Tumauini')
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
      -- normalize and validate date_received
      IF r.date_received IS NULL OR trim(r.date_received) = '' THEN
        parsed_date := CURRENT_DATE;
      ELSIF r.date_received ~ '^[0-9]{1,2}/[0-9]{1,2}/[0-9]{4}$' THEN
        parsed_date := to_date(r.date_received, 'MM/DD/YYYY');
      ELSIF r.date_received ~ '^[0-9]{1,2}/[0-9]{1,2}/[0-9]{2}$' THEN
        parsed_date := (to_date(r.date_received, 'MM/DD/YY') + interval '2000 years')::date;
      ELSE
        parsed_date := COALESCE(r.date_received::date, CURRENT_DATE);
      END IF;

      -- normalize model (remove spaces) for matching
      norm_model := regexp_replace(coalesce(r.model, ''), '\\s+', '', 'g');
      clean_engine := NULLIF(regexp_replace(coalesce(r.engine_no, ''), '\\s+', '', 'g'), '');
      clean_chassis := NULLIF(regexp_replace(coalesce(r.chassis_no, ''), '\\s+', '', 'g'), '');

      -- resolve branch
      SELECT id INTO br_id FROM branches WHERE name ILIKE '%' || r.branch || '%' LIMIT 1;
      IF br_id IS NULL THEN
        INSERT INTO branches (name) VALUES (r.branch) RETURNING id INTO br_id;
      END IF;

      -- resolve supplier
      SELECT id INTO sup_id FROM suppliers WHERE name ILIKE '%' || split_part(coalesce(r.supplier, ''), ' ', 1) || '%' LIMIT 1;
      IF sup_id IS NULL THEN
        IF coalesce(r.supplier, '') <> '' THEN
          INSERT INTO suppliers (name, tin_number, created_at) VALUES (coalesce(r.supplier, ''), coalesce(r.tin, ''), NOW()) RETURNING id INTO sup_id;
        ELSE
          sup_id := NULL;
        END IF;
      END IF;

      -- resolve item: try normalized model match first, then model, then item_no
      SELECT id INTO item_id FROM items WHERE regexp_replace(coalesce(model,''), '\\s+', '', 'g') ILIKE norm_model AND brand ILIKE '%' || r.brand || '%' LIMIT 1;
      IF item_id IS NULL THEN
        SELECT id INTO item_id FROM items WHERE model ILIKE r.model AND brand ILIKE '%' || r.brand || '%' LIMIT 1;
      END IF;
      IF item_id IS NULL THEN
        SELECT id INTO item_id FROM items WHERE item_no ILIKE '%' || r.item_no || '%' LIMIT 1;
      END IF;

      IF item_id IS NULL THEN
        INSERT INTO items (item_no, brand, model, color, created_at)
        VALUES (coalesce(r.item_no,''), coalesce(r.brand,''), coalesce(r.model,''), ARRAY[coalesce(r.color,'')], NOW()) RETURNING id INTO item_id;
      END IF;

      -- sold/transfer flags
      IF r.ending_inv IS NOT NULL AND r.ending_inv = 0 THEN
        sold_qty := 1;
      ELSE
        sold_qty := 0;
      END IF;
      -- Check for transfer indicators: remarks indicate transfer away from Tumauini (remarks contain other branch names)
      -- Units with 'Tumauini' in remarks or empty remarks stay at Tumauini (trans_qty=0)
      -- Units with other branch names in remarks (Ilagan, Aurora, Roxas, etc.) are transfers (trans_qty=1)
      IF r.remarks IS NOT NULL 
         AND trim(r.remarks) <> '' 
         AND lower(trim(r.remarks)) NOT LIKE '%tumauini%' THEN
        trans_qty := 1;
      ELSE
        trans_qty := 0;
      END IF;

      -- skip if vehicle exists in active units OR transferred history
      IF (clean_engine IS NOT NULL AND (
          EXISTS(SELECT 1 FROM vehicle_units v WHERE v.engine_no = clean_engine)
        OR EXISTS(SELECT 1 FROM transferred_history th WHERE th.engine_no = clean_engine)
        ))
         OR (clean_chassis IS NOT NULL AND (
          EXISTS(SELECT 1 FROM vehicle_units v WHERE v.chassis_no = clean_chassis)
        OR EXISTS(SELECT 1 FROM transferred_history th WHERE th.chassis_no = clean_chassis)
        )) THEN
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
          parsed_date,
          sup_id,
          r.dr_no,
          r.si_no,
          COALESCE((SELECT cost_of_purchase FROM items WHERE id = item_id), (SELECT srp FROM items WHERE id = item_id), 0),
          COALESCE((CASE WHEN trim(COALESCE(r.beg_inv::text, '')) ~ '^[0-9]+$' THEN r.beg_inv::int ELSE NULL END), 1),
          COALESCE((CASE WHEN trim(COALESCE(r.purchased::text, '')) ~ '^[0-9]+$' THEN r.purchased::int ELSE NULL END), 1),
          trans_qty,
          sold_qty,
          COALESCE((CASE WHEN trim(COALESCE(r.ending_inv::text, '')) ~ '^[0-9]+$' THEN r.ending_inv::int ELSE NULL END), (CASE WHEN trim(COALESCE(r.beg_inv::text, '')) ~ '^[0-9]+$' THEN r.beg_inv::int ELSE 0 END)),
          r.remarks,
          NOW(),
          (SELECT srp FROM items WHERE id = item_id),
          CASE WHEN (SELECT srp FROM items WHERE id = item_id) IS NOT NULL AND COALESCE((SELECT cost_of_purchase FROM items WHERE id = item_id),0) > 0
               THEN (((SELECT srp FROM items WHERE id = item_id) - COALESCE((SELECT cost_of_purchase FROM items WHERE id = item_id),0)) / COALESCE((SELECT cost_of_purchase FROM items WHERE id = item_id),1)) * 100
               ELSE 0 END,
          NULLIF(r.color, ''),
          'transferred',
          clean_chassis,
          clean_engine,
          1,
          NOW(),
          'transferred'
        );
      ELSE
        INSERT INTO inventory_movements (branch_id, item_id, date_received, supplier_id, dr_no, si_no, cost, beginning_qty, purchased_qty, transferred_qty, sold_qty, ending_qty, color, srp, remarks, created_at)
        VALUES (
          br_id,
          item_id,
          parsed_date,
          sup_id,
          r.dr_no,
          r.si_no,
          COALESCE((SELECT cost_of_purchase FROM items WHERE id = item_id), (SELECT srp FROM items WHERE id = item_id), 0),
          COALESCE((CASE WHEN trim(COALESCE(r.beg_inv::text, '')) ~ '^[0-9]+$' THEN r.beg_inv::int ELSE NULL END), 1),
          COALESCE((CASE WHEN trim(COALESCE(r.purchased::text, '')) ~ '^[0-9]+$' THEN r.purchased::int ELSE NULL END), 1),
          trans_qty,
          sold_qty,
          COALESCE((CASE WHEN trim(COALESCE(r.ending_inv::text, '')) ~ '^[0-9]+$' THEN r.ending_inv::int ELSE NULL END), (CASE WHEN trim(COALESCE(r.beg_inv::text, '')) ~ '^[0-9]+$' THEN r.beg_inv::int ELSE 0 END)),
          NULLIF(r.color, ''),
          (SELECT srp FROM items WHERE id = item_id),
          r.remarks,
          NOW()
        ) RETURNING id INTO inv_id;

        INSERT INTO vehicle_units (inventory_id, chassis_no, engine_no, unit_number, created_at)
        VALUES (inv_id, clean_chassis, clean_engine, 1, NOW());
      END IF;

    END;
  END LOOP;
END;
$$;

-- verification
SELECT v.id, v.engine_no, v.chassis_no, b.name AS branch, i.item_no, im.date_received, im.ending_qty, im.remarks
FROM vehicle_units v
JOIN inventory_movements im ON im.id = v.inventory_id
JOIN branches b ON b.id = im.branch_id
JOIN items i ON i.id = im.item_id
WHERE b.name ILIKE '%Tumauini%' AND im.created_at > now() - interval '1 hour'
ORDER BY v.id;
