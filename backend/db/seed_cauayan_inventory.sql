-- Seeder for Prime Motors Cauayan
-- Rules:
-- - If Transfer column contains 'TRANSFER' or remarks contains 'TRANSFER' (case-insensitive), mark transferred = true
-- - If duplicate engine/chassis exists, still insert the new row and honor the transfer flag (i.e., transferred = true when transfer/remarks indicate transfer)

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
      ('TM175', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012968', NULL, 'MONARCH', 'MONARCH 175', 'BLUE', '162FMKS5106967', 'LX8PCL50XSE008188', 'Available', NULL, NULL, NULL, NULL, NULL, NULL, 'EXISTING UNIT'),
      ('TM175', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012968', NULL, 'MONARCH', 'MONARCH 175', 'BLUE', '162FMKS5106982', 'LX8PCL502SE008203', 'Available', NULL, NULL, NULL, NULL, NULL, NULL, 'EXISTING UNIT'),
      ('TM175', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012968', NULL, 'MONARCH', 'MONARCH 175', 'BLUE', '162FMKS5106984', 'LX8PCL506SE008205', 'Available', NULL, NULL, NULL, NULL, NULL, NULL, 'EXISTING UNIT'),
      ('TM175', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012968', NULL, 'MONARCH', 'MONARCH 175', 'BLUE', '162FMKS5106990', 'LX8PCL501SE008211', 'Available', NULL, NULL, NULL, NULL, '10/27/2025', NULL, 'EXISTING UNIT'),
      ('TM175', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012968', NULL, 'MONARCH', 'MONARCH 175', 'RED', '162FMKS5106842', 'LX8PCL501SE008063', 'Available', NULL, NULL, 'TRANSFER ROXAS', NULL, '10/27/2025', NULL, 'EXISTING UNIT'),
      ('TM175', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012968', NULL, 'MONARCH', 'MONARCH 175', 'RED', '162FMKS5106855', 'LX8PCL50XSE008076', 'Available', NULL, NULL, 'TRANSFER ROXAS', NULL, '10/27/2025', NULL, 'EXISTING UNIT'),
      ('TM175', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012968', NULL, 'MONARCH', 'MONARCH 175', 'RED', '162FMKS5106862', 'LX8PCL507SE008083', 'Available', NULL, NULL, NULL, NULL, NULL, NULL, 'EXISTING UNIT'),
      ('TM175', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012968', NULL, 'MONARCH', 'MONARCH 175', 'RED', '162FMKS5106864', 'LX8PCL500SE008085', 'Available', NULL, NULL, NULL, NULL, NULL, NULL, 'EXISTING UNIT'),
      ('TM175', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012968', NULL, 'MONARCH', 'MONARCH 175', 'RED', '162FMKS5106866', 'LX8PCL504SE008087', 'Available', NULL, NULL, 'TRANSFER ROXAS', NULL, '10/27/2025', NULL, 'EXISTING UNIT'),
      ('TM175', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012968', NULL, 'MONARCH', 'MONARCH 175', 'RED', '162FMKS5106868', 'LX8PCL508SE008089', 'Available', NULL, NULL, NULL, NULL, NULL, NULL, 'EXISTING UNIT'),
      ('TM175', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012968', NULL, 'MONARCH', 'MONARCH 175', 'RED', '162FMKS5106889', 'LX8PCL506SE008110', 'Available', NULL, NULL, 'TRANSFER ROXAS', NULL, '10/25/2025', NULL, 'EXISTING UNIT'),
      ('TM175', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012968', NULL, 'MONARCH', 'MONARCH 175', 'RED', '162FMKS5106892', 'LX8PCL501SE008113', 'Available', NULL, NULL, NULL, NULL, NULL, NULL, 'EXISTING UNIT'),
      ('TM175', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012968', NULL, 'MONARCH', 'MONARCH 175', 'RED', '162FMKS5106895', 'LX8PCL507SE008116', 'Available', NULL, NULL, NULL, NULL, NULL, NULL, 'EXISTING UNIT'),
      ('TM175', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012968', NULL, 'MONARCH', 'MONARCH 175', 'RED', '162FMKS5106899', 'LX8PCL509SE008120', 'Available', NULL, NULL, NULL, NULL, NULL, NULL, 'EXISTING UNIT'),
      ('TM175', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012967', NULL, 'MONARCH', 'MONARCH 175', 'BLUE', '162FMKS5106795', 'LX8PCL503SE008016', 'Available', NULL, NULL, NULL, NULL, NULL, NULL, 'EXISTING UNIT'),
      ('TM175', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012967', NULL, 'MONARCH', 'MONARCH 175', 'BLUE', '162FMKS5106957', 'LX8PCL507SE008178', 'Available', NULL, NULL, NULL, NULL, NULL, NULL, 'EXISTING UNIT'),
      ('TM175', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012967', NULL, 'MONARCH', 'MONARCH 175', 'BLUE', '162FMKS5106966', 'LX8PCL508SE008187', 'Available', NULL, NULL, NULL, NULL, NULL, NULL, 'EXISTING UNIT'),
      ('TM175', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012967', NULL, 'MONARCH', 'MONARCH 175', 'BLUE', '162FMKS5106969', 'LX8PCL508SE008190', 'Available', NULL, NULL, NULL, NULL, NULL, NULL, 'EXISTING UNIT'),
      ('TM175', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012967', NULL, 'MONARCH', 'MONARCH 175', 'BLUE', '162FMKS5106974', 'LX8PCL507SE008195', 'Available', NULL, NULL, 'TRANSFER', NULL, '10/31/2025', NULL, 'TRANSFER UNIT'),
      ('TM175', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012967', NULL, 'MONARCH', 'MONARCH 175', 'RED', '162FMKS5106848', 'LX8PCL502SE008069', 'Available', NULL, NULL, NULL, NULL, NULL, NULL, 'EXISTING UNIT'),
      ('TM175', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012967', NULL, 'MONARCH', 'MONARCH 175', 'RED', '162FMKS5106867', 'LX8PCL506SE008088', 'Available', NULL, NULL, NULL, NULL, NULL, NULL, 'EXISTING UNIT'),
      ('TM175', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012967', NULL, 'MONARCH', 'MONARCH 175', 'RED', '162FMKS5106893', 'LX8PCL503SE008114', 'Available', NULL, NULL, 'TRANSFER ROXAS', NULL, '10/25/2025', NULL, 'EXISTING UNIT'),
      ('TM175', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012967', NULL, 'MONARCH', 'MONARCH 175', 'RED', '162FMKS5106898', 'LX8PCL502SE008119', 'Available', NULL, NULL, NULL, NULL, NULL, NULL, 'EXISTING UNIT'),
      ('TM175', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012967', NULL, 'MONARCH', 'MONARCH 175', 'RED', '162FMKS5106900', 'LX8PCL500SE008121', 'Available', NULL, NULL, NULL, NULL, NULL, NULL, 'EXISTING UNIT'),
      ('OMNI125', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012969', NULL, 'MONARCH', 'OMNI 125', 'DARK BLUE', '1P52QMISTC00414', 'LWMTJV1C5ST000414', 'Available', NULL, NULL, NULL, NULL, NULL, NULL, 'EXISTING UNIT'),
      ('OMNI125', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012969', NULL, 'MONARCH', 'OMNI 125', 'DARK BLUE', '1P52QMISTC00417', 'LWMTJV1C0ST000417', 'Available', NULL, NULL, NULL, NULL, NULL, NULL, 'EXISTING UNIT'),
      ('OMNI125', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012969', NULL, 'MONARCH', 'OMNI 125', 'DARK BLUE', '1P52QMISTC00422', 'LWMTJV1C4ST000422', 'Available', NULL, NULL, NULL, NULL, NULL, NULL, 'EXISTING UNIT'),
      ('OMNI125', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012969', NULL, 'MONARCH', 'OMNI 125', 'DARK BLUE', '1P52QMISTC00428', 'LWMTJV1C5ST000428', 'Available', NULL, NULL, NULL, NULL, NULL, NULL, 'EXISTING UNIT'),
      ('OMNI125', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012969', NULL, 'MONARCH', 'OMNI 125', 'DARK BLUE', '1P52QMISTC00430', 'LWMTJV1C3ST000430', 'Available', NULL, NULL, NULL, NULL, NULL, NULL, 'EXISTING UNIT'),
      ('OMNI125', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012969', NULL, 'MONARCH', 'OMNI 125', 'DARK BLUE', '1P52QMISTC00431', 'LWMTJV1C5ST000431', 'Available', NULL, NULL, NULL, NULL, NULL, NULL, 'EXISTING UNIT'),
      ('OMNI125', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012969', NULL, 'MONARCH', 'OMNI 125', 'DARK BLUE', '1P52QMISTC00433', 'LWMTJV1C9ST000433', 'Available', NULL, NULL, NULL, NULL, NULL, NULL, 'EXISTING UNIT'),
      ('OMNI125', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012969', NULL, 'MONARCH', 'OMNI 125', 'DARK BLUE', '1P52QMISTC00437', 'LWMTJV1C6ST000437', 'Available', NULL, NULL, NULL, NULL, NULL, NULL, 'EXISTING UNIT'),
      ('OMNI125', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012969', NULL, 'MONARCH', 'OMNI 125', 'DARK BLUE', '1P52QMISTC00499', 'LWMTJV1C6ST000499', 'Available', NULL, NULL, 'TRANSFER AURORA', NULL, '10/23/2025', NULL, 'TRANSFER UNIT'),
      ('SG150-L', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012969', NULL, 'SKYGO', 'M1 LANCE 150', 'WHITE/GOLD', '1P57MJR1297897', 'LX8TDK8U3RB001017', 'Available', NULL, NULL, 'TRANSFER AURORA', NULL, '10/23/2025', NULL, 'TRANSFER UNIT'),
      ('SG150T-8U', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012970', NULL, 'SKYGO', 'M1 LANCE 150', 'BLACK/GOLD', '1P57MJS1067227', 'LX8TDK8U6SB000191', 'Available', NULL, NULL, 'TRANSFER AURORA', NULL, '10/28/2025', NULL, 'TRANSFER UNIT'),
      ('SG150T-8U', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012970', NULL, 'SKYGO', 'M1 LANCE 150', 'BLACK/GOLD', '1P57MJS1067228', 'LX8TDK8U8SB000192', 'Available', NULL, NULL, 'TRANSFER ILAGAN', NULL, NULL, NULL, 'EXISTING UNIT'),
      ('SG150T-8U', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012970', NULL, 'SKYGO', 'M1 LANCE 150', 'BLACK/GOLD', '1P57MJS1067237', 'LX8TDK8U1SB000194', 'Available', NULL, NULL, 'TRANSFER ROXAS', NULL, '11/03/2025', NULL, 'EXISTING UNIT'),
      ('OMNI125', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012970', NULL, 'SKYGO', 'OMNI 125', 'DARK BLUE', '1P52QM1STC00403', 'LWMTJV1C0ST000403', 'Available', NULL, NULL, NULL, NULL, NULL, NULL, 'EXISTING UNIT'),
      ('OMNI125', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012970', NULL, 'SKYGO', 'OMNI 125', 'SILVER GRAY', '1P52QMIRTC01157', 'LWMTJV1C2RT001157', 'Available', NULL, NULL, NULL, NULL, NULL, NULL, 'EXISTING UNIT'),
      ('OMNI125', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012970', NULL, 'SKYGO', 'OMNI 125', 'SILVER GRAY', '1P52QMIRTC01390', 'LWMTJV1C8RT001390', 'Available', NULL, NULL, 'TRANSFER AURORA', NULL, '10/24/2025', NULL, 'TRANSFER UNIT'),
      ('OMNI125', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012970', NULL, 'SKYGO', 'OMNI 125', 'SILVER GRAY', '1P52QMIRTC01394', 'LWMTJV1C5RT001394', 'Available', NULL, NULL, NULL, NULL, NULL, NULL, 'EXISTING UNIT'),
      ('OMNI125', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012970', NULL, 'SKYGO', 'OMNI 125', 'SILVER GRAY', '1P52QMIRTC01461', 'LWMTJV1C5RT001461', 'Available', NULL, NULL, NULL, NULL, NULL, NULL, 'EXISTING UNIT'),
      ('OMNI125', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012970', NULL, 'OMNI', 'OMNI 125', 'SILVER GRAY', '1P52QMISTC00254', 'LWMTJV1C9ST000254', 'Available', NULL, NULL, NULL, NULL, NULL, NULL, 'EXISTING UNIT'),
      ('OMNI125', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012970', NULL, 'OMNI', 'OMNI 125', 'SILVER GRAY', '1P52QMISTC00263', 'LWMTJV1CXST000263', 'Available', NULL, NULL, NULL, NULL, NULL, NULL, 'EXISTING UNIT'),
      ('OMNI125', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012970', NULL, 'OMNI', 'OMNI 125', 'SILVER GRAY', '1P52QMISTC00282', 'LWMTJV1C3ST000282', 'Available', NULL, NULL, NULL, NULL, NULL, NULL, 'EXISTING UNIT'),
      ('OMNI125', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012970', NULL, 'OMNI', 'OMNI 125', 'SILVER GRAY', '1P52QMISTC00284', 'LWMTJV1C7ST000284', 'Available', NULL, NULL, NULL, NULL, NULL, NULL, 'EXISTING UNIT'),
      ('OMNI125', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012970', NULL, 'OMNI', 'OMNI 125', 'SILVER GRAY', '1P52QMISTC00287', 'LWMTJV1C2ST000287', 'Available', NULL, NULL, 'TRANSFER ROXAS', NULL, '10/27/2025', NULL, 'EXISTING UNIT'),
      ('OMNI125', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012970', NULL, 'OMNI', 'OMNI 125', 'SILVER GRAY', '1P52QMISTC00298', 'LWMTJV1C7ST000298', 'Available', NULL, NULL, NULL, NULL, NULL, NULL, 'EXISTING UNIT'),
      ('SG150T-8U', '10/23/2025', 'SKYGO MARKETING CORP', '225-520-539-00000', '012970', NULL, 'SKYGO', 'M1 LANCE 150', 'WHITE/GOLD', '1P57MJR1343579', 'LX8TDK8URRB001486', 'Available', NULL, NULL, 'TRANSFER TUMAUINI', NULL, NULL, NULL, 'EXISTING UNIT')
    ) AS t(item_no, date_received, supplier, tin, dr_no, si_no, brand, model, color, engine_no, chassis_no, pnpc_status, beg_inv, purchased, transfer, sales, ending_inv, note_date, remarks)
  LOOP
    DECLARE
      br_id INT;
      sup_id INT;
      item_id INT;
      inv_id INT;
      sold_qty INT := 0;
      trans_flag BOOLEAN := false;
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

      -- determine transfer flag from Transfer column or remarks containing 'transfer'
      IF (r.transfer IS NOT NULL AND lower(r.transfer) LIKE '%transfer%') OR (r.remarks IS NOT NULL AND lower(r.remarks) LIKE '%transfer%') THEN
        trans_flag := true;
      ELSE
        trans_flag := false;
      END IF;

      -- resolve Cauayan branch
      SELECT id INTO br_id FROM branches WHERE name ILIKE '%cauayan%' LIMIT 1;
      IF br_id IS NULL THEN
        INSERT INTO branches (name, address, created_at) VALUES ('Prime Motors Cauayan', 'Cauayan, Isabela', NOW()) RETURNING id INTO br_id;
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

      IF trans_flag THEN
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
          CASE WHEN r.beg_inv IS NOT NULL AND CAST(r.beg_inv AS TEXT) ~ '^[0-9]+$' THEN CAST(r.beg_inv AS INT) ELSE 1 END,
          CASE WHEN r.purchased IS NOT NULL AND CAST(r.purchased AS TEXT) ~ '^[0-9]+$' THEN CAST(r.purchased AS INT) ELSE 1 END,
          1,
          sold_qty,
          CASE WHEN r.ending_inv IS NOT NULL AND CAST(r.ending_inv AS TEXT) ~ '^[0-9]+$' THEN CAST(r.ending_inv AS INT) ELSE 1 END,
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
        RAISE NOTICE 'Inserted Cauayan vehicle to transferred_history: chassis=% engine=%', clean_chassis, clean_engine;
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
        VALUES (inv_id, clean_chassis, clean_engine, 1, NOW());

        RAISE NOTICE 'Inserted Cauayan vehicle to active inventory: chassis=% engine=%', clean_chassis, clean_engine;
      END IF;

    END;
  END LOOP;
END;
$$;

-- verification: show recent Cauayan inserts
SELECT b.name as branch, COUNT(im.*) as movements, SUM(COALESCE(im.ending_qty,0)) as total_units,
       SUM(COALESCE((SELECT COUNT(*) FROM vehicle_units v2 WHERE v2.inventory_id = im.id AND v2.transferred = true),0)) as transferred_units
FROM inventory_movements im
JOIN branches b ON b.id = im.branch_id
WHERE b.name ILIKE '%cauayan%'
  AND im.created_at > now() - interval '24 hour'
GROUP BY b.name;

SELECT v.id, v.engine_no, v.chassis_no, v.transferred, im.remarks, im.date_received
FROM vehicle_units v
JOIN inventory_movements im ON im.id = v.inventory_id
JOIN branches b ON b.id = im.branch_id
WHERE b.name ILIKE '%cauayan%'
  AND im.created_at > now() - interval '24 hour'
ORDER BY v.id;
