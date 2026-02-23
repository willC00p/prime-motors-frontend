-- Update: mark specific Solana engine numbers as transferred
-- This updates vehicle_units.transferred = true for the given engine_no values
-- and limits the update to inventory rows belonging to branches matching 'Solana'.

BEGIN;

UPDATE vehicle_units vu
SET transferred = true
FROM inventory_movements im
JOIN branches b ON b.id = im.branch_id
WHERE vu.inventory_id = im.id
  AND b.name ILIKE '%Solana%'
  AND vu.engine_no IN (
    '1P57MJS1121607',
    '1P57MJS1121652',
    '1P57MJS1121618'
  )
  AND coalesce(vu.transferred, false) = false;

-- show the affected rows for review
SELECT v.id, v.engine_no, v.chassis_no, v.transferred, b.name AS branch, im.created_at
FROM vehicle_units v
JOIN inventory_movements im ON im.id = v.inventory_id
JOIN branches b ON b.id = im.branch_id
WHERE v.engine_no IN (
  '1P57MJS1121607',
  '1P57MJS1121652',
  '1P57MJS1121618'
)
ORDER BY im.created_at DESC;

COMMIT;
