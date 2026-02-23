require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    // Find sale id and vehicle unit for Solana DR 105
    const q = await client.query(`
      SELECT s.id AS sale_id, si.id AS sales_item_id, v.id AS vehicle_unit_id, v.engine_no, v.chassis_no
      FROM sales s
      JOIN sales_items si ON si.sale_id = s.id
      JOIN vehicle_units v ON v.id = si.vehicle_unit_id
      WHERE s.dr_no = '105' AND s.branch_id = (SELECT id FROM branches WHERE name ILIKE '%Solana%' LIMIT 1)
      LIMIT 1
    `);
    if (q.rows.length === 0) {
      console.error('No Solana sale found with DR 105');
      process.exit(2);
    }
    const row = q.rows[0];
    const expectedChassis = 'LX8TDK8G0SB001587';
    if (row.chassis_no === expectedChassis) {
      console.log('Chassis already correct for sale', row.sale_id, expectedChassis);
      process.exit(0);
    }

    // Update the vehicle unit chassis to the expected one
    await client.query('BEGIN');
    await client.query(`UPDATE vehicle_units SET chassis_no = $1 WHERE id = $2`, [expectedChassis, row.vehicle_unit_id]);
    await client.query('COMMIT');
    console.log('Updated vehicle_unit', row.vehicle_unit_id, 'chassis from', row.chassis_no, 'to', expectedChassis);
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch {}
    console.error('fix-solana-dr105-chassis failed:', e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
