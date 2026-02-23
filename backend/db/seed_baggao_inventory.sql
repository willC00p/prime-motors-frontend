-- Idempotent seeder for Baggao (Tuguegarao -> Baggao transfers)
-- Inserts inventory_movements and vehicle_units for Baggao rows, marks inserted vehicle_units.transferred = false

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      -- branch, item_no, date_received, supplier, tin, dr_no, si_no, brand, model, color, engine_no, chassis_no, pnpc_status, beg_inv, purchased, transfer, sales, ending_inv, note_date, remarks
      ('TUGUEGARAO','TM125','8/16/2025',NULL,NULL,'11429','45','MONARCH','TM125','BLACK','156FMI2S5106302','LX8PCJ504SE003802','AVAILABLE',0,'DELIVERED','BAGGAO','RELEASED',0,'9/6/2025','Baggao'),
      ('TUGUEGARAO','TM125','8/16/2025','TUMAUINI ISABELA','669-059-669-00000','11450',NULL,'MONARCH','TM125','RED','156FMI2R5123773','LX8PCJ509RE011047','AVAILABLE',1,NULL,'BAGGAO',NULL,1,NULL,'Baggao'),
      ('TUGUEGARAO','TM125','8/16/2025',NULL,NULL,'11429',NULL,'MONARCH','TM125','BLACK','156FMI2S5106304','LX8PCJ508SE003804','AVAILABLE',1,NULL,'BAGGAO',NULL,1,NULL,'Baggao'),
      ('TUGUEGARAO','WM125','8/16/2025',NULL,NULL,'11388',NULL,'MONARCH','OMNI125','PEARL/WHITE','1P52QMISTC00214','LWMTJVIC8ST000214','AVAILABLE',1,NULL,'BAGGAO',NULL,1,NULL,'Baggao'),
      ('TUGUEGARAO','TM175','9/9/2025','ROXAS, ISABELA',NULL,'11345',NULL,'MONARCH','TM175','BLUE','162FMKN5158599','LX8PCL501NE012778','NO PNPC',1,NULL,'BAGGAO',NULL,NULL,'9/9/2025','Baggao'),
      ('TUGUEGARAO','TM150T','9/26/2025','TMOPC-BATAAN',NULL,'11593',NULL,'MONARCH','BOLT150','BLACK/SILVER','1P57MJS1226943','LX8TDK8G1SB0014369','AVAILABLE',1,NULL,'BAGGAO',NULL,NULL,NULL,'Baggao'),
      ('TUGUEGARAO','TM150T','9/26/2025','TMOPC-BATAAN',NULL,'11593',NULL,'MONARCH','BOLT150','BLACK/SILVER','1P57MJS1226973','LX8TDK8G1SB001405','AVAILABLE',1,NULL,'BAGGAO',NULL,NULL,NULL,'Baggao'),
      ('TUGUEGARAO','TM150T','9/26/2025','TMOPC-BATAAN',NULL,'11593',NULL,'MONARCH','BOLT150','BLACK/SILVER','1P57MJS1226978','LX8TDK8G7SB001408','AVAILABLE',1,NULL,'BAGGAO',NULL,NULL,NULL,'Baggao'),
      ('TUGUEGARAO','TM125','9/26/2025','TMOPC-BATAAN',NULL,'11593',NULL,'MONARCH','TM125','RED','156FMI2S5106277','LX8PCJ509SE003777','AVAILABLE',1,NULL,'BAGGAO',NULL,NULL,NULL,'Baggao'),
      ('TUGUEGARAO','TM125','9/26/2025','TMOPC-BATAAN',NULL,'11593',NULL,'MONARCH','TM125','RED','156FMI2S5106235','LX8PCJ504SE003735','AVAILABLE',1,NULL,'BAGGAO',NULL,NULL,NULL,'Baggao'),
      ('TUGUEGARAO','TM150','10/29/2025','TMOPC-BATAAN',NULL,'11456',NULL,'MONARCH','TM150','BLACK','161FMJS5105853','LX8PCK507DE011723','AVAILABLE',1,NULL,'BAGGAO',NULL,NULL,NULL,'Baggao'),
      ('TUGUEGARAO','TM150','10/29/2025','TMOPC-BATAAN',NULL,'11456',NULL,'MONARCH','TM150','BLUE','161FMJS5105891','LX8PCK504SE011761','AVAILABLE',1,NULL,'BAGGAO',NULL,NULL,NULL,'Baggao'),
      ('TUGUEGARAO','TM150','10/29/2025','TMOPC-BATAAN',NULL,'11456',NULL,'MONARCH','TM150','BLUE','161FMJS5105888','LX8PCK504SE011758','AVAILABLE',1,NULL,'BAGGAO',NULL,NULL,NULL,'Baggao'),
      ('TUGUEGARAO','TM150','10/29/2025','TMOPC-BATAAN',NULL,'11456',NULL,'MONARCH','TM150','BLACK','161FMJS5105824','LX8PCK504SE011694','AVAILABLE',1,NULL,'BAGGAO',NULL,NULL,NULL,'Baggao'),
      ('TUGUEGARAO','TM150','10/29/2025','TMOPC-BATAAN',NULL,'11456',NULL,'MONARCH','TM150','BLUE','161FMJS5105872','LX8PCK500SE011742','AVAILABLE',1,NULL,'BAGGAO',NULL,NULL,NULL,'Baggao'),
      ('TUGUEGARAO','TM175','10/29/2025','TMOPC-BATAAN',NULL,'12963',NULL,'MONARCH','TM175','RED','162FMKS5106897','LX8PCL500SE008118','AVAILABLE',1,NULL,'BAGGAO',NULL,NULL,NULL,'Baggao'),
      ('TUGUEGARAO','TM175','10/29/2025','TMOPC-BATAAN',NULL,'12963',NULL,'MONARCH','TM175','BLUE','162FMKS5106959','LX8PCL505SE008180','AVAILABLE',1,NULL,'BAGGAO',NULL,NULL,NULL,'Baggao'),
      ('TUGUEGARAO','TM175','10/29/2025','TMOPC-BATAAN',NULL,'12963',NULL,'MONARCH','TM175','BLACK','162FMKS5106927','LX8PCL509SE008148','AVAILABLE',1,NULL,'BAGGAO',NULL,NULL,NULL,'Baggao'),
      ('TUGUEGARAO','TM175','10/29/2025','TMOPC-BATAAN',NULL,'12963',NULL,'MONARCH','TM175','BLACK','162FMKS5106937','LX8PCL501SE008158','AVAILABLE',1,NULL,'BAGGAO',NULL,NULL,NULL,'Baggao'),
      ('TUGUEGARAO','TM175','10/29/2025','TMOPC-BATAAN',NULL,'12963',NULL,'MONARCH','TM175','BLACK','162FMKS5106930','LX8PCL509SE008151','AVAILABLE',1,NULL,'BAGGAO',NULL,NULL,NULL,'Baggao')
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
      -- If the remarks mention Baggao, insert those rows under the Baggao branch, otherwise use r.branch
      DECLARE target_branch TEXT := r.branch; BEGIN
        IF r.remarks IS NOT NULL AND lower(r.remarks) LIKE '%baggao%' THEN
          target_branch := 'Baggao';
        END IF;
        SELECT id INTO br_id FROM branches WHERE name ILIKE '%' || target_branch || '%' LIMIT 1;
        IF br_id IS NULL THEN
          INSERT INTO branches (name) VALUES (target_branch) RETURNING id INTO br_id;
        END IF;
      END;

      -- resolve supplier (try fuzzy match)
      IF r.supplier IS NOT NULL AND trim(r.supplier) <> '' THEN
        SELECT id INTO sup_id FROM suppliers WHERE name ILIKE '%' || split_part(r.supplier, ' ', 1) || '%' LIMIT 1;
        IF sup_id IS NULL THEN
          INSERT INTO suppliers (name, tin_number, created_at) VALUES (r.supplier, r.tin, NOW()) RETURNING id INTO sup_id;
        END IF;
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
      -- r.ending_inv may sometimes be text in the provided rows; guard with regex before casting
  IF r.ending_inv IS NOT NULL AND CAST(r.ending_inv AS TEXT) ~ '^[0-9]+$' AND CAST(r.ending_inv AS INT) = 0 THEN
        sold_qty := 1;
      ELSE
        sold_qty := 0;
      END IF;
      -- For Baggao: units with 'BAGGAO' in transfer/remarks are units that were transferred TO Baggao (now active at Baggao)
      -- Only mark as transferred if purchased=0 which indicates they were sent elsewhere
      IF (r.purchased IS NOT NULL AND CAST(r.purchased AS TEXT) ~ '^[0-9]+$' AND CAST(r.purchased AS INT) = 0) THEN
        trans_qty := 1;
      ELSE
        trans_qty := 0;
      END IF;

      -- If a vehicle unit with same engine/chassis exists in active units OR transferred history
      IF (r.engine_no IS NOT NULL AND r.engine_no <> '' AND (
          EXISTS(SELECT 1 FROM vehicle_units v WHERE v.engine_no = r.engine_no)
        OR EXISTS(SELECT 1 FROM transferred_history th WHERE th.engine_no = r.engine_no)
        ))
         OR (r.chassis_no IS NOT NULL AND r.chassis_no <> '' AND (
          EXISTS(SELECT 1 FROM vehicle_units v WHERE v.chassis_no = r.chassis_no)
        OR EXISTS(SELECT 1 FROM transferred_history th WHERE th.chassis_no = r.chassis_no)
        )) THEN
        SELECT v.inventory_id INTO inv_id FROM vehicle_units v
        WHERE (r.engine_no IS NOT NULL AND r.engine_no <> '' AND v.engine_no = r.engine_no)
           OR (r.chassis_no IS NOT NULL AND r.chassis_no <> '' AND v.chassis_no = r.chassis_no)
        LIMIT 1;
        IF inv_id IS NOT NULL THEN
          -- update color, srp and cost if missing to keep inventory consistent with model
          UPDATE inventory_movements im
          SET color = COALESCE(im.color, NULLIF(r.color, '')),
              srp = COALESCE(im.srp, (SELECT srp FROM items WHERE id = im.item_id)),
              cost = COALESCE(im.cost, (SELECT cost_of_purchase FROM items WHERE id = im.item_id))
          WHERE im.id = inv_id;
        END IF;
        -- DO NOT CONTINUE: allow insertion of a new inventory_movements & vehicle_units record below
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
  CASE WHEN r.beg_inv IS NOT NULL AND CAST(r.beg_inv AS TEXT) ~ '^[0-9]+$' THEN CAST(r.beg_inv AS INT) ELSE 1 END,
  CASE WHEN r.purchased IS NOT NULL AND CAST(r.purchased AS TEXT) ~ '^[0-9]+$' THEN CAST(r.purchased AS INT) ELSE 1 END,
          trans_qty,
          sold_qty,
    (CASE WHEN r.ending_inv IS NOT NULL AND CAST(r.ending_inv AS TEXT) ~ '^[0-9]+$' THEN CAST(r.ending_inv AS INT)
      WHEN r.beg_inv IS NOT NULL AND CAST(r.beg_inv AS TEXT) ~ '^[0-9]+$' THEN CAST(r.beg_inv AS INT)
              ELSE 1 END),
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
  CASE WHEN r.beg_inv IS NOT NULL AND CAST(r.beg_inv AS TEXT) ~ '^[0-9]+$' THEN CAST(r.beg_inv AS INT) ELSE 1 END,
  CASE WHEN r.purchased IS NOT NULL AND CAST(r.purchased AS TEXT) ~ '^[0-9]+$' THEN CAST(r.purchased AS INT) ELSE 1 END,
          trans_qty,
          sold_qty,
    (CASE WHEN r.ending_inv IS NOT NULL AND CAST(r.ending_inv AS TEXT) ~ '^[0-9]+$' THEN CAST(r.ending_inv AS INT)
      WHEN r.beg_inv IS NOT NULL AND CAST(r.beg_inv AS TEXT) ~ '^[0-9]+$' THEN CAST(r.beg_inv AS INT)
              ELSE 1 END),
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

-- Return a small summary of inserted/updated vehicle units to help verification
SELECT v.id, v.engine_no, v.chassis_no, im.branch_id, im.item_id, im.date_received, im.ending_qty, im.remarks, v.transferred
FROM vehicle_units v
JOIN inventory_movements im ON im.id = v.inventory_id
WHERE (im.created_at > now() - interval '24 hour' OR lower(coalesce(im.remarks, '')) LIKE '%baggao%')
ORDER BY v.id;
