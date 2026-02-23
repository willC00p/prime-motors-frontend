#!/usr/bin/env ts-node
import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  try {
    await client.connect()
    
    console.log('\n=== SOLANA INVENTORY STATUS ===\n')
    
    // Count transferred history rows for Solana
    const { rows: [{ th_count }] } = await client.query(`
      SELECT COUNT(*) as th_count 
      FROM transferred_history th
      JOIN branches b ON b.id = th.branch_id
      WHERE b.name ILIKE '%Solana%'
    `)
    
    // Count active inventory movements for Solana
    const { rows: [{ inv_count }] } = await client.query(`
      SELECT COUNT(*) as inv_count 
      FROM inventory_movements im
      JOIN branches b ON b.id = im.branch_id
      WHERE b.name ILIKE '%Solana%'
    `)
    
    // Count active vehicle units for Solana
    const { rows: [{ vu_count }] } = await client.query(`
      SELECT COUNT(*) as vu_count
      FROM vehicle_units v
      JOIN inventory_movements im ON im.id = v.inventory_id
      JOIN branches b ON b.id = im.branch_id
      WHERE b.name ILIKE '%Solana%'
    `)
    
    console.log('Counts:')
    console.log('  transferred_history (Solana):', th_count)
    console.log('  inventory_movements (Solana):', inv_count)
    console.log('  vehicle_units (Solana):', vu_count)
    
    // Show sample transferred rows
    console.log('\n--- Sample transferred_history rows (Solana) ---')
    const { rows: thSamples } = await client.query(`
      SELECT engine_no, chassis_no, remarks
      FROM transferred_history th
      JOIN branches b ON b.id = th.branch_id
      WHERE b.name ILIKE '%Solana%'
      LIMIT 5
    `)
    thSamples.forEach(r => console.log(`  ${r.engine_no} | ${r.chassis_no} | ${r.remarks}`))
    
    // Show sample active units
    console.log('\n--- Sample active vehicle_units (Solana) ---')
    const { rows: vuSamples } = await client.query(`
      SELECT v.engine_no, v.chassis_no, im.remarks
      FROM vehicle_units v
      JOIN inventory_movements im ON im.id = v.inventory_id
      JOIN branches b ON b.id = im.branch_id
      WHERE b.name ILIKE '%Solana%'
      LIMIT 5
    `)
    vuSamples.forEach(r => console.log(`  ${r.engine_no} | ${r.chassis_no} | ${r.remarks || '(none)'}`))
    
    console.log('\n')
  } catch (e: any) {
    console.error('Error:', e?.message || e)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
