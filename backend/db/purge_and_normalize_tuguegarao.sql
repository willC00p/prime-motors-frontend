-- Purge Tuguegarao parts 1 & 2 and normalize items
-- Deletes vehicle_units and inventory_movements created recently for Tuguegarao
-- Then normalizes item.model values (TM 125 -> TM125, TM 150 -> TM150, LANCE150 -> SG150-L)
-- Deduplicates items and reassigns inventory_movements to canonical items

BEGIN;

-- 1) Purge recently-inserted Tuguegarao inventory (last 24 hours)
DELETE FROM vehicle_units v
WHERE v.inventory_id IN (
  SELECT im.id
  FROM inventory_movements im
  JOIN branches b ON b.id = im.branch_id
  WHERE b.name ILIKE '%Tuguegarao%'
    AND im.created_at > now() - interval '24 hours'
);

DELETE FROM inventory_movements im
WHERE im.id IN (
  SELECT im2.id
  FROM inventory_movements im2
  JOIN branches b2 ON b2.id = im2.branch_id
  WHERE b2.name ILIKE '%Tuguegarao%'
    AND im2.created_at > now() - interval '24 hours'
);

-- 2) Normalize item model names
-- TM 125 -> TM125
UPDATE items
SET model = 'TM125'
WHERE model ILIKE '%tm 125%' OR model ILIKE '%tm 125%';

-- TM 150 -> TM150
UPDATE items
SET model = 'TM150'
WHERE model ILIKE '%tm 150%' OR model ILIKE '%tm 150%';

-- LANCE 150 / LANCE150 -> SG150-L (only for SKYGO or where model contains 'lance')
UPDATE items
SET model = 'SG150-L'
WHERE model ILIKE '%lance%150%' OR model ILIKE '%lance 150%';

-- Optionally normalize whitespace generally for TMxxx variants (remove internal spaces)
UPDATE items
SET model = regexp_replace(model, '\\s+', '', 'g')
WHERE model ~* 'tm\s+1?5?\d+';

-- 3) Deduplicate items by (brand, model): keep lowest id
DO $$
DECLARE
  rec RECORD;
  keep_id INT;
  dup_ids INT[];
BEGIN
  FOR rec IN SELECT brand, model FROM items GROUP BY brand, model HAVING count(*) > 1 LOOP
    SELECT array_agg(id ORDER BY id) INTO dup_ids FROM items WHERE brand = rec.brand AND model = rec.model;
    IF array_length(dup_ids, 1) > 1 THEN
      keep_id := dup_ids[1];
      -- reassign inventory_movements
      UPDATE inventory_movements SET item_id = keep_id WHERE item_id = ANY(dup_ids) AND item_id <> keep_id;
      -- delete duplicate item rows
      DELETE FROM items WHERE id = ANY(dup_ids) AND id <> keep_id;
    END IF;
  END LOOP;
END $$;

-- 4) Verification selects
-- show canonical items for the normalized models
SELECT id, item_no, brand, model FROM items
WHERE model IN ('TM125','TM150','SG150-L')
ORDER BY id;

-- show any remaining recent Tuguegarao inventory movements (should be zero rows)
SELECT im.id, b.name AS branch, i.model, i.item_no, im.created_at
FROM inventory_movements im
JOIN branches b ON b.id = im.branch_id
JOIN items i ON i.id = im.item_id
WHERE b.name ILIKE '%Tuguegarao%'
  AND im.created_at > now() - interval '24 hours'
ORDER BY im.id;

COMMIT;
