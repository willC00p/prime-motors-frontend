#!/usr/bin/env ts-node
/**
 * Purge ALL sales and reset counters to start from 1.
 *
 * What this does:
 * - Detaches lto_registrations from sales (sets sale_id = NULL)
 * - Detaches sales_items from vehicle_units (sets vehicle_unit_id = NULL)
 * - Deletes all rows from sales (cascades to loan_payments, sales_items, sales_inventory)
 * - Resets identity sequences for sales, sales_items, loan_payments, sales_inventory
 * - Reports pre/post counts
 *
 * What it does NOT do:
 * - Touch models, suppliers, items, branches, users
 * - Delete lto_registrations (kept but unlinked)
 */

import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function resetSequenceFor(table: string, idColumn = 'id') {
  // Use pg_get_serial_sequence to be robust across environments
  const seqRow = await prisma.$queryRawUnsafe<{ seq: string }[]>(
    `SELECT pg_get_serial_sequence('${table}', '${idColumn}') AS seq`
  )
  const seq = seqRow?.[0]?.seq
  if (!seq) {
    console.warn(`[purge-sales] No sequence found for ${table}.${idColumn} — skipping reset`)
    return
  }
  // Set to start at 1 (is_called=false)
  await prisma.$executeRawUnsafe(`SELECT setval('${seq}'::regclass, 1, false)`)
  console.log(`[purge-sales] Sequence ${seq} reset to start at 1`)
}

async function main() {
  try {
    if (!process.argv.includes('--yes')) {
      console.error('Refusing to purge sales without --yes flag. Run with: ts-node scripts/purge-sales.ts --yes')
      process.exit(2)
    }

    console.log('[purge-sales] Starting purge of ALL sales...')

    // Pre-counts
    const [{ sales_before } = { sales_before: 0 }] = await prisma.$queryRawUnsafe<any>(`SELECT COUNT(*)::int AS sales_before FROM sales`)
    const [{ items_before } = { items_before: 0 }] = await prisma.$queryRawUnsafe<any>(`SELECT COUNT(*)::int AS items_before FROM sales_items`)
    const [{ inv_before } = { inv_before: 0 }] = await prisma.$queryRawUnsafe<any>(`SELECT COUNT(*)::int AS inv_before FROM sales_inventory`)
    const [{ lp_before } = { lp_before: 0 }] = await prisma.$queryRawUnsafe<any>(`SELECT COUNT(*)::int AS lp_before FROM loan_payments`)
    const [{ lto_linked_before } = { lto_linked_before: 0 }] = await prisma.$queryRawUnsafe<any>(`SELECT COUNT(*)::int AS lto_linked_before FROM lto_registrations WHERE sale_id IS NOT NULL`)

    console.log('[purge-sales] Pre-purge counts:', {
      sales: sales_before,
      sales_items: items_before,
      sales_inventory: inv_before,
      loan_payments: lp_before,
      lto_registrations_linked: lto_linked_before,
    })

    // Detach FKs that are NOT cascading on sales deletion
    console.log('[purge-sales] Nulling sale_id in lto_registrations...')
    await prisma.$executeRawUnsafe(`UPDATE lto_registrations SET sale_id = NULL WHERE sale_id IS NOT NULL`)

    // Detach units from items to avoid any potential FK issues in custom constraints
    console.log('[purge-sales] Nulling vehicle_unit_id in sales_items...')
    await prisma.$executeRawUnsafe(`UPDATE sales_items SET vehicle_unit_id = NULL WHERE vehicle_unit_id IS NOT NULL`)

    // Delete all sales (children with ON DELETE CASCADE will be removed automatically)
    console.log('[purge-sales] Deleting all rows from sales (cascades to loan_payments, sales_inventory, sales_items)...')
    await prisma.$executeRawUnsafe(`DELETE FROM sales`)

    // Reset sequences to start at 1
    await resetSequenceFor('sales', 'id')
    await resetSequenceFor('sales_items', 'id')
    await resetSequenceFor('loan_payments', 'id')
    await resetSequenceFor('sales_inventory', 'id')

    // Post-counts
    const [{ sales_after } = { sales_after: 0 }] = await prisma.$queryRawUnsafe<any>(`SELECT COUNT(*)::int AS sales_after FROM sales`)
    const [{ items_after } = { items_after: 0 }] = await prisma.$queryRawUnsafe<any>(`SELECT COUNT(*)::int AS items_after FROM sales_items`)
    const [{ inv_after } = { inv_after: 0 }] = await prisma.$queryRawUnsafe<any>(`SELECT COUNT(*)::int AS inv_after FROM sales_inventory`)
    const [{ lp_after } = { lp_after: 0 }] = await prisma.$queryRawUnsafe<any>(`SELECT COUNT(*)::int AS lp_after FROM loan_payments`)
    const [{ lto_linked_after } = { lto_linked_after: 0 }] = await prisma.$queryRawUnsafe<any>(`SELECT COUNT(*)::int AS lto_linked_after FROM lto_registrations WHERE sale_id IS NOT NULL`)

    console.log('[purge-sales] Completed. Post-purge counts:', {
      sales: sales_after,
      sales_items: items_after,
      sales_inventory: inv_after,
      loan_payments: lp_after,
      lto_registrations_linked: lto_linked_after,
    })
  } catch (err: any) {
    console.error('[purge-sales] Failed:', err?.message || err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
