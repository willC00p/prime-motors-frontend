-- Migration: normalize TM item numbers (TM 175 -> TM175, TM 125 -> TM125)
-- This will:
-- 1) Find items with variants like 'TM 175' or 'TM125' and consolidate them under 'TM175' (and TM125)
-- 2) If a normalized item exists already (TM175/TM125) use it; otherwise rename a matching item to the normalized code
-- 3) Reassign inventory_movements.item_id to the normalized item where applicable
-- 4) Do NOT change any item pricing or movement cost/srp fields
-- 5) Remove old item records that are unreferenced

DO $$
DECLARE
  target_id INT;
  ids INT[];
BEGIN
  --------------------------------------------------
  -- TM175 normalization
  --------------------------------------------------
  SELECT id INTO target_id FROM items WHERE item_no ILIKE 'TM175' LIMIT 1;
  SELECT array_agg(id) INTO ids FROM items
    WHERE item_no ILIKE '%TM 175%'
       OR item_no ILIKE '%TM175%'
       OR lower(model) LIKE '%tm 175%'
       OR lower(model) LIKE '%tm175%';

  IF ids IS NULL OR array_length(ids,1) = 0 THEN
    RAISE NOTICE 'No TM175-like items found';
  ELSE
    IF target_id IS NULL THEN
      -- rename the first candidate to TM175 (do not change cost/srp)
      target_id := ids[1];
      UPDATE items SET item_no = 'TM175' WHERE id = target_id;
      RAISE NOTICE 'Renamed item id % to TM175', target_id;
    ELSE
      RAISE NOTICE 'TM175 exists as id %; consolidating other ids into it', target_id;
    END IF;

    -- reassign movements
    UPDATE inventory_movements
    SET item_id = target_id
    WHERE item_id = ANY(ids) AND item_id <> target_id;

    -- cleanup unreferenced duplicates (do not delete the target)
    DELETE FROM items it
    WHERE id <> target_id
      AND (it.item_no ILIKE '%TM 175%' OR it.item_no ILIKE '%TM175%' OR lower(it.model) LIKE '%tm 175%' OR lower(it.model) LIKE '%tm175%')
      AND NOT EXISTS (SELECT 1 FROM inventory_movements im WHERE im.item_id = it.id);
  END IF;

  --------------------------------------------------
  -- TM125 normalization
  --------------------------------------------------
  SELECT id INTO target_id FROM items WHERE item_no ILIKE 'TM125' LIMIT 1;
  SELECT array_agg(id) INTO ids FROM items
    WHERE item_no ILIKE '%TM 125%'
       OR item_no ILIKE '%TM125%'
       OR lower(model) LIKE '%tm 125%'
       OR lower(model) LIKE '%tm125%';

  IF ids IS NULL OR array_length(ids,1) = 0 THEN
    RAISE NOTICE 'No TM125-like items found';
  ELSE
    IF target_id IS NULL THEN
      target_id := ids[1];
      UPDATE items SET item_no = 'TM125' WHERE id = target_id;
      RAISE NOTICE 'Renamed item id % to TM125', target_id;
    ELSE
      RAISE NOTICE 'TM125 exists as id %; consolidating other ids into it', target_id;
    END IF;

    UPDATE inventory_movements
    SET item_id = target_id
    WHERE item_id = ANY(ids) AND item_id <> target_id;

    DELETE FROM items it
    WHERE id <> target_id
      AND (it.item_no ILIKE '%TM 125%' OR it.item_no ILIKE '%TM125%' OR lower(it.model) LIKE '%tm 125%' OR lower(it.model) LIKE '%tm125%')
      AND NOT EXISTS (SELECT 1 FROM inventory_movements im WHERE im.item_id = it.id);
  END IF;

  RAISE NOTICE 'TM items normalization complete.';
END;
$$;

-- Verification queries
SELECT id, item_no, cost_of_purchase, srp, model FROM items WHERE item_no ILIKE '%TM125%' OR item_no ILIKE '%TM175%' ORDER BY item_no, id;

SELECT i.item_no, COUNT(im.*) as movements, SUM(COALESCE(im.ending_qty,0)) as units
FROM inventory_movements im
JOIN items i ON i.id = im.item_id
WHERE i.item_no ILIKE '%TM125%' OR i.item_no ILIKE '%TM175%'
GROUP BY i.item_no;
