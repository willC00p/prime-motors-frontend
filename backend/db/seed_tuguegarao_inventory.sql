-- Careful idempotent seeder for Prime Motors Tuguegarao branch
-- This follows the same robust patterns used for Solana: normalize dates, clean engine/chassis,
-- resolve branch/supplier/item, use COALESCE for cost, and skip duplicates.

DO $$
DECLARE
  r record;
  parsed_date date;
  clean_engine text;
  clean_chassis text;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      -- branch, item_no, date_received, supplier, details, dr_no, si_no, brand, model, color, engine_no, chassis_no, pnpc_status, beg_inv, purchased, transfer, sales, ending_inv, note_date, remarks
    ('TUGUEGARAO','TM125','08/16/2025','TUMAUINI ISABELA',NULL,'11450',NULL,'MONARCH','TM125','RED','156FM12R5123746','LX8PCJ500RE011020','AVAILABLE',0,NULL,NULL,0,0,NULL,'Tuguegarao'),
    ('TUGUEGARAO','TM125','08/16/2025','TUMAUINI ISABELA','TRANSFER TO BAGGAO','11450',NULL,'MONARCH','TM125','RED','156FMI2R5123773','LX8PCJ509RE011047','AVAILABLE',1,NULL,NULL,0,0,NULL,'Tuguegarao - transfer to Baggao'),
    ('TUGUEGARAO','TM125','08/16/2025',NULL,'TRANSFER TO ROXAS','11429',NULL,'MONARCH','TM125','BLACK','156FMI2S5106303','LX8PCJ505SE003803','AVAILABLE',1,NULL,NULL,0,0,NULL,'Tuguegarao - transfer to Roxas'),
  ('TUGUEGARAO','TM125','08/16/2025',NULL,'TRANSFER TO BAGGAO','11429',NULL,'MONARCH','TM125','BLACK','156FMI2S5106304','LX8PCJ508SE003804','AVAILABLE',0,0,0,0,0,NULL,'delivered - Tuguegarao - transfer to Baggao'),
    ('TUGUEGARAO','TM125','08/16/2025',NULL,'TRANSFER TO ROXAS','11429',NULL,'MONARCH','TM125','BLACK','156FMI2S5106299','LX8PCJ508SE003799','AVAILABLE',1,NULL,NULL,0,0,NULL,'Tuguegarao - transfer to Roxas'),
  ('TUGUEGARAO','TM125','08/16/2025',NULL,'TRANSFER TO BAGGAO','11429',NULL,'MONARCH','TM125','BLACK','156FMI2S5106302','LX8PCJ504SE003802','AVAILABLE',0,0,0,0,0,'2025-09-06','DELIVERED - BAGGAO/DEL - Baggao'),
  ('TUGUEGARAO','TM125','08/16/2025',NULL,NULL,'11449',NULL,'MONARCH','TM125','BLUE','156FMI2S5106347','LX8PCJ504SE003847','AVAILABLE',0,0,0,0,0,'2025-09-06','DELIVERED FOR REG. - Tuguegarao'),
  ('TUGUEGARAO','TM125','08/16/2025',NULL,NULL,'11449',NULL,'MONARCH','TM125','BLUE','156FMI2S5106350','LX8PCJ504SE003850','AVAILABLE',0,0,0,0,0,NULL,'DELIVERED - Tuguegarao'),
  ('TUGUEGARAO','TM125','08/16/2025',NULL,'TRANSFER TO SOLANA','11449',NULL,'MONARCH','TM125','RED','156FMI2R5123780','LX8PCJ506RE011054','AVAILABLE',0,0,0,0,0,NULL,'DELIVERED - Tuguegarao - transfer to Solana'),
    ('TUGUEGARAO','TM125','08/16/2025',NULL,NULL,'11449',NULL,'MONARCH','TM125','RED','156FMI2R5123745','LX8PCJ504RE011019','AVAILABLE',1,NULL,NULL,1,0,NULL,'Tuguegarao'),
  ('TUGUEGARAO','TM125','08/16/2025',NULL,NULL,'11449',NULL,'MONARCH','TM125','RED','156FMI2S5106221','LX8PCJ504SE003721','AVAILABLE',0,0,0,0,1,NULL,'DELIVERED - Tuguegarao'),
  ('TUGUEGARAO','TM150T','08/16/2025',NULL,NULL,'11452',NULL,'MONARCH','BOLT150','BLACK/SILVER','1P57MJS1121609','LX8TDK8G1SB001033','AVAILABLE',0,0,0,0,0,'2025-09-06','DELIVERED FOR REG. - Tuguegarao'),
  ('TUGUEGARAO','TM150T','08/16/2025',NULL,NULL,'11424',NULL,'MONARCH','BOLT150','BLACK/SILVER','1P57MJS1121639','LX8TDK8G8SB001028','AVAILABLE',0,0,0,0,0,'2025-09-02','DELIVERED FOR REG. - Tuguegarao'),
  ('TUGUEGARAO','TM150T','08/16/2025',NULL,NULL,'11424',NULL,'MONARCH','BOLT150','BLACK/SILVER','1P57MJS1121641','LX8TDK8GXSB001029','AVAILABLE',0,0,0,0,0,'2025-09-02','DELIVERED FOR REG. - Tuguegarao'),
      ('TUGUEGARAO','TM150T','08/16/2025',NULL,NULL,'11452',NULL,'MONARCH','BOLT150','BLACK/SILVER','1P57MJS1121644','LX8TDK8GXSB001032','AVAILABLE',1,NULL,NULL,1,0,NULL,'Tuguegarao'),
  ('TUGUEGARAO','TM150T','08/16/2025',NULL,NULL,'11451',NULL,'MONARCH','BOLT150','BLACK/SILVER','1P57MJS1121640','LX8TDK8G9SB001040','AVAILABLE',0,0,0,0,0,'2025-09-02','DELIVERED FOR REG. - Tuguegarao'),
  ('TUGUEGARAO','SG150T','08/16/2025',NULL,NULL,'11326',NULL,'SKYGO','LANCE150','WHITE/GOLD','1P57MJS1067193','LX8TDK8U7SB000149','AVAILABLE',0,0,0,0,0,'2025-09-02','DELIVERED FOR REG. - Tuguegarao'),
      ('TUGUEGARAO','WM125','08/16/2025',NULL,'TRANSFER TO BAGGAO','11388',NULL,'MONARCH','OMNI125','PEARL/WHITE','1P52QMISTC00214','LWMTJVIC8ST000214','AVAILABLE',1,NULL,NULL,1,0,NULL,'Baggao - transfer'),
  ('TUGUEGARAO','WM125','08/16/2025',NULL,NULL,'11388',NULL,'MONARCH','OMNI125','PEARL/WHITE','1P52QMISTC00211','LWMTJV1C2ST000211','AVAILABLE',1,0,0,0,0,'2025-09-06','DELIVERED FOR REG. - Tuguegarao'),
      ('TUGUEGARAO','WM125','08/16/2025',NULL,'TRANSFER TO ROXAS','11391',NULL,'MONARCH','OMNI125','PEARL/WHITE','1P52QMISTC00221','LWMTJV1C5ST000221','AVAILABLE',1,NULL,NULL,0,0,NULL,'Roxas - transfer'),
  ('TUGUEGARAO','WM125','08/16/2025',NULL,NULL,'11391',NULL,'MONARCH','OMNI125','PEARL/WHITE','1P52QMISTC00226','LWMTJV1C4ST000226','AVAILABLE',0,0,0,0,0,NULL,'DELIVERED - Tuguegarao'),
  ('TUGUEGARAO','WM125','08/16/2025',NULL,NULL,'11389',NULL,'MONARCH','OMNI125','PEARL/WHITE','1P52QMISTC00223','LWMTJV1C9ST000223','AVAILABLE',0,0,0,0,0,'2025-09-30','DELIVERED - Tuguegarao'),
  ('TUGUEGARAO','TM150T','08/16/2025',NULL,NULL,'11424',NULL,'MONARCH','BOLT150','BLACK/SILVER','1P57MJS1121636','LX8TD8G2SB001025','AVAILABLE',1,0,0,1,0,'2025-08-29','DELIVERED - Tuguegarao'),
  ('TUGUEGARAO','TM125','08/16/2025',NULL,NULL,'11429',NULL,'MONARCH','TM125','BLACK','156FMI2S5106300','LX8PCJ500SE003800','AVAILABLE',1,0,0,1,0,'2025-08-27','DELIVERED - Tuguegarao'),
  ('TUGUEGARAO','SG1502T','08/16/2025',NULL,NULL,'11425',NULL,'SKYGO','LANCE150','BLACK/GOLD','1P57MJS1067235','LX8TDK8UXSB00176','AVAILABLE',1,0,0,1,0,'2025-08-27','DELIVERED - Tuguegarao'),
  ('TUGUEGARAO','SGT502T','09/06/2025','ROXAS, ISABELA','TRANSFER TO ROXAS','11330',NULL,'SKYGO','LANCE150','WHITE/GOLD','1P57MJS1067190','LX8TDK8U3SB000147','NOT YET',0,0,0,0,0,NULL,'DELIVERED - Roxas - transfer'),
  ('TUGUEGARAO','TM125','09/08/2025','TRENDWELL MOTORS OPC','TRANSFER TO GATTARAN','11456',NULL,'MONARCH','TM125','BLUE','156FMI2S5106366','LX8PCJ508SE003866','AVAILABLE',1,NULL,NULL,1,0,NULL,'Tuguegarao'),
  ('TUGUEGARAO','TM125','09/08/2025','TRENDWELL MOTORS OPC','TRANSFER TO GATTARAN','11456',NULL,'MONARCH','TM125','BLUE','156FMI2S5106366','LX8PCJ508SE003866','AVAILABLE',1,NULL,NULL,1,0,NULL,'Tuguegarao'),
  ('TUGUEGARAO','TM125','09/08/2025','TRENDWELL MOTORS OPC',NULL,'11456',NULL,'MONARCH','TM125','BLUE','156FMI2S5106383','LX8PCJ502SE003863','AVAILABLE',1,NULL,NULL,NULL,0,NULL,'Tuguegarao'),
  ('TUGUEGARAO','TM125','09/08/2025','TRENDWELL MOTORS OPC','TRANSFER TO GATTARAN','11456',NULL,'MONARCH','TM125','BLUE','156FMI2S5106365','LX8PCJ508SE003865','AVAILABLE',1,NULL,NULL,1,0,NULL,'Tuguegarao'),
  ('TUGUEGARAO','TM125','09/08/2025','TRENDWELL MOTORS OPC',NULL,'11456',NULL,'MONARCH','TM125','BLUE','156FMI2S5106361','LX8PCJ509SE003861','AVAILABLE',1,NULL,NULL,NULL,0,NULL,'Tuguegarao'),
    ('TUGUEGARAO','TM175','09/09/2025','ROXAS, ISABELA',NULL,'11472',NULL,'MONARCH','TM175','BLACK','162FMKN5158484','LX8PCL504NEO12662','AVAILABLE',0,0,0,0,0,'2025-09-15','DELIVERED - Tuguegarao'),
  ('TUGUEGARAO','TM175','09/09/2025','ROXAS, ISABELA',NULL,'11345',NULL,'MONARCH','TM175','RED','162FMKN5158790','LX8PCL502NE012966','NO PNPC',0,0,0,0,0,'2025-09-30','DELIVERED - Tuguegarao'),
  ('TUGUEGARAO','TM175','09/09/2025','ROXAS, ISABELA','TRANSFER TO BAGGAO','11345',NULL,'MONARCH','TM175','BLUE','162FMKN5158599','LX8PCL501NE012778','NO PNPC',0,0,0,0,0,'2025-09-09','DELIVERED - BAGGAO - Baggao'),
    ('TUGUEGARAO','TM175','09/10/2025','TRENDWELL MOTORS OPC','TRANSFER TO BAGGAO','11561',NULL,'MONARCH','TM175','BLUE','162FMKS5106794','LX8PCL501SE008015','AVAILABLE',0,NULL,NULL,0,0,NULL,'Tuguegarao - transfer to Baggao'),
  ('TUGUEGARAO','TM175','09/10/2025','TRENDWELL MOTORS OPC',NULL,'11561',NULL,'MONARCH','TM175','RED','162FMKS5106712','LX8PCL501SE007933','AVAILABLE',0,0,0,0,0,NULL,'DELIVERED - Tuguegarao'),
  ('TUGUEGARAO','TM175','09/10/2025','TRENDWELL MOTORS OPC','TRANSFER TO SOLANA','11561',NULL,'MONARCH','TM175','BLUE','162FMKS5106820','LX8PCL502SE008041','AVAILABLE',0,NULL,0,NULL,0,NULL,'Tuguegarao - transfer to Solana'),
    ('TUGUEGARAO','TM175','09/10/2025','TRENDWELL MOTORS OPC',NULL,'11561',NULL,'MONARCH','TM175','BLUE','162FMKN5158564','LX8PCL506NE012744','AVAILABLE',1,NULL,NULL,NULL,0,NULL,'Tuguegarao'),
  ('TUGUEGARAO','TM175','09/10/2025','TRENDWELL MOTORS OPC',NULL,'11561',NULL,'MONARCH','TM175','RED','162FMKS5106727','LX8PCL503SE007948','AVAILABLE',0,NULL,0,NULL,0,NULL,'Tuguegarao')
    ) AS t(branch, item_no, date_received, supplier, details, dr_no, si_no, brand, model, color, engine_no, chassis_no, pnpc_status, beg_inv, purchased, transfer, sales, ending_inv, note_date, remarks)
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
          INSERT INTO suppliers (name, created_at) VALUES (coalesce(r.supplier, ''), NOW()) RETURNING id INTO sup_id;
        ELSE
          sup_id := NULL;
        END IF;
      END IF;

      -- resolve item
      SELECT id INTO item_id FROM items WHERE model ILIKE r.model AND brand ILIKE '%' || r.brand || '%' LIMIT 1;
      IF item_id IS NULL THEN
        SELECT id INTO item_id FROM items WHERE item_no ILIKE '%' || r.item_no || '%' LIMIT 1;
      END IF;
      IF item_id IS NULL THEN
          INSERT INTO items (item_no, brand, model, color, cost_of_purchase, srp, created_at)
          VALUES (
            coalesce(r.item_no,''),
            coalesce(r.brand,''),
            coalesce(r.model,''),
            ARRAY[coalesce(r.color,'')],
            CASE
              WHEN lower(coalesce(r.item_no,'')) LIKE '%tm125%' OR lower(coalesce(r.model,'')) LIKE '%tm125%' THEN 40940
              WHEN lower(coalesce(r.item_no,'')) LIKE '%tm175%' OR lower(coalesce(r.model,'')) LIKE '%tm175%' THEN 44500
              WHEN lower(coalesce(r.item_no,'')) LIKE '%sg1502t%' OR lower(coalesce(r.model,'')) LIKE '%sg1502t%' THEN 86330
              ELSE NULL
            END,
            CASE
              WHEN lower(coalesce(r.item_no,'')) LIKE '%tm125%' OR lower(coalesce(r.model,'')) LIKE '%tm125%' THEN 46000
              WHEN lower(coalesce(r.item_no,'')) LIKE '%tm175%' OR lower(coalesce(r.model,'')) LIKE '%tm175%' THEN 50000
              WHEN lower(coalesce(r.item_no,'')) LIKE '%sg1502t%' OR lower(coalesce(r.model,'')) LIKE '%sg1502t%' THEN 97000
              ELSE NULL
            END,
            NOW()
          ) RETURNING id INTO item_id;
        END IF;

        -- ensure canonical cost/srp for known models (update existing items when matched)
        UPDATE items
        SET cost_of_purchase = CASE
              WHEN lower(item_no) LIKE '%tm125%' OR lower(model) LIKE '%tm125%' THEN 40940
              WHEN lower(item_no) LIKE '%tm175%' OR lower(model) LIKE '%tm175%' THEN 44500
              WHEN lower(item_no) LIKE '%sg1502t%' OR lower(model) LIKE '%sg1502t%' THEN 86330
              ELSE cost_of_purchase END,
            srp = CASE
              WHEN lower(item_no) LIKE '%tm125%' OR lower(model) LIKE '%tm125%' THEN 46000
              WHEN lower(item_no) LIKE '%tm175%' OR lower(model) LIKE '%tm175%' THEN 50000
              WHEN lower(item_no) LIKE '%sg1502t%' OR lower(model) LIKE '%sg1502t%' THEN 97000
              ELSE srp END
        WHERE id = item_id
          AND (
            lower(item_no) LIKE '%tm125%' OR lower(model) LIKE '%tm125%'
            OR lower(item_no) LIKE '%tm175%' OR lower(model) LIKE '%tm175%'
            OR lower(item_no) LIKE '%sg1502t%' OR lower(model) LIKE '%sg1502t%'
      );

      IF r.ending_inv IS NOT NULL AND r.ending_inv = 0 THEN
        sold_qty := 1;
      ELSE
        sold_qty := 0;
      END IF;
      -- Check for transfer indicators: purchased=0, transfer column=0, details field, or remarks indicate transfer away from Tuguegarao
      -- All rows with ANY transfer indication should go to transferred_history
      IF COALESCE(r.purchased, 1) = 0
         OR (r.transfer IS NOT NULL AND CAST(r.transfer AS TEXT) = '0')
         OR (r.details IS NOT NULL AND lower(trim(r.details)) LIKE '%transfer%')
         OR (r.remarks IS NOT NULL AND (lower(trim(r.remarks)) LIKE '%transfer%' OR lower(trim(r.remarks)) LIKE '%baggao%' OR lower(trim(r.remarks)) LIKE '%solana%' OR lower(trim(r.remarks)) LIKE '%roxas%')) THEN
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
          clean_chassis,
          clean_engine,
          1,
          NOW(),
          'transferred'
        );
      ELSE
        -- insert into active inventory tables
        INSERT INTO inventory_movements (branch_id, item_id, date_received, supplier_id, dr_no, si_no, cost, beginning_qty, purchased_qty, transferred_qty, sold_qty, ending_qty, color, srp, remarks, created_at)
        VALUES (
          br_id,
          item_id,
          parsed_date,
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
        VALUES (inv_id, clean_chassis, clean_engine, 1, NOW());
      END IF;

    END;
  END LOOP;
END;
$$;

-- Show recently added Tuguegarao units for review
SELECT v.id, v.engine_no, v.chassis_no, b.name AS branch, i.item_no, im.date_received, im.ending_qty, im.remarks
FROM vehicle_units v
JOIN inventory_movements im ON im.id = v.inventory_id
JOIN branches b ON b.id = im.branch_id
JOIN items i ON i.id = im.item_id
WHERE b.name ILIKE '%Tuguegarao%' AND im.created_at > now() - interval '1 hour'
ORDER BY v.id;
