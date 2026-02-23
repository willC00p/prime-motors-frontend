-- Idempotent seeder for Kamias branch vehicle inventory
-- Behavior:
--  - For each row: finds branch, supplier and item (by model then item_no), creates an inventory_movements row and a vehicle_units row
--  - Skips a row if a vehicle_unit with the same engine_no OR chassis_no already exists (idempotent)
--  - Sets purchased_qty=1, beginning_qty=1, ending_qty according to the source data
--  - If ending_qty = 0 then sold_qty = 1
--  - If remarks are present (and not just 'CASH SALE') transferred_qty = 1

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      -- branch, item_no, date_received, supplier, tin, dr_no, si_no, brand, model, color, engine_no, chassis_no, pnpc_status, beg_inv, purchased, transfer, sales, ending_inv, note_date, remarks
      ('KAMIAS','SG150T-L','6/23/2025','SKYGO MARKETING CORP','225-520-539-00000','2969','2969','SKYGO','M1 LANCE 150','WHITE/GOLD','1P57MJR1297908','LX8TDK8U5RB001035','Available',1,1,NULL,1,0,'10/7/2025',NULL),
      ('KAMIAS','SG150T-8G','6/23/2025','SKYGO MARKETING CORP','225-520-539-00000','2969','2969','SKYGO','P1 BOLT 150','BROWN/SILV','1P57MJR1341174','LX8TDK8G0RB002264','Available',1,1,NULL,1,0,'6/28/2025',NULL),
      ('KAMIAS','SG150T-8G','6/23/2025','SKYGO MARKETING CORP','225-520-539-00000','2969','2969','SKYGO','P1 BOLT 150','BROWN/SILV','1P57MJR1341803','LX8TDK8G0RB002412','Available',1,1,NULL,1,0,'7/5/2025',NULL),
      ('KAMIAS','SG150T-8G','6/23/2025','SKYGO MARKETING CORP','225-520-539-00000','2969','2969','SKYGO','P1 BOLT 150','BLACK/SILV','1P57MJS1062802','LX8TDK8G1SB000089','Available',1,1,NULL,1,0,'7/5/2025',NULL),
      ('KAMIAS','SG150T-8G','6/23/2025','SKYGO MARKETING CORP','225-520-539-00000','2969','2969','SKYGO','P1 BOLT 150','BLACK/SILV','1P57MJS1062811','LX8TDK8G2SB000098','Available',1,1,NULL,1,0,'7/1/2025',NULL),
      ('KAMIAS','SG150T-8U','6/23/2025','SKYGO MARKETING CORP','225-520-539-00000','2969','2969','SKYGO','M1 LANCE 150','BLACK/GOLD','1P57MJR1343560','LX8TDK8U6RB001450','Available',1,1,NULL,1,0,NULL,NULL),
      ('KAMIAS','SGT150T KL','7/4/2025','SKYGO MARKETING CORP','225-520-539-00000','2978','2978','SKYGO','KPV 150 KEYLESS','BLUE','1P57MJP1094560','LX8TDK806PA000766','Available',1,1,NULL,1,0,NULL,NULL),
      ('KAMIAS','SGT150T KL','7/4/2025','SKYGO MARKETING CORP','225-520-539-00000','2978','2978','SKYGO','KPV 150 KEYLESS','BLUE','1P57MJP1094523','LX8TDK808PA000834','Available',1,1,NULL,1,1,NULL,NULL),
      ('KAMIAS','WM125','7/4/2025','SKYGO MARKETING CORP','225-520-539-00000','2978','2978','SKYGO','OMNI 125','DARK BLUE','1P52QMIRTC01233','LWMTJV1C3RT001233','Available',1,1,NULL,1,0,NULL,NULL),
      ('KAMIAS','WM125','7/4/2025','SKYGO MARKETING CORP','225-520-539-00000','2978','2978','SKYGO','OMNI 125','DARK BLUE','1P52QMIRTC01245','LWMTJV1C3RT001245','Available',1,1,NULL,1,1,NULL,NULL),
      ('KAMIAS','TM150T','7/7/2025','SKYGO MARKETING CORP','225-520-539-00000','10892','3004','SKYGO','P1 BOLT 150','BROWN/SILVER','1P57MJS1118543','LX8TDK8G0SB000715','Available',1,1,NULL,1,0,'7/8/2025',NULL),
      ('KAMIAS','TM150T','7/7/2025','SKYGO MARKETING CORP','225-520-539-00000','10892','3004','SKYGO','P1 BOLT 150','BLACK/SILVER','1P57MJS1118535','LX8TDK8G1SB000917','Available',1,1,NULL,1,0,'7/31/2025',NULL),
      ('KAMIAS','TM150T','7/7/2025','SKYGO MARKETING CORP','225-520-539-00000','10892','3004','SKYGO','P1 BOLT 150','BLACK/SILVER','1P57MJS1121595','LX8TDK8G1SB000996','Available',1,1,NULL,1,0,NULL,'STA MESA'),
      ('KAMIAS','TM150T','7/7/2025','SKYGO MARKETING CORP','225-520-539-00000','10892','3004','SKYGO','P1 BOLT 150','BROWN/SILVER','1P57MJS1118535','LX8TDK8G3SB000711','Available',1,1,NULL,1,0,'7/22/2025',NULL),
      ('KAMIAS','TM150T','7/7/2025','SKYGO MARKETING CORP','225-520-539-00000','10892','3004','SKYGO','P1 BOLT 150','BLACK/SILVER','1P57MJS1121602','LX8TDK8G5SB000998','Available',1,1,NULL,1,0,NULL,'sta mesa'),
      ('KAMIAS','TM150T','7/7/2025','SKYGO MARKETING CORP','225-520-539-00000','10892','3004','SKYGO','P1 BOLT 150','BROWN/SILVER','1P57MJS1118525','LX8TDK8G7SB000727','Available',1,1,NULL,1,0,'7/20/2025',NULL),
      ('KAMIAS','TM150T','7/7/2025','SKYGO MARKETING CORP','225-520-539-00000','10892','3004','SKYGO','P1 BOLT 150','BLACK/SILVER','1P57MJS1121587','LX8TDK8G7SB000999','Available',1,1,NULL,1,0,NULL,'sta mesa'),
      ('KAMIAS','TM150T','7/7/2025','SKYGO MARKETING CORP','225-520-539-00000','10892','3004','SKYGO','P1 BOLT 150','BROWN/SILVER','1P57MJS1118480','LX8TDK8G8SB000669','Available',1,1,NULL,1,0,'8/19/2025',NULL),
      ('KAMIAS','TM150T','7/7/2025','SKYGO MARKETING CORP','225-520-539-00000','10892','3004','SKYGO','P1 BOLT 150','BROWN/SILVER','1P57MJS1118532','LX8TDK8G9SB000728','Available',1,1,NULL,1,0,'7/17/2025',NULL),
      ('KAMIAS','TM150T','7/7/2025','SKYGO MARKETING CORP','225-520-539-00000','10892','3004','SKYGO','P1 BOLT 150','BLACK/SILVER','1P57MJS1121581','LX8TDK8GXSB000964','Available',1,1,NULL,1,0,'7/12/2025',NULL),
      ('KAMIAS','SG150T KL','7/7/2025','SKYGO MARKETING CORP','225-520-539-00000','10897','3009','SKYGO','KPV 150 KEYLESS','GRAY','1P57MJP1133418','LX8TDK808PA001059','Available',1,1,NULL,1,1,NULL,NULL),
      ('KAMIAS','SG150T KL','7/7/2025','SKYGO MARKETING CORP','225-520-539-00000','10897','3009','SKYGO','KPV 150 KEYLESS','GRAY','1P57MJP1133435','LX8TDK80XPA001063','Available',1,1,NULL,1,1,NULL,NULL),
      ('KAMIAS','SG150T 8U','7/7/2025','SKYGO MARKETING CORP','225-520-539-00000','10897','3009','SKYGO','M1 LANCE 150','WHITE/GOLD','1P57MJR1343555','LX8TDK8U1RB001467','Available',1,1,NULL,1,1,NULL,NULL),
      ('KAMIAS','SG150T 8U','7/7/2025','SKYGO MARKETING CORP','225-520-539-00000','10897','3009','SKYGO','M1 LANCE 150','WHITE/GOLD','1P57MJR1343556','LX8TDK8U3RB001468','Available',1,1,NULL,1,0,'8/27/2025',NULL),
      ('KAMIAS','SG150T 8U','7/7/2025','SKYGO MARKETING CORP','225-520-539-00000','10897','3009','SKYGO','M1 LANCE 150','WHITE/GOLD','1P57MJR1343561','LX8TDK8U8RB001451','Available',1,1,NULL,1,0,'7/19/2025',NULL),
      ('KAMIAS','SG150T 8U','7/7/2025','SKYGO MARKETING CORP','225-520-539-00000','10897','3009','SKYGO','M1 LANCE 150','BLACK/GOLD','1P57MJR1343559','LX8TDK8UXRB001449','Available',1,1,NULL,1,0,NULL,'STA MESA'),
      ('KAMIAS','WM125','7/9/2025','SKYGO MARKETING CORP','225-520-539-00000','10899','3011','SKYGO','OMNI 125','SILVER GRAY','1P52QMIRTC01413','LWMTJV1C5RT001413','Available',1,1,NULL,1,0,'7/17/2025',NULL),
      ('KAMIAS','WM125','7/9/2025','SKYGO MARKETING CORP','225-520-539-00000','10899','3011','SKYGO','OMNI 125','SILVER GRAY','1P52QMIRTC01414','LWMTJV1C7RT001414','Available',1,1,NULL,1,0,'9/24/2025','CASH SALE'),
      ('KAMIAS','RM15ST','7/19/2025','SKYGO MARKETING CORP','225-520-539-00000','10883','2995','SKYGO','M1 ARROW 150','GRAY','JN1P57QMJ24046032','LRPRTJ500RA000335','Available',1,1,NULL,1,1,NULL,NULL),
      ('KAMIAS','RM15ST','7/19/2025','SKYGO MARKETING CORP','225-520-539-00000','10883','2995','SKYGO','M1 ARROW 150','GRAY','JN1P57QMJ24045995','LRPRTJ500RA000298','Available',1,1,NULL,1,1,NULL,NULL),
      ('KAMIAS','WM125','7/22/2025','SKYGO MARKETING CORP','225-520-539-00000','10869','2981','SKYGO','OMNI 125','PEARL WHITE','1P52QMIRTC01304','LWMTJV1C0RT001304','Available',1,1,NULL,1,1,NULL,NULL),
      ('KAMIAS','TM150T','7/22/2025','SKYGO MARKETING CORP','225-520-539-00000','10859','2971','SKYGO','P1 BOLT 150','BROWN/SILVER','1P57MJR1342607','LX8TDK8GXRB002692','Available',1,1,NULL,1,0,'8/7/2025','STA MESA'),
      ('KAMIAS','SG150T KL','7/31/2025','SKYGO MARKETING CORP','225=520-539-00000','11288','3100','SKYGO','KPV 150 KEYLESS','BLUE','1P57MJP1094547','LX8TDK807PA000792','Available',1,1,NULL,1,1,NULL,NULL),
      ('KAMIAS','SGT150T KL','7/31/2025','SKYGO MARKETING CORP','225=520-539-00000','11288','3100','SKYGO','KPV 150 KEYLESS','BLUE','1P5MJP1094601','LX8TDK807PA000839','Available',1,1,NULL,1,1,NULL,NULL),
      ('KAMIAS','RM150 ST','7/31/2025','SKYGO MARKETING CORP','225=520-539-00000','11288','3100','SKYGO','M1 ARROW 150','BLACK','JN1P57QMJ24045901','LRPRTJ507RA000204','Available',1,1,NULL,1,1,NULL,NULL),
      ('KAMIAS','RM150 ST','7/31/2025','SKYGO MARKETING CORP','225=520-539-00000','11288','3100','SKYGO','M1 ARROW 150','BLACK','JN1P57QMJ24045843','LRPRTJ508RA000146','Available',1,1,NULL,1,1,NULL,NULL),
      ('KAMIAS','WM125','7/31/2025','SKYGO MARKETING CORP','225=520-539-00000','11288','3100','SKYGO','OMNI 125','DARK BLUE','1P52QMIRTC01247','LWMTJV1C3RT001247','Available',1,1,NULL,1,1,NULL,NULL),
      ('KAMIAS','WM125','7/31/2025','SKYGO MARKETING CORP','225=520-539-00000','11288','3100','SKYGO','OMNI 125','DARK BLUE','1P52QMIRTC01243','LWMTJV1C6RT001243','Available',1,1,NULL,1,1,NULL,NULL),
      ('KAMIAS','RM150 ST','1/8/2025','SKYGO MARKETING CORP','225-520-539-00000','10928','3041','SKYGO','M1 ARROW 150','BLACK','JN1P57QMJ24045877','LRPRTJ5Q8RA000180','Available',1,1,NULL,1,1,NULL,NULL),
      ('KAMIAS','TM150T','1/8/2025','SKYGO MARKETING CORP','225-520-539-00000','11252','30364','SKYGO','P1 BOLT 150','BLACK/SILVER','1P57MJS1121568','LX8TDK8G2SB000988','Available',1,1,NULL,1,1,'8/7/2025','STA MESA'),
      ('KAMIAS','TM150T','1/8/2025','SKYGO MARKETING CORP','225-520-539-00000','11252','30364','SKYGO','P1 BOLT 150','BLACK/SILVER','1P57MJS1121579','LX8TDK8G2SB000991','Available',1,1,NULL,1,0,'8/29/2025',NULL),
      ('KAMIAS','TM150T','1/8/2025','SKYGO MARKETING CORP','225-520-539-00000','11252','30364','SKYGO','P1 BOLT 150','BROWN/SILVER','1P57MJS1118573','LX8TDK8G7SB000761','Available',1,1,NULL,1,0,'8/28/2025',NULL),
      ('KAMIAS','TM150T','1/8/2025','SKYGO MARKETING CORP','225-520-539-00000','11252','30364','SKYGO','P1 BOLT 150','BROWN/SILVER','1P57MJS1118590','LX8TDK8G7SB000789','Available',1,0,NULL,1,0,'7/25/2025',NULL),
      ('KAMIAS','TM150T','1/8/2025','SKYGO MARKETING CORP','225-520-539-00000','11252','30364','SKYGO','P1 BOLT 150','BLACK/SILVER','1P57MJS1121560','LX8TDK8G9SB000986','Available',1,1,NULL,1,0,'7/31/2025',NULL),
      ('KAMIAS','SG150 8U','1/8/2025','SKYGO MARKETING CORP','225-520-539-00000',NULL,NULL,'SKYGO','M1 LANCE 150','WHITE/GOLD','1P57MJR1297929','LX8TDK8U0RB001086','Available',1,1,NULL,1,1,NULL,NULL),
      ('KAMIAS','SG150 8U','1/8/2025','SKYGO MARKETING CORP','225-520-539-00000',NULL,NULL,'SKYGO','M1 LANCE 150','BLACK/GOLD','1P57MJR1297850','LX8TDK8U4RB000989','Available',1,1,NULL,1,0,'8/8/2025',NULL),
      ('KAMIAS','RM175CB','12/8/2025','SKYGO MARKETING CORP','225-520-539-00000','11358','3170','SKYGO','SPEAR 180','BLUE','RW162FMK24000329','LRPRPK804RA000361','Available',1,1,NULL,1,1,NULL,NULL),
      ('KAMIAS','RM175CB','12/8/2025','SKYGO MARKETING CORP','225-520-539-00000','11358','3170','SKYGO','SPEAR 180','BLUE','RW162FMK24000338','LRPRPK807RA000371','Available',1,1,NULL,1,1,NULL,NULL),
      ('KAMIAS','RM175CB','12/8/2025','SKYGO MARKETING CORP','225-520-539-00000','11358','3170','SKYGO','SPEAR 180','BLUE','RW162FMK24000340','LRPRPK80XRA000378','Available',1,1,NULL,1,1,NULL,NULL),
      ('KAMIAS','RM175CB','12/8/2025','SKYGO MARKETING CORP','225-520-539-00000','11359','3171','SKYGO','SPEAR 180','BLACK','RW162FMK24000310','LRPRPK800RA000342','Available',1,1,NULL,1,1,NULL,NULL),
      ('KAMIAS','RM175CB','12/8/2025','SKYGO MARKETING CORP','225-520-539-00000','11359','3171','SKYGO','SPEAR 180','BLACK','RW162FMK24000307','LRPRPK802RA000343','Available',1,1,NULL,1,1,NULL,NULL),
      ('KAMIAS','RM175CB','12/8/2025','SKYGO MARKETING CORP','225-520-539-00000','11359','3171','SKYGO','SPEAR 180','BLUE','RW162FMK24000357','LRPRPK806RA000393','Available',1,1,NULL,1,1,NULL,NULL),
      ('KAMIAS','TM150T','5/9/2025','SKYGO MARKETING CORP','225-520-539-00000','11410',NULL,'SKYGO','P1 BOLT 150','BLACK/SILVER','1P57MJS112634','LX8TDK8G0SB001024','Available',1,1,NULL,1,1,NULL,NULL),
      ('KAMIAS','TM150T','5/9/2025','SKYGO MARKETING CORP','225-520-539-00000','11410',NULL,'SKYGO','P1 BOLT 150','BLACK/SILVER','1P57MJS1121637','LX8TDK8G4SB001026','Available',0,0,NULL,1,0,'9/6/2025',NULL),
      ('KAMIAS','TM150T','5/9/2025','SKYGO MARKETING CORP','225-520-539-00000','11410',NULL,'SKYGO','P1 BOLT 150','BLACK/SILVER','1P57MJS1121628','LX8TDK8G5SB001021','Available',1,1,NULL,1,0,'9/8/2025',NULL),
      ('KAMIAS','TM150T','5/9/2025','SKYGO MARKETING CORP','225-520-539-00000','11410',NULL,'SKYGO','P1 BOLT 150','BLACK/SILVER','1P57MJS1121638','LX8TDK8G6SB001027','Available',1,1,NULL,1,0,'9/10/2025',NULL),
      ('KAMIAS','TM150T','5/9/2025','SKYGO MARKETING CORP','225-520-539-00000','11410',NULL,'SKYGO','P1 BOLT 150','BLACK/SILVER','1P57MJS1121629','LX8TDK8G7SB001022','Available',1,1,NULL,1,0,'9/18/2025',NULL),
      ('KAMIAS','TM150T',NULL,'SKYGO MARKETING CORP','225-520-539-0000',NULL,NULL,'MONARCH','P1 BOLT 150','BLACK/SILVER','1P57MJSI230049','LX8TDK8G1SB001677','Available',0,0,NULL,1,0,'10/11/2025','ANTIPOLO'),
      ('KAMIAS','TM150T','3/22/2025','SKYGO MARKETING CORP','225-520-539-00000',NULL,NULL,'MONARCH','P1 BOLT 150','BLACK/SILVER','1P57MJS1230050','LX8TDK8G3SB001678','Available',0,0,NULL,1,0,'10/22/2025','ANTIPOLO')
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
              cost = COALESCE(im.cost, (SELECT cost_of_purchase FROM items WHERE id = im.item_id))
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
          (SELECT cost_of_purchase FROM items WHERE id = item_id),
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
          (SELECT cost_of_purchase FROM items WHERE id = item_id),
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

-- Return a small summary of inserted vehicle units to help verification
SELECT v.id, v.engine_no, v.chassis_no, im.branch_id, im.item_id, im.date_received, im.ending_qty, im.remarks
FROM vehicle_units v
JOIN inventory_movements im ON im.id = v.inventory_id
WHERE im.created_at > now() - interval '1 hour'
ORDER BY v.id;
