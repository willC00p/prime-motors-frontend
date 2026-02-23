-- Check Baggao inventory rows and vehicle units

SELECT im.id AS inventory_id, b.name AS branch, it.item_no, im.date_received, im.remarks, im.created_at
FROM inventory_movements im
LEFT JOIN branches b ON b.id = im.branch_id
LEFT JOIN items it ON it.id = im.item_id
WHERE lower(coalesce(im.remarks, '')) LIKE '%baggao%'
ORDER BY im.created_at DESC;

-- Vehicle units linked to Baggao inventories
SELECT v.id AS vehicle_unit_id, v.engine_no, v.chassis_no, v.transferred, v.inventory_id, im.remarks, im.created_at
FROM vehicle_units v
JOIN inventory_movements im ON im.id = v.inventory_id
WHERE lower(coalesce(im.remarks, '')) LIKE '%baggao%'
ORDER BY v.id;
