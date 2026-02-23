-- Seeder for Roxas inventory
-- Rules:
-- - Normalize item_no (remove spaces): 'TM 175' -> 'TM175'
-- - If Transfer column contains a non-empty destination (not '#VALUE!' and not '-'), mark inserted vehicle_units.transferred = true (these units are not present at Roxas)
-- - Insert inventory_movements and vehicle_units for each row; allow duplicates (consistent with Baggao policy)

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      -- item_no, date_received, supplier, tin, dr_no, si_no, brand, model, color, engine_no, chassis_no, pnpc_status, beg_inv, purchased, transfer, sales, ending_inv, note_date, remarks
      ('TM 175','8/5/2025','SKYGO MARKETING CORP','225-520-539-00000','11345','3157','SKYGO','MONARCH 175','BLUE','162FMKN5158599','LX8PCL501NE012778','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('TM 175','8/5/2025','SKYGO MARKETING CORP','225-520-539-00000','11345','3157','SKYGO','MONARCH 175','BLUE','162FMKN5158601','LX8PCL503NE012779','Available',NULL,'1','AURORA',NULL,'#VALUE!',NULL,'-'),
      ('TM 175','8/5/2025','SKYGO MARKETING CORP','225-520-539-00000','11345','3157','SKYGO','MONARCH 175','BLUE','162FMKN5158583','LX8PCL504NE012760','Available',NULL,'1','AURORA',NULL,'#VALUE!',NULL,'-'),
      ('TM 175','8/5/2025','SKYGO MARKETING CORP','225-520-539-00000','11345','3157','SKYGO','MONARCH 175','RED','162FMKN5158790','LX8PCL502NE012966','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('TM 175','8/5/2025','SKYGO MARKETING CORP','225-520-539-00000','11345','3157','SKYGO','MONARCH 175','RED','162FMKN5158762','LX8PCL505NE012945','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('TM 175','8/5/2025','SKYGO MARKETING CORP','225-520-539-00000','11346','3158','SKYGO','MONARCH 175','RED','162FMKN5158749','LX8PCL500NE012934','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('TM 175','8/5/2025','SKYGO MARKETING CORP','225-520-539-00000','11346','3158','SKYGO','MONARCH 175','RED','162FMKN5158769','LX8PCL500NE012948','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('TM 175','8/5/2025','SKYGO MARKETING CORP','225-520-539-00000','11346','3158','SKYGO','MONARCH 175','RED','162FMKN5158775','LX8PCL507NE012946','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('TM 175','8/5/2025','SKYGO MARKETING CORP','225-520-539-00000','11346','3158','SKYGO','MONARCH 175','BLUE','162FMKN5158585','LX8PCL506NE012761','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('TM 175','8/5/2025','SKYGO MARKETING CORP','225-520-539-00000','11346','3158','SKYGO','MONARCH 175','BLUE','162FMKN5158608','LX8PCL50XNE012780','Available',NULL,'1','AURORA',NULL,NULL,NULL,'-'),
      ('TM 175','8/5/2025','SKYGO MARKETING CORP','225-520-539-00000','11346','3158','SKYGO','MONARCH 175','BLACK','162FMKN5158469','LX8PCL501NE012649','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('TM 175','8/5/2025','SKYGO MARKETING CORP','225-520-539-00000','11346','3158','SKYGO','MONARCH 175','BLACK','162FMKN5158470','LX8PCL501NE012652','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('TM 175','8/5/2025','SKYGO MARKETING CORP','225-520-539-00000','11346','3158','SKYGO','MONARCH 175','BLACK','162FMKN5158471','LX8PCL503NE012653','Available',NULL,'1','ROMEL P. RAQUINE',NULL,NULL,'10/08/2025','-'),
      ('TM 175','8/5/2025','SKYGO MARKETING CORP','225-520-539-00000','11346','3158','SKYGO','MONARCH 175','BLACK','162FMKN5158477','LX8PCL50XNE012648','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('TM 175','8/5/2025','SKYGO MARKETING CORP','225-520-539-00000','11346','3158','SKYGO','MONARCH 175','BLACK','162FMKN5158478','LX8PCL50XNE012651','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('TM 175','8/5/2025','SKYGO MARKETING CORP','225-520-539-00000','11347','3159','SKYGO','MONARCH 175','BLUE','162FMKN5158600','LX8PCL501NE012781','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('TM 175','8/5/2025','SKYGO MARKETING CORP','225-520-539-00000','11347','3159','SKYGO','MONARCH 175','BLUE','162FMKN5158602','LX8PCL503NE012782','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('TM 175','8/5/2025','SKYGO MARKETING CORP','225-520-539-00000','11347','3159','SKYGO','MONARCH 175','RED','162FMKN5158803','LX8PCL505NE012976','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('TM 175','8/5/2025','SKYGO MARKETING CORP','225-520-539-00000','11347','3159','SKYGO','MONARCH 175','RED','162FMKN5158804','LX8PCL506NE012985','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('TM 175','8/5/2025','SKYGO MARKETING CORP','225-520-539-00000','11347','3159','SKYGO','MONARCH 175','RED','162FMKN5158787','LX8PCL509NE012964','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      -- TM150T rows
      ('TM150T','8/5/2025','SKYGO MARKETING CORP','225-520-539-00000','11327','3139','SKYGO','P1 BOLT 150','BROWN/SILV','1P57MJS1120537','LX8TDK8G1SB000805','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('TM150T','8/5/2025','SKYGO MARKETING CORP','225-520-539-00000','11329','3141','SKYGO','P1 BOLT 150','BROWN/SILV','1P57MJS1120625','LX8TDK8G2SB000893','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('TM150T','8/5/2025','SKYGO MARKETING CORP','225-520-539-00000','11329','3141','SKYGO','P1 BOLT 150','BROWN/SILV','1P57MJS1120623','LX8TDK8G6SB000900','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      -- SG150-L rows
      ('SG150-L','8/5/2025','SKYGO MARKETING CORP','225-520-539-00000','11328','3140','SKYGO','M1 LANCE 150','BLACK','1P57MJS1067202','LX8TDK8U4SB000187','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('SG150-L','8/5/2025','SKYGO MARKETING CORP','225-520-539-00000','11328','3140','SKYGO','M1 LANCE 150','BLACK','1P57MJS1067204','LX8TDK8U6SB000188','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('SG150-L','8/5/2025','SKYGO MARKETING CORP','225-520-539-00000','11330','3142','SKYGO','M1 LANCE 150','WHITE','1P57MJS1067190','LX8TDK8U3SB000147','Available',NULL,'1','AURORA',NULL,'#VALUE!',NULL,'-'),
      ('SG150-L','8/5/2025','SKYGO MARKETING CORP','225-520-539-00000','11330','3142','SKYGO','M1 LANCE 150','WHITE','1P57MJS1067191','LX8TDK8U5SB000148','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('SG150-L','8/5/2025','SKYGO MARKETING CORP','225-520-539-00000','11330','3142','SKYGO','M1 LANCE 150','WHITE','1P57MJS1067208','LX8TDK8U9SB000153','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      -- Additional TM 175 dated 8/15 and later
      ('TM 175','8/15/2025','SKYGO MARKETING CORP','132-137-424-00000','11472',NULL,'SKYGO','MONARCH 175','BLACK','162FMKN5158481','LX8PCL502NE012658','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('TM 175','8/15/2026','SKYGO MARKETING CORP','132-137-424-00000','11472',NULL,'SKYGO','MONARCH 175','BLACK','162FMKN5158484','LX8PCL504NE012662','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('TM 175','8/15/2027','SKYGO MARKETING CORP','132-137-424-00000','11472',NULL,'SKYGO','MONARCH 175','BLACK','162FMKN5158486','LX8PCL508NE012664','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('TM 175','8/15/2028','SKYGO MARKETING CORP','132-137-424-00000','11472',NULL,'SKYGO','MONARCH 175','BLACK','162FMKN5158487','LX8PCL509NE012656','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('TM 175','8/15/2029','SKYGO MARKETING CORP','132-137-424-00000','11472',NULL,'SKYGO','MONARCH 175','BLACK','162FMKN5158488','LX8PCL50XNE012665','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      -- TM150T 9/15 batch
      ('TM150T','9/15/2025','SKYGO MARKETING CORP','225-520-539-00000','11586',NULL,'SKYGO','P1 BOLT 150','BROWN/SILV','1P57MJS1118476','LX8TDK8G3SB000661','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('TM150T','9/15/2025','SKYGO MARKETING CORP','225-520-539-00000','11586',NULL,'SKYGO','P1 BOLT 150','BLACK/SILVER','1P57MJS1121620','LX8TDK8G1SB001050','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('TM150T','9/15/2025','SKYGO MARKETING CORP','225-520-539-00000','11586',NULL,'SKYGO','P1 BOLT 150','BLACK/SILVER','1P57MJS1121605','LX8TDK8G3SB001003','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('TM150T','9/15/2025','SKYGO MARKETING CORP','225-520-539-00000','11586',NULL,'SKYGO','P1 BOLT 150','BLACK/SILVER','1P57MJS1121652','LX8TDK8G3SB001048','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('TM150T','9/15/2025','SKYGO MARKETING CORP','225-520-539-00000','11586',NULL,'SKYGO','P1 BOLT 150','BLACK/SILVER','1P57MJS1121618','LX8TDK8G4SB001009','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('TM150T','9/15/2025','SKYGO MARKETING CORP','225-520-539-00000','11586',NULL,'SKYGO','P1 BOLT 150','BLACK/SILVER','1P57MJS1121606','LX8TDK8G5SB001004','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('TM150T','9/15/2025','SKYGO MARKETING CORP','225-520-539-00000','11586',NULL,'SKYGO','P1 BOLT 150','BLACK/SILVER','1P57MJS1121648','LX8TDK8G6SB001044','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('TM150T','9/15/2025','SKYGO MARKETING CORP','225-520-539-00000','11586',NULL,'SKYGO','P1 BOLT 150','BLACK/SILVER','1P57MJS1121607','LX8TDK8G7SB001005','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('TM150T','9/15/2025','SKYGO MARKETING CORP','225-520-539-00000','11586',NULL,'SKYGO','P1 BOLT 150','BLACK/SILVER','1P57MJS1121621','LX8TDK8G7SB001019','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('TM150T','9/15/2025','SKYGO MARKETING CORP','225-520-539-00000','11586',NULL,'SKYGO','P1 BOLT 150','BLACK/SILVER','1P57MJS1121631','LX8TDK8G8SB001014','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('TM150T','9/15/2025','SKYGO MARKETING CORP','225-520-539-00000','11586',NULL,'SKYGO','P1 BOLT 150','BLACK/SILVER','1P57MJS1121643','LX8TDK8G8SB001031','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('TM150T','9/15/2025','SKYGO MARKETING CORP','225-520-539-00000','11586',NULL,'SKYGO','P1 BOLT 150','BLACK/SILVER','1P57MJS1121603','LX8TDK8GXSB001001','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      -- OMNI125 9/15
      ('OMNI125','9/15/2025','SKYGO MARKETING CORP','225-520-539-00000','11586',NULL,'SKYGO','OMNI 125','GRAY','1P52QM1STC00296','LWMTJV1C3ST000296','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('OMNI125','9/15/2025','SKYGO MARKETING CORP','225-520-539-00000','11586',NULL,'SKYGO','OMNI 125','GRAY','1P52QM1STC00296','LWMTJV1C3ST000296','Available',NULL,'1','AURORA',NULL,'#VALUE!',NULL,'-'),
      ('OMNI125','9/15/2025','SKYGO MARKETING CORP','225-520-539-00000','11586',NULL,'SKYGO','OMNI 125','GRAY','1P52QM1STC00246','LWMTJV1CXST000246','Available',NULL,'1','AURORA',NULL,NULL,NULL,'-'),
      -- TM150T 9/26 and 9/27 batches (truncated to entries from your paste)
      ('TM150T','9/26/2025','SKYGO MARKETING CORP','132-137-424-00000','11640',NULL,'SKYGO','P1 BOLT 150','BROWN/SILV','1P57MJS1227340','LX8TDK8G1SB001582','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('TM150T','9/26/2025','SKYGO MARKETING CORP','132-137-424-00000','11640',NULL,'SKYGO','P1 BOLT 150','BLACK/SILV','1P57MJS1227011','LX8TDK8G2SB001428','Available',NULL,'1','AURORA',NULL,NULL,NULL,'-'),
      ('TM150T','9/26/2025','SKYGO MARKETING CORP','132-137-424-00000','11640',NULL,'SKYGO','P1 BOLT 150','BLACK/SILV','1P57MJS1226932','LX8TDK8G3SB001387','Available',NULL,'1','TRANSFER/CAUAYAN',NULL,NULL,NULL,'-'),
      ('TM150T','9/26/2025','SKYGO MARKETING CORP','132-137-424-00000','11640',NULL,'SKYGO','P1 BOLT 150','BROWN/SILV','1P57MJS1227291','LX8TDK8G3SB001583','Available',NULL,'1',NULL,NULL,'1',NULL,'-'),
      ('TM150T','9/26/2025','SKYGO MARKETING CORP','132-137-424-00000','11640',NULL,'SKYGO','P1 BOLT 150','BLACK/SILV','1P57MJS1227010','LX8TDK8G6SB001447','Available',NULL,'1','TRANSFER/TUMAUINI',NULL,NULL,NULL,'-'),
      -- TM150T 9/27 sample
      ('TM150T','9/27/2025','SKYGO MARKETING CORP','132-137-424-00000','11640',NULL,'SKYGO','P1 BOLT 150','BROWN/SILV','1P57MJS1227309','LX8TDK8G0SB001556','Available',NULL,'1',NULL,NULL,'1',NULL,'TUMAUINI'),
      ('TM150T','9/27/2025','SKYGO MARKETING CORP','132-137-424-00000','11640',NULL,'SKYGO','P1 BOLT 150','BROWN/SILV','1P57MJS1227329','LX8TDK8G0SB001573','Available',NULL,'1',NULL,NULL,'1',NULL,'TUMAUINI'),
      -- Recent TM175 / pickups
      ('TM 175','10/24/2025','SKYGO MARKETING CORP','132-137-424-00000','12967',NULL,'SKYGO','MONARCH 175','RED','162FMKS5106893','LX8PCL503SE008114','Available',NULL,'1',NULL,NULL,'1',NULL,'PICK UP/CAUAYAN'),
      ('TM 175','10/24/2025','SKYGO MARKETING CORP','132-137-424-00000','12968',NULL,'SKYGO','MONARCH 175','RED','162FMKS5106889','LX8PCL506SE008110','Available',NULL,'1',NULL,NULL,'1',NULL,'PICK UP/CAUAYAN'),
      ('TM 175','10/27/2025','SKYGO MARKETING CORP','132-137-424-00000','12968',NULL,'SKYGO','MONARCH 175','RED','162FMKS5106866','LX8PCL504SE008087','Available',NULL,'1',NULL,NULL,'1',NULL,'PICK UP/CAUAYAN'),
      ('TM 175','10/27/2025','SKYGO MARKETING CORP','132-137-424-00000','12968',NULL,'SKYGO','MONARCH 175','RED','162FMKS5106842','LX8PCL501SE008063','Available',NULL,'1',NULL,NULL,'1',NULL,'PICK UP/CAUAYAN'),
      ('TM 175','10/27/2025','SKYGO MARKETING CORP','132-137-424-00000','12968',NULL,'SKYGO','MONARCH 175','RED','162FMKS5106855','LX8PCL50XSE008076','Available',NULL,'1',NULL,NULL,'1',NULL,'PICK UP/CAUAYAN'),
      ('OMNI125','10/27/2025','SKYGO MARKETING CORP','132-137-424-00000','12970',NULL,'SKYGO','OMNI 125','GRAY','1P52QMISTC00287','LWMTJV1C2ST000287','Available',NULL,'1',NULL,NULL,'1',NULL,'PICK UP/CAUAYAN'),
      ('TM 125','10/28/2025','SKYGO MARKETING CORP','132-137-424-00000','11491',NULL,'SKYGO','MONARCH 125','BLUE','156FMI2S5106357','LX8PCJ507SE003857','Available',NULL,'1',NULL,NULL,'1',NULL,'PICKUP TO TUMAUINI'),
      ('TM 125','10/28/2025','SKYGO MARKETING CORP','132-137-424-00000','11559',NULL,'SKYGO','MONARCH 125','RED','156FMI2S5106274','LX8PCJ503SE003774','Available',NULL,'1',NULL,NULL,'1',NULL,'PICKUP TO TUMAUINI'),
      ('LANCE150','11/03/2025','SKYGO MARKETING CORP',NULL,NULL,NULL,'SKYGO','M1 LANCE 150','BLACK/GOLD','1P57MJS1067237','LX8TDK8U1SB000194','Available',NULL,'1',NULL,NULL,'1',NULL,'PICK UP/CAUAYAN')
    ) AS t(item_no, date_received, supplier, tin, dr_no, si_no, brand, model, color, engine_no, chassis_no, pnpc_status, beg_inv, purchased, transfer, sales, ending_inv, note_date, remarks)
  LOOP
    DECLARE
      br_id INT;
      sup_id INT;
      item_id INT;
      inv_id INT;
      sold_qty INT := 0;
      trans_flag BOOLEAN := false;
      normalized_item_no TEXT;
      transfer_dest TEXT;
    BEGIN
      -- normalize item_no (remove spaces) e.g. 'TM 175' -> 'TM175'
      normalized_item_no := regexp_replace(coalesce(r.item_no, ''), '\s+', '', 'g');

      -- determine transfer destination (treat '#VALUE!' and '-' as no transfer)
      IF r.transfer IS NOT NULL AND trim(r.transfer) <> '' AND trim(r.transfer) <> '#VALUE!' AND trim(r.transfer) <> '-' THEN
        transfer_dest := trim(r.transfer);
        trans_flag := true; -- transferred away, not physically at Roxas
      ELSE
        transfer_dest := NULL;
        trans_flag := false;
      END IF;

      -- resolve Roxas branch
      SELECT id INTO br_id FROM branches WHERE name ILIKE '%roxas%' LIMIT 1;
      IF br_id IS NULL THEN
        INSERT INTO branches (name) VALUES ('Prime Motors Roxas') RETURNING id INTO br_id;
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

      -- Route based on trans_flag: if true -> transferred_history, else -> active inventory
      IF trans_flag THEN
        -- This unit was transferred away from Roxas, goes to transferred_history
        INSERT INTO transferred_history (
          branch_id, item_id, date_received, supplier_id, dr_no, si_no, cost,
          beginning_qty, purchased_qty, transferred_qty, sold_qty, ending_qty,
          color, srp, remarks, unit_created_at, chassis_no, engine_no, unit_number, unit_status
        )
        VALUES (
          br_id,
          item_id,
          CASE WHEN r.date_received IS NOT NULL THEN to_date(r.date_received, 'MM/DD/YYYY') ELSE CURRENT_DATE END,
          sup_id,
          r.dr_no,
          r.si_no,
          COALESCE((SELECT cost_of_purchase FROM items WHERE id = item_id), (SELECT srp FROM items WHERE id = item_id), 0),
          CASE WHEN r.beg_inv IS NOT NULL AND CAST(r.beg_inv AS TEXT) ~ '^[0-9]+$' THEN CAST(r.beg_inv AS INT) ELSE 1 END,
          CASE WHEN r.purchased IS NOT NULL AND CAST(r.purchased AS TEXT) ~ '^[0-9]+$' THEN CAST(r.purchased AS INT) ELSE 1 END,
          1,
          sold_qty,
          CASE WHEN r.ending_inv IS NOT NULL AND CAST(r.ending_inv AS TEXT) ~ '^[0-9]+$' THEN CAST(r.ending_inv AS INT) WHEN r.beg_inv IS NOT NULL AND CAST(r.beg_inv AS TEXT) ~ '^[0-9]+$' THEN CAST(r.beg_inv AS INT) ELSE 1 END,
          NULLIF(r.color, ''),
          (SELECT srp FROM items WHERE id = item_id),
          CASE WHEN transfer_dest IS NOT NULL THEN coalesce(r.remarks, '') || ' | Transfer to: ' || transfer_dest ELSE r.remarks END,
          NOW(),
          r.chassis_no,
          r.engine_no,
          1,
          'available'
        );
        RAISE NOTICE 'Inserted Roxas vehicle to transferred_history: chassis=% engine=% transfer_dest=%', r.chassis_no, r.engine_no, transfer_dest;
      ELSE
        -- Regular inventory movement + vehicle unit for active inventory at Roxas
        INSERT INTO inventory_movements (branch_id, item_id, date_received, supplier_id, dr_no, si_no, cost, beginning_qty, purchased_qty, transferred_qty, sold_qty, ending_qty, color, srp, remarks, created_at)
        VALUES (
          br_id,
          item_id,
          CASE WHEN r.date_received IS NOT NULL THEN to_date(r.date_received, 'MM/DD/YYYY') ELSE CURRENT_DATE END,
          sup_id,
          r.dr_no,
          r.si_no,
          COALESCE((SELECT cost_of_purchase FROM items WHERE id = item_id), (SELECT srp FROM items WHERE id = item_id), 0),
          CASE WHEN r.beg_inv IS NOT NULL AND CAST(r.beg_inv AS TEXT) ~ '^[0-9]+$' THEN CAST(r.beg_inv AS INT) ELSE 1 END,
          CASE WHEN r.purchased IS NOT NULL AND CAST(r.purchased AS TEXT) ~ '^[0-9]+$' THEN CAST(r.purchased AS INT) ELSE 1 END,
          0,
          sold_qty,
          CASE WHEN r.ending_inv IS NOT NULL AND CAST(r.ending_inv AS TEXT) ~ '^[0-9]+$' THEN CAST(r.ending_inv AS INT) WHEN r.beg_inv IS NOT NULL AND CAST(r.beg_inv AS TEXT) ~ '^[0-9]+$' THEN CAST(r.beg_inv AS INT) ELSE 1 END,
          NULLIF(r.color, ''),
          (SELECT srp FROM items WHERE id = item_id),
          r.remarks,
          NOW()
        ) RETURNING id INTO inv_id;

        INSERT INTO vehicle_units (inventory_id, chassis_no, engine_no, unit_number, created_at)
        VALUES (
          inv_id,
          r.chassis_no,
          r.engine_no,
          1,
          NOW()
        );

        RAISE NOTICE 'Inserted Roxas vehicle to active inventory: chassis=% engine=%', r.chassis_no, r.engine_no;
      END IF;

    END;
  END LOOP;
END;
$$;

-- Quick verification output for recent Roxas inserts
SELECT v.id, v.engine_no, v.chassis_no, v.transferred, im.branch_id, im.item_id, im.date_received, im.remarks
FROM vehicle_units v
JOIN inventory_movements im ON im.id = v.inventory_id
WHERE im.branch_id IN (SELECT id FROM branches WHERE name ILIKE '%roxas%')
  AND (im.created_at > now() - interval '24 hour' OR lower(coalesce(im.remarks, '')) LIKE '%roxas%')
ORDER BY v.id;
