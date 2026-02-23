-- Seeder for Prime Motors Aurora (minimal seed)
-- Inserts the highlighted unit(s) for Aurora. Detects transfers by looking at purchased/transfer/remarks fields.

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
      ('OMNI125','09/27/2025','SKYGO MARKETING CORP','225-520-539-00000','11586',NULL,'SKYGO','OMNI 125','GRAY','1P52QM1STC00257','LWMTJV1C4ST000257','Available',NULL,NULL,'DELIVERED',NULL,NULL,'10/01/2025','RELEASED'),
      ('SG150-L','09/27/2025','SKYGO MARKETING CORP','225-520-539-00000','11330','3142','SKYGO','M1 LANCE 150','WHITE','1P57MJS1067190','LX8TDK8U3SB000147','Available',NULL,NULL,'DELIVERED','JOHNMERRICK S. LIGAD',NULL,'10/01/2025','RELEASED'),
      ('TM 175','09/27/2025','SKYGO MARKETING CORP','225-520-539-00000','11345','3157','SKYGO','MONARCH 175','BLUE','162FMKN5158583','LX8PCL504NE012760','Available',NULL,NULL,'DELIVERED','DIONICIO JR. APELLIDO',NULL,'10/01/2025','RELEASED'),
      ('OMNI125','09/27/2025','SKYGO MARKETING CORP','225-520-539-00000','11586',NULL,'SKYGO','OMNI 125','GRAY','1P52QM1STC00246','LWMTJV1CXST000246','Available',NULL,NULL,'DELIVERED','FROILAN ENRIQUEZ MARCOS',NULL,'10/01/2025','RELEASED'),
      ('TM150T','09/27/2025','SKYGO MARKETING CORP','132-137-424-00000','11640',NULL,'SKYGO','P1 BOLT 150','BLACK/SILVER','1P57MJS1227234','LX8TDK8G6SB001481','Available',NULL,NULL,'DELIVERED','ELJON SANTIAGO BASILIO',NULL,'10/01/2025','RELEASED'),
      ('OMNI125','09/27/2025','SKYGO MARKETING CORP','225-520-539-00000','11586',NULL,'SKYGO','OMNI 125','GRAY','1P52QM1STC00296','LWMTJV1C3ST000296','Available',NULL,NULL,'DELIVERED','EDIE GONZALES UBAY',NULL,'10/01/2025','RELEASED'),
      ('SG150-L','09/27/2025','SKYGO MARKETING CORP','225-520-539-00000','11566',NULL,'SKYGO','M1 LANCE 150','WHITE/GOLD','1P57MJR1297973','LX8TDK8U1RB001100','Available',NULL,NULL,'DELIVERED','ARIES ANGALA DOLOR',NULL,'10/02/2025','RELEASED'),
      ('TM150T','09/27/2025','SKYGO MARKETING CORP','132-137-424-00000','11640',NULL,'SKYGO','P1 BOLT 150','BROWN/SILV','1P57MJS1227322','LX8TDK8G1SB001565','Available',NULL,NULL,'DELIVERED','ARR JAY PAGUIRIGAN BAUTISTA',NULL,'10/18/2025','RELEASED'),
      ('TM150T','09/27/2025','SKYGO MARKETING CORP','225-520-539-00000','11586',NULL,'SKYGO','P1 BOLT 150','BLACK/SILVER','1P57MJS1121620','LX8TDK8G1SB001050','Available',NULL,NULL,'DELIVERED','JOANATAN NACIONALES ILARDE',NULL,'10/24/2025','RELEASED'),
      ('TM150T','09/27/2025','SKYGO MARKETING CORP','225-520-539-00000','11586',NULL,'SKYGO','P1 BOLT 150','BLACK/SILVER','1P57MJS1121643','LX8TDK8G8SB001031','Available',NULL,NULL,'DELIVERED','ANTONIO JR MARTIN FRANCO',NULL,'10/13/2025','RELEASED'),
      ('TM 175','10/08/2025',NULL,NULL,'11345','3157','SKYGO','MONARCH 175','BLUE','162FMKN5158601','LX8PCL503NE012779','Available',NULL,NULL,'DELIVERED','RANIEL PARTIBLE CASTILLO',NULL,'10/17/2025','RELEASED'),
      ('TM 175','10/08/2025',NULL,NULL,'11346','3158','SKYGO','MONARCH 175','BLUE','162FMKN5158608','LX8PCL50XNE012780','Available',NULL,NULL,'DELIVERED','DARVIN RODRIGUEZ MARTINEZ',NULL,'10/30/2025','RELEASED'),
      ('TM175','10/11/2025','ROXAS, ISABELA',NULL,'11345',NULL,'MONARCH','MONARCH 175','RED','162FMKN5158762','LX8PCL505NE012945','Available at other Branch',1,NULL,'DELIVERED','MARIO VALDEZ ANCHETA',NULL,'10/14/2025','RELEASED'),
  ('TM175','10/11/2025','TRENDWELL MOTORS OPC','669-059-669-00000','11559',NULL,'MONARCH','MONARCH 175','RED','162FMKS5106720','LX8PCL500SE007941','Available',1,NULL,'TRANSFER',NULL,1,'10/20/2025','TRANSFER'),
      ('TM125','10/11/2025','TRENDWELL MOTORS OPC','669-059-669-00000','11559',NULL,'MONARCH','MONARCH 125','RED','156FMI2S5106275','LX8PCJ505SE003775','Available',1,NULL,'DELIVERED','HEHERSON SERRANO MIRANDA',NULL,'10/23/2025','RELEASED'),
      ('TM125','10/11/2025','TRENDWELL MOTORS OPC','669-059-669-00000','11559',NULL,'MONARCH','MONARCH 125','BLUE','156FMI2S5106327','LX8PCJ509SE003827','Available',1,NULL,'DELIVERED','GLAIZA CORPUZ BERNARDINO',NULL,'10/27/2025','RELEASED'),
      ('WM125','10/11/2025','TRENDWELL MOTORS OPC',NULL,'11370',NULL,'MONARCH','OMNI 125','NIGHT GRAY','1P52QMIRTC01479','LWMTJV1C2RT001479','Available at other Branch',1,NULL,'DELIVERED','NANCY BALIGOD MANGADAP',NULL,'10/20/2025','RELEASED'),
      ('TM125','10/16/2025',NULL,NULL,'11449',NULL,'MONARCH','TM125','RED','156FMI2S5106221','LX8PCJ504SE003721','AVAILABLE',NULL,NULL,'DELIVERED','SERIO DOLAY BAGARA',NULL,NULL,'RELEASED'),
      ('TM150T','10/18/2025','TMOPC-BATAAN',NULL,'11649',NULL,'MONARCH','BOLT150','BROWN/SILVER','1P57MJS1227315','LX8TDK8G6SB001562','AVAILABLE',NULL,NULL,'DELIVERED','WILSON JR. BALDERAMOS BERGONIA',NULL,NULL,'RELEASED'),
      ('SG150-L','10/23/2025','SKYGO MARKETING CORP','225-520-539-00000','012969',NULL,'SKYGO','M1 LANCE 150','WHITE/GOLD','1P57MJR1297897','LX8TDK8U3RB001017','Available',NULL,NULL,'DELIVERED','LESTER VISAYA ATIENZA',NULL,'10/28/2025','RELEASED'),
      ('OMNI125','10/23/2025','SKYGO MARKETING CORP','225-520-539-00000','012969',NULL,'MONARCH','OMNI 125','DARK BLUE','1P52QMISTC00499','LWMTJV1C6ST000499','Available',NULL,NULL,'EXISTING UNIT',NULL,NULL,NULL,'EXISTING UNIT'),
      ('TM150T','10/24/2025','SKYGO MARKETING CORP','132-137-424-00000','11640',NULL,'SKYGO','P1 BOLT 150','BROWN/SILV','1P57MJS1227238','LX8TDK8G9SB001572','Available',NULL,NULL,'EXISTING UNIT',NULL,NULL,NULL,'EXISTING UNIT'),
      ('TM150T','10/24/2025','SKYGO MARKETING CORP','132-137-424-00000','11640',NULL,'SKYGO','P1 BOLT 150','BLACK/SILV','1P57MJS1227011','LX8TDK8G2SB001428','Available',NULL,NULL,'EXISTING UNIT',NULL,NULL,NULL,'EXISTING UNIT'),
      ('OMNI125','10/24/2025','SKYGO MARKETING CORP','225-520-539-00000','012970',NULL,'SKYGO','OMNI 125','SILVER GRAY','1P52QMIRTC01390','LWMTJV1C8RT001390','Available',NULL,NULL,'EXISTING UNIT',NULL,NULL,NULL,'EXISTING UNIT'),
      ('TM175','10/24/2025','SKYGO MARKETING CORP','225-520-539-00000','012968',NULL,'MONARCH','MONARCH 175','RED','162FMKS5106895','LX8PCL507SE008116','Available',NULL,NULL,'DELIVERED',NULL,NULL,'10/24/2025','RELEASED'),
      ('SG150T-8U','10/29/2025','SKYGO MARKETING CORP','225-520-539-00000','012970',NULL,'SKYGO','M1 LANCE 150','BLACK/GOLD','1P57MJS1067227','LX8TDK8U6SB000191','Available',NULL,NULL,'DELIVERED',NULL,NULL,'10/29/2025','RELEASED'),
      ('TM175','10/31/2025','SKYGO MARKETING CORP','225-520-539-00000','012967',NULL,'MONARCH','MONARCH 175','BLUE','162FMKS5106974','LX8PCL507SE008195','Available',NULL,NULL,'DELIVERED',NULL,NULL,'10/31/2025','RELEASED')
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

      -- determine transfer flag from purchased/transfer/remarks fields
      IF (r.purchased IS NOT NULL AND lower(r.purchased::text) LIKE '%transfer%')
         OR (r.transfer IS NOT NULL AND lower(r.transfer::text) LIKE '%transfer%')
         OR (r.remarks IS NOT NULL AND lower(r.remarks::text) LIKE '%transfer%') THEN
        trans_flag := true;
      ELSE
        trans_flag := false;
      END IF;

      -- resolve Aurora branch
      SELECT id INTO br_id FROM branches WHERE name ILIKE '%aurora%' LIMIT 1;
      IF br_id IS NULL THEN
        INSERT INTO branches (name, address, created_at) VALUES ('Prime Motors Aurora', 'National Highway, Brgy. San Jose, Aurora, Isabela', NOW()) RETURNING id INTO br_id;
      END IF;

      -- supplier
      IF r.supplier IS NOT NULL AND trim(r.supplier) <> '' THEN
        SELECT id INTO sup_id FROM suppliers WHERE name ILIKE '%' || split_part(r.supplier, ' ', 1) || '%' LIMIT 1;
        IF sup_id IS NULL THEN
          INSERT INTO suppliers (name, tin_number, created_at) VALUES (r.supplier, r.tin, NOW()) RETURNING id INTO sup_id;
        END IF;
      END IF;

      -- item: try normalized item_no, then model+brand, else insert
      SELECT id INTO item_id FROM items WHERE item_no ILIKE norm_item_no LIMIT 1;
      IF item_id IS NULL THEN
        SELECT id INTO item_id FROM items WHERE model ILIKE r.model AND brand ILIKE '%' || r.brand || '%' LIMIT 1;
      END IF;
      IF item_id IS NULL THEN
        INSERT INTO items (item_no, brand, model, color, created_at) VALUES (norm_item_no, r.brand, r.model, ARRAY[coalesce(r.color, '')], NOW()) RETURNING id INTO item_id;
      END IF;

      -- sold flag
      IF r.ending_inv IS NOT NULL AND CAST(r.ending_inv AS TEXT) ~ '^[0-9]+$' AND CAST(r.ending_inv AS INT) = 0 THEN
        sold_qty := 1;
      ELSE
        sold_qty := 0;
      END IF;

      -- allow duplicates: detect if a vehicle with same engine or chassis already exists
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

      -- If a duplicate exists we will still insert, but force trans_flag = false
      -- (data owner requested duplicates be included but not marked transferred)
      final_transferred := CASE WHEN exists_dup THEN false ELSE trans_flag END;

      -- Route based on final_transferred: if true -> transferred_history, else -> active inventory
      IF final_transferred THEN
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
        RAISE NOTICE 'Inserted Aurora vehicle to transferred_history: chassis=% engine=% (orig_trans_flag=%)', clean_chassis, clean_engine, trans_flag;
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

        RAISE NOTICE 'Inserted Aurora vehicle to active inventory: chassis=% engine=% (orig_trans_flag=%)', clean_chassis, clean_engine, trans_flag;
      END IF;

    END;
  END LOOP;
END;
$$;

-- verification: show recent Aurora inserts
SELECT v.id, v.engine_no, v.chassis_no, v.transferred, im.date_received, im.ending_qty, im.remarks
FROM vehicle_units v
JOIN inventory_movements im ON im.id = v.inventory_id
JOIN branches b ON b.id = im.branch_id
WHERE b.name ILIKE '%aurora%'
  AND im.created_at > now() - interval '24 hour'
ORDER BY v.id;
