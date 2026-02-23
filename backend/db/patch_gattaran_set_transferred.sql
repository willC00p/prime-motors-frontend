-- Patch: set transferred flags for existing Gattaran rows where remarks contain 'tuguegarao'
BEGIN;

-- set vehicle_units.transferred = true for inventory movements at Gattaran with remarks containing 'tuguegarao'
UPDATE vehicle_units v
SET transferred = true
FROM inventory_movements im
JOIN branches b ON im.branch_id = b.id
WHERE v.inventory_id = im.id
  AND b.name ILIKE '%gattaran%'
  AND im.remarks IS NOT NULL
  AND lower(im.remarks) LIKE '%tuguegarao%'
  AND v.transferred IS DISTINCT FROM true;

-- also update inventory_movements.transferred_qty to 1 where appropriate
UPDATE inventory_movements im
SET transferred_qty = 1
FROM branches b
WHERE im.branch_id = b.id
  AND b.name ILIKE '%gattaran%'
  AND im.remarks IS NOT NULL
  AND lower(im.remarks) LIKE '%tuguegarao%'
  AND COALESCE(im.transferred_qty,0) = 0;

COMMIT;

-- show summary
SELECT b.name as branch, COUNT(im.*) as movements, SUM(COALESCE(im.ending_qty,0)) as total_units,
       SUM(COALESCE((SELECT COUNT(*) FROM vehicle_units v2 WHERE v2.inventory_id = im.id AND v2.transferred = true),0)) as transferred_units
FROM inventory_movements im
JOIN branches b ON b.id = im.branch_id
WHERE b.name ILIKE '%gattaran%'
GROUP BY b.name;

SELECT v.id, v.engine_no, v.chassis_no, v.transferred, im.remarks, im.date_received
FROM vehicle_units v
JOIN inventory_movements im ON im.id = v.inventory_id
JOIN branches b ON b.id = im.branch_id
WHERE b.name ILIKE '%gattaran%'
ORDER BY v.id DESC
LIMIT 50;
