-- Mark vehicle_units as transferred when their inventory_movements remarks indicate Baggao
-- Idempotent: only sets transferred = true where remarks contain 'baggao' (case-insensitive)

UPDATE vehicle_units vu
SET transferred = true
FROM inventory_movements im
WHERE vu.inventory_id = im.id
  AND im.remarks IS NOT NULL
  AND lower(im.remarks) LIKE '%baggao%'
  AND vu.transferred IS DISTINCT FROM true;

-- Return rows updated (recently changed and those matching condition)
SELECT v.id, v.engine_no, v.chassis_no, im.branch_id, im.item_id, im.date_received, im.remarks, v.transferred
FROM vehicle_units v
JOIN inventory_movements im ON im.id = v.inventory_id
WHERE im.remarks IS NOT NULL
  AND lower(im.remarks) LIKE '%baggao%'
ORDER BY v.id;
