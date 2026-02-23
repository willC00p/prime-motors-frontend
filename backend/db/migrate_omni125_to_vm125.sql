-- Migration: merge OMNI125 items into VM125 and update costs/SRP
-- Behavior:
-- 1) If an item with item_no 'VM125' exists, we'll use it; otherwise rename the first OMNI125 item to 'VM125'.
-- 2) Set items.cost_of_purchase = 64080 and items.srp = 72000 for VM125.
-- 3) Reassign inventory_movements.item_id for any OMNI125 items to VM125.
-- 4) Update inventory_movements.cost and inventory_movements.srp to match the new values for reassigned movements.
-- 5) Delete any leftover OMNI125 item records that are no longer referenced.

DO $$
DECLARE
  vm_id INT;
  omni_ids INT[];
  candidate INT;
BEGIN
  -- find existing VM125
  SELECT id INTO vm_id FROM items WHERE item_no ILIKE 'VM125' LIMIT 1;

  -- collect OMNI125 item ids (match item_no or model strictly for OMNI 125)
  -- match both 'OMNI125' and 'OMNI 125' (space) in item_no, and model containing 'omni 125'
  SELECT array_agg(id) INTO omni_ids FROM items WHERE (item_no ILIKE '%OMNI125%' OR item_no ILIKE '%OMNI 125%' OR lower(model) LIKE '%omni 125%');

  IF omni_ids IS NULL OR array_length(omni_ids,1) = 0 THEN
    RAISE NOTICE 'No OMNI125 items found; nothing to do.';
    RETURN;
  END IF;

  IF vm_id IS NULL THEN
    -- rename the first OMNI item to VM125 and use it
    candidate := omni_ids[1];
    UPDATE items SET item_no = 'VM125', cost_of_purchase = 64080, srp = 72000 WHERE id = candidate;
    vm_id := candidate;
    RAISE NOTICE 'Renamed item id % to VM125 and set cost/srp.', vm_id;
  ELSE
    -- update vm costs
    UPDATE items SET cost_of_purchase = 64080, srp = 72000 WHERE id = vm_id;
    RAISE NOTICE 'Updated existing VM125 item id % with new cost/srp.', vm_id;
  END IF;

  -- reassign any other OMNI items to vm_id (exclude vm_id itself if it was originally OMNI renamed)
  UPDATE inventory_movements
  SET item_id = vm_id
  WHERE item_id = ANY(omni_ids) AND item_id <> vm_id;

  -- update movement cost/srp for movements pointing to vm_id (including newly reassigned)
  UPDATE inventory_movements
  SET cost = 64080, srp = 72000
  WHERE item_id = vm_id;

  -- delete old OMNI items that are not the vm_id and are no longer referenced
  DELETE FROM items it
  WHERE id <> vm_id
    AND (it.item_no ILIKE '%OMNI125%' OR it.item_no ILIKE '%OMNI 125%' OR lower(it.model) LIKE '%omni 125%')
    AND NOT EXISTS (SELECT 1 FROM inventory_movements im WHERE im.item_id = it.id);

  RAISE NOTICE 'Migration complete. VM id = %; OMNI ids processed: %', vm_id, omni_ids;
END;
$$;

-- summary for verification
SELECT id, item_no, cost_of_purchase, srp, model FROM items WHERE item_no ILIKE '%VM125%' OR lower(model) LIKE '%omni 125%';

SELECT im.id, im.item_id, i.item_no, im.cost, im.srp, im.remarks FROM inventory_movements im JOIN items i ON i.id = im.item_id WHERE i.item_no ILIKE '%VM125%' LIMIT 50;
