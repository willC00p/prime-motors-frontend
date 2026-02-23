-- Careful idempotent seeder for Prime Motors Solana branch
-- This seeder parses and validates each row before inserting.
-- Behaviors:
--  - Normalizes date formats (MM/DD/YYYY and MM/DD/YY -> 20YY)
--  - Trims and removes extra whitespace from engine/chassis numbers
--  - Resolves branch, supplier, and item by model+brand then item_no, creating a minimal item if needed
--  - Ensures inventory_movements.cost is never NULL (COALESCE(cost_of_purchase, srp, 0))
--  - Marks transferred_qty when remarks contain 'TRANSFER' or when remarks is non-empty and not 'CASH SALE'
--  - Skips inserting a vehicle if engine_no OR chassis_no already exists; updates existing inventory row color/srp/cost

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
      ('Prime Motors Solana','WM125','08/16/2025','TRENDWELL MOTORS OPC',NULL,'11389',NULL,'MONARCH','OMNI 125','PEARL WHITE','1P52QMISTC00222','LWMTJV1C7ST000222',NULL,1,1,NULL,0,0,'10/06/2025','-SOLANA'),
      ('Prime Motors Solana','TM125','08/09/2025','TRENDWELL MOTORS OPC',NULL,'11457',NULL,'MONARCH','MONARCH 125','BLUE','156FM12S5106339','LX8PCJ505SE003839','AVAILABLE',1,1,NULL,0,0,NULL,'-SOLANA'),
      ('Prime Motors Solana','TM125','09/08/2025','TRENDWELL MOTORS OPC',NULL,'11457',NULL,'MONARCH','MONARCH 125','BLUE','156FMI2S5106341','LX8PCJ503SE003841','AVAILABLE',1,1,NULL,0,0,'09/27/2025','-SOLANA'),
      ('Prime Motors Solana','TM125','08/09/2025','TRENDWELL MOTORS OPC',NULL,'11457',NULL,'MONARCH','MONARCH 125','BLUE','156FMI2S5106340','LX8PCJ501SE003840','AVAILABLE',1,1,NULL,0,0,'09/27/2025','-SOLANA'),
      ('Prime Motors Solana','TM125','09/10/2025','TRENDWELL MOTORS OPC',NULL,'11562',NULL,'MONARCH','MONARCH 125','BLUE','156FMI2S5106372','LX8PCJ503SE003872','AVAILABLE',1,1,NULL,0,0,'10/13/2025','-SOLANA'),
      ('Prime Motors Solana','TM125','09/10/2025','TRENDWELL MOTORS OPC',NULL,'11562',NULL,'MONARCH','MONARCH 125','RED','156FMI2S5106242','LX8PCJ501SE003742','AVAILABLE',1,1,NULL,0,0,'10/06/2025','-SOLANA'),
      ('Prime Motors Solana','TM125','09/10/2025','TRENDWELL MOTORS OPC',NULL,'11562',NULL,'MONARCH','MONARCH 125','RED','156FMI2S5106241','LX8PCJ50XSE003741','AVAILABLE',1,1,NULL,0,0,'10/13/2025','-SOLANA'),
      ('Prime Motors Solana','TM125','09/10/2025','TRENDWELL MOTORS OPC',NULL,'11562',NULL,'MONARCH','MONARCH 125','BLACK','156FMI2R5122408','LX8PCJ506RE009062','AVAILABLE',1,1,NULL,0,0,'09/27/2025','-SOLANA'),
      ('Prime Motors Solana','TM125','09/10/2025','TRENDWELL MOTORS OPC',NULL,'11562',NULL,'MONARCH','MONARCH 125','RED','156FMI2S5106245','LX8PCJ507SE003745','AVAILABLE',1,1,NULL,0,0,'10/13/2025','-SOLANA'),
      ('Prime Motors Solana','TM175','09/10/2025','TRENDWELL MOTORS OPC',NULL,'11562',NULL,'MONARCH','MONARCH 175','RED','162FMKS5106708','LX8PCL50XSE007929','AVAILABLE',1,1,NULL,0,0,'09/11/2025','-SOLANA'),
      ('Prime Motors Solana','TM175','09/10/2025','TRENDWELL MOTORS OPC',NULL,'11562',NULL,'MONARCH','MONARCH 175','RED','156FMI2R5123741','LX8PCJ507RE011015','AVAILABLE',1,1,NULL,0,0,'09/06/2025','-SOLANA'),
      ('Prime Motors Solana','TM175','09/10/2025','TRENDWELL MOTORS OPC',NULL,'11562',NULL,'MONARCH','MONARCH 175','RED','162FMKS5106733','LX8PCL509SE007954','AVAILABLE',1,1,NULL,0,0,'09/20/2025','-SOLANA'),
      ('Prime Motors Solana','TM175','09/10/2025','TRENDWELL MOTORS OPC',NULL,'11562',NULL,'MONARCH','MONARCH 175','RED','1623FMKS5106717','LX8PCL500SE007938','AVAILABLE',1,1,NULL,0,0,NULL,'-SOLANA'),
      ('Prime Motors Solana','SG150 8U','09/11/2025','TRENDWELL MOTORS OPC',NULL,'11566',NULL,'MONARCH','M1 LANCE 150','WHITE/GOLD','1P57MJR1297973','LX8TDK8U1RB001100','AVAILABLE',1,1,NULL,0,0,NULL,'-SOLANA'),
      ('Prime Motors Solana','SG150 8U','09/11/2025','TRENDWELL MOTORS OPC',NULL,'11566',NULL,'MONARCH','M1 LANCE 150','WHITE/GOLD','1P57MJR1297947','LX8TD8URB001065','AVAILABLE',1,1,NULL,0,0,'09/20/2025','-SOLANA'),
      ('Prime Motors Solana','SG150 8U','09/11/2025','TRENDWELL MOTORS OPC',NULL,'11566',NULL,'MONARCH','M1 LANCE 150','WHITE/GOLD','1P57MJR1343565','LX8TDK8U5RB001472','AVAILABLE',1,1,NULL,0,0,'09/16/2025','-SOLANA'),
      ('Prime Motors Solana','TM150T','09/23/2025','TRENDWELL MOTORS',NULL,'11590',NULL,'MONARCH','P1 BOLT 150','BLACK/SILVER','1P57MJS1226944','LX8TDK8GSB001370','AVAILABLE',1,1,NULL,0,0,'10/06/2025','-SOLANA'),
      ('Prime Motors Solana','TM150T','09/23/2025','TRENDWELL MOTORS',NULL,'11590',NULL,'MONARCH','P1 BOLT 150','BLACK/SILVER','1P57MJS1226953','LX8TDK8G9SB001393','AVAILABLE',1,1,NULL,0,0,NULL,'-SOLANA'),
      ('Prime Motors Solana','TM150T','09/23/2025','TRENDWELL MOTORS',NULL,'11590',NULL,'MONARCH','P1 BOLT 150','BLACK/SILVER','1P57MJS1226948','LX8TDK8GXSB001371','AVAILABLE',1,1,NULL,0,0,NULL,'-SOLANA'),
      ('Prime Motors Solana','TM150T','09/23/2025','TRENDWELL MOTORS',NULL,'11590',NULL,'MONARCH','P1 BOLT 150','BLACK/SILVER','1P57MJS1226949','LX8TDK8G1SB001372','AVAILABLE',1,1,NULL,0,0,NULL,'-SOLANA'),
      ('Prime Motors Solana','TM150T','09/23/2025','TRENDWELL MOTORS',NULL,'11590',NULL,'MONARCH','P1 BOLT 150','BLACK/SILVER','1P57MJS1226951','LX8TDK8G3SB001373','AVAILABLE',1,1,NULL,0,0,NULL,'-SOLANA'),
      ('Prime Motors Solana','TM150T','09/15/2025','ROXAS ISABELA',NULL,'11586',NULL,'MONARCH','P1 BOLT 150','BLACK/SILVER','1P57MJS1121618','LX8TDK8G4SB001009','NO PNPC',1,0,NULL,0,0,NULL,'TRANSFER TO SOLANA - Roxas'),
      ('Prime Motors Solana','TM150T','09/15/2025','ROXAS ISABELA',NULL,'11586',NULL,'MONARCH','P1 BOLT 150','BLACK/SILVER','1P57MJS1121652','LX8TDK8G3SB001048','NO PNPC',1,0,NULL,0,0,NULL,'TRANSFER TO SOLANA - Roxas'),
      ('Prime Motors Solana','TM150T','09/15/2025','ROXAS ISABELA',NULL,'11586',NULL,'MONARCH','P1 BOLT 150','BLACK/SILVER','1P57MJS1121607','LX8TDK8G7SB001005','NO PNPC',1,0,NULL,0,0,NULL,'TRANSFER TO SOLANA - Roxas'),
      ('Prime Motors Solana','TM150T','09/27/2025','TUGUEGARAO',NULL,'11649',NULL,'MONARCH','P1 BOLT 150','BROWN/SILVER','1P57MJS1227298','LX8TDK8G5SB001567','AVAILABLE',1,0,NULL,0,0,NULL,'TRANSFER TUGUEGARAO TO SOLANA'),
      ('Prime Motors Solana','TM150T','09/27/2025','TUGUEGARAO',NULL,'11649',NULL,'MONARCH','P1 BOLT 150','BROWN/SILVER','1P57MJS1227292','LX8TDK8G7SB001599','AVAILABLE',1,0,NULL,0,0,NULL,'TRANSFER TUGUEGARAO TO SOLANA'),
      ('Prime Motors Solana','TM150T','09/27/2025','TUGUEGARAO',NULL,'11649',NULL,'MONARCH','P1 BOLT 150','BROWN/SILVER','1P57MJS1227296','LX8TDK8G0SB001587','AVAILABLE',1,0,NULL,0,0,NULL,'TRANSFER TUGUEGARAO TO SOLANA'),
      ('Prime Motors Solana','TM150T','09/27/2025','TUGUEGARAO',NULL,'11644',NULL,'MONARCH','P1 BOLT 150','BROWN/SILVER','1P57MJS1227343','LX8TDK8G5SB001603','AVAILABLE',1,0,NULL,0,0,NULL,'TRANSFER TUGUEGARAO TO SOLANA'),
      ('Prime Motors Solana','TM150T','09/27/2025','TUGUEGARAO',NULL,'11650',NULL,'MONARCH','P1 BOLT 150','BROWN/SILVER','1P57MJS1227325','LX8TDK8GXSB001595','AVAILABLE',1,0,NULL,0,0,NULL,'TRANSFER TUGUEGARAO TO SOLANA'),
      ('Prime Motors Solana','TM150T','09/27/2025','TUGUEGARAO',NULL,'11649',NULL,'MONARCH','P1 BOLT 150','BROWN/SILVER','1P57MJS1227320','LX8TDK8G4SB001592','AVAILABLE',1,0,NULL,0,0,NULL,'TRANSFER TUGUEGARAO TO SOLANA'),
      ('Prime Motors Solana','TM150T','09/27/2025','TUGUEGARAO',NULL,'11649',NULL,'MONARCH','P1 BOLT 150','BROWN/SILVER','1P57MJS1227324','LX8TDK8G8SB001594','AVAILABLE',1,0,NULL,0,0,NULL,'TRANSFER TUGUEGARAO TO SOLANA'),
      ('Prime Motors Solana','TM150T','09/27/2025','TUGUEGARAO',NULL,'11649',NULL,'MONARCH','P1 BOLT 150','BROWN/SILVER','1P57MJS1227333','LX8TDK8G3SB001597','AVAILABLE',1,0,NULL,0,0,NULL,'TRANSFER TUGUEGARAO TO SOLANA'),
      ('Prime Motors Solana','TM150T','09/27/2025','TUGUEGARAO',NULL,'11644',NULL,'MONARCH','P1 BOLT 150','BROWN/SILVER','1P57MJS1227355','LX8TDK8G9SB001605','AVAILABLE',1,0,NULL,0,0,NULL,'TRANSFER TUGUEGARAO TO SOLANA'),
      ('Prime Motors Solana','TM150T','09/27/2025','TUGUEGARAO',NULL,'11650',NULL,'MONARCH','P1 BOLT 150','BROWN/SILVER','1P57MJS1227321','LX8TDK8GXSB001564','AVAILABLE',1,0,NULL,0,0,NULL,'TRANSFER TUGUEGARAO TO SOLANA'),
      ('Prime Motors Solana','TM150T','09/27/2025','TUGUEGARAO',NULL,'11649',NULL,'MONARCH','P1 BOLT 151','BROWN/SILVER','1P57MJS1227318','LX8TDK8G0SB001590','AVAILABLE',1,0,NULL,0,0,NULL,'TRANSFER TUGUEGARAO TO SOLANA'),
      ('Prime Motors Solana','TM150T','09/27/2025','TUGUEGARAO',NULL,'11649',NULL,'MONARCH','P1 BOLT 151','BROWN/SILVER','1P57MJS1227381','LX8TDK8G1SB001615','AVAILABLE',1,0,NULL,0,0,NULL,'TRANSFER TUGUEGARAO TO SOLANA')
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
      -- normalize and validate date_received (support YY and YYYY)
      IF r.date_received IS NULL OR trim(r.date_received) = '' THEN
        parsed_date := CURRENT_DATE;
      ELSIF r.date_received ~ '^[0-9]{1,2}/[0-9]{1,2}/[0-9]{4}$' THEN
        parsed_date := to_date(r.date_received, 'MM/DD/YYYY');
      ELSIF r.date_received ~ '^[0-9]{1,2}/[0-9]{1,2}/[0-9]{2}$' THEN
        parsed_date := (to_date(r.date_received, 'MM/DD/YY') + interval '2000 years')::date;
      ELSE
        -- fallback, use current date and raise notice for manual inspection
        parsed_date := CURRENT_DATE;
        RAISE NOTICE 'Unrecognized date format for row: %, using CURRENT_DATE', r.date_received;
      END IF;

      -- clean engine/chassis: remove whitespace
      clean_engine := NULLIF(regexp_replace(coalesce(r.engine_no, ''), '\\s+', '', 'g'), '');
      clean_chassis := NULLIF(regexp_replace(coalesce(r.chassis_no, ''), '\\s+', '', 'g'), '');

      -- resolve branch
      SELECT id INTO br_id FROM branches WHERE name ILIKE '%' || r.branch || '%' LIMIT 1;
      IF br_id IS NULL THEN
        INSERT INTO branches (name) VALUES (r.branch) RETURNING id INTO br_id;
      END IF;

      -- resolve supplier (fuzzy first-word match)
      SELECT id INTO sup_id FROM suppliers WHERE name ILIKE '%' || split_part(coalesce(r.supplier, ''), ' ', 1) || '%' LIMIT 1;
      IF sup_id IS NULL THEN
        INSERT INTO suppliers (name, tin_number, created_at) VALUES (coalesce(r.supplier, ''), coalesce(r.details, ''), NOW()) RETURNING id INTO sup_id;
      END IF;

      -- resolve item (model+brand first, then item_no)
      SELECT id INTO item_id FROM items WHERE model ILIKE r.model AND brand ILIKE '%' || r.brand || '%' LIMIT 1;
      IF item_id IS NULL THEN
        SELECT id INTO item_id FROM items WHERE item_no ILIKE '%' || r.item_no || '%' LIMIT 1;
      END IF;
      IF item_id IS NULL THEN
        -- create minimal item if not found
        INSERT INTO items (item_no, brand, model, color, created_at) VALUES (coalesce(r.item_no,''), coalesce(r.brand,''), coalesce(r.model,''), ARRAY[coalesce(r.color,'')], NOW()) RETURNING id INTO item_id;
      END IF;

      -- determine sold / transfer flags
      IF r.ending_inv IS NOT NULL AND r.ending_inv = 0 THEN
        sold_qty := 1;
      ELSE
        sold_qty := 0;
      END IF;
      -- Check for transfer indicators: purchased=0, transfer column, details field, or remarks indicate transfer TO Solana
      -- All rows with ANY transfer indication should go to transferred_history
      IF COALESCE(r.purchased, 1) = 0
         OR (r.transfer IS NOT NULL AND trim(r.transfer) <> '' AND trim(r.transfer) <> '-')
         OR (r.details IS NOT NULL AND lower(trim(r.details)) LIKE '%transfer%')
         OR (r.remarks IS NOT NULL AND lower(trim(r.remarks)) LIKE '%transfer%') THEN
        trans_qty := 1;
      ELSE
        trans_qty := 0;
      END IF;

    -- skip if unit already exists (by engine_no OR chassis_no) in active units OR transferred history
    IF (clean_engine IS NOT NULL AND (
        EXISTS(SELECT 1 FROM vehicle_units v WHERE v.engine_no = clean_engine)
      OR EXISTS(SELECT 1 FROM transferred_history th WHERE th.engine_no = clean_engine)
      ))
      OR (clean_chassis IS NOT NULL AND (
        EXISTS(SELECT 1 FROM vehicle_units v WHERE v.chassis_no = clean_chassis)
      OR EXISTS(SELECT 1 FROM transferred_history th WHERE th.chassis_no = clean_chassis)
      )) THEN
      -- If it exists in active units, update the corresponding inventory movement for freshness
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

        -- insert vehicle unit tied to the inventory movement (use cleaned engine/chassis)
        INSERT INTO vehicle_units (inventory_id, chassis_no, engine_no, unit_number, created_at)
        VALUES (inv_id, clean_chassis, clean_engine, 1, NOW());
      END IF;

    END;
  END LOOP;
END;
$$;

-- Summary of inserted units for verification
SELECT v.id, v.engine_no, v.chassis_no, b.name AS branch, i.item_no, im.date_received, im.ending_qty, im.remarks
FROM vehicle_units v
JOIN inventory_movements im ON im.id = v.inventory_id
JOIN branches b ON b.id = im.branch_id
JOIN items i ON i.id = im.item_id
WHERE b.name ILIKE '%Solana%' AND im.created_at > now() - interval '1 hour'
ORDER BY v.id;
