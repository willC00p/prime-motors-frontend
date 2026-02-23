#!/usr/bin/env node
// Remove duplicate Kamias OMNI 125 sale for dr_no '80' keeping the earliest sale; revert inventory and vehicle status.

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function loadEnvFallback() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?(.+?)"?\s*$/);
    if (m) process.env[m[1]] = process.env[m[1]] || m[2];
  }
}

(async () => {
  loadEnvFallback();
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query('BEGIN');
    const br = await client.query("SELECT id FROM branches WHERE name ILIKE '%kamias%' LIMIT 1");
    const branchId = br.rows[0].id;
    const sales = await client.query(`
      SELECT s.id
      FROM sales s
      JOIN sales_items si ON si.sale_id = s.id
      JOIN items it ON it.id = si.item_id
      WHERE s.branch_id = $1 AND s.dr_no = '80' AND it.model = 'OMNI 125'
      ORDER BY s.id
    `, [branchId]);
    if (sales.rows.length <= 1) {
      console.log('No duplicate OMNI 125 dr 80 found. Nothing to remove.');
      await client.query('ROLLBACK');
      await client.end();
      return;
    }
    const keepId = sales.rows[0].id;
    const deleteIds = sales.rows.slice(1).map(r => r.id);

    for (const saleId of deleteIds) {
      // Fetch linked info
      const info = await client.query(`
        SELECT si.id AS si_id, si.vehicle_unit_id, inv.id AS inv_id
        FROM sales_items si
        JOIN vehicle_units v ON v.id = si.vehicle_unit_id
        JOIN inventory_movements inv ON inv.id = v.inventory_id
        WHERE si.sale_id = $1
      `, [saleId]);
      if (info.rows.length) {
        const { si_id, vehicle_unit_id, inv_id } = info.rows[0];
        // Revert inventory counts and vehicle status
        await client.query('UPDATE inventory_movements SET sold_qty = GREATEST(sold_qty - 1, 0), ending_qty = ending_qty + 1 WHERE id = $1', [inv_id]);
        await client.query("UPDATE vehicle_units SET status = 'available' WHERE id = $1", [vehicle_unit_id]);
        // Delete sales_inventory link
        await client.query('DELETE FROM sales_inventory WHERE sale_id = $1 AND inventory_id = $2', [saleId, inv_id]);
        // Delete sales_item
        await client.query('DELETE FROM sales_items WHERE id = $1', [si_id]);
      } else {
        // If no vehicle unit linked, just delete items
        await client.query('DELETE FROM sales_items WHERE sale_id = $1', [saleId]);
        await client.query('DELETE FROM sales_inventory WHERE sale_id = $1', [saleId]);
      }
      await client.query('DELETE FROM sales WHERE id = $1', [saleId]);
    }
    await client.query('COMMIT');
    console.log(JSON.stringify({ kept_sale_id: keepId, deleted_sale_ids: deleteIds }, null, 2));
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Removal failed:', e.message || e);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
