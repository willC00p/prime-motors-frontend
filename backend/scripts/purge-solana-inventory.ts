#!/usr/bin/env ts-node
/**
 * Purge Solana branch inventory and transferred_history
 */
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('[purge-solana] Starting purge of Solana inventory...')

    // Get Solana branch ID
    const branch = await prisma.branches.findFirst({
      where: { name: { contains: 'Solana', mode: 'insensitive' } }
    })
    
    if (!branch) {
      console.log('[purge-solana] Solana branch not found, nothing to purge.')
      return
    }

    console.log('[purge-solana] Found Solana branch:', branch.name, 'ID:', branch.id)

    // Pre-counts
    const [{ vh_before } = { vh_before: 0 }] = await prisma.$queryRawUnsafe<any>(
      `SELECT COUNT(*)::int AS vh_before FROM vehicle_units v JOIN inventory_movements im ON im.id = v.inventory_id WHERE im.branch_id = $1`,
      branch.id
    )
    const [{ im_before } = { im_before: 0 }] = await prisma.$queryRawUnsafe<any>(
      `SELECT COUNT(*)::int AS im_before FROM inventory_movements WHERE branch_id = $1`,
      branch.id
    )
    const [{ th_before } = { th_before: 0 }] = await prisma.$queryRawUnsafe<any>(
      `SELECT COUNT(*)::int AS th_before FROM transferred_history WHERE branch_id = $1`,
      branch.id
    )

    console.log('[purge-solana] Pre-purge counts:', {
      vehicle_units: vh_before,
      inventory_movements: im_before,
      transferred_history: th_before,
    })

    // Delete vehicle_units tied to Solana inventory_movements
    console.log('[purge-solana] Deleting vehicle_units for Solana...')
    await prisma.$executeRawUnsafe(
      `DELETE FROM vehicle_units WHERE inventory_id IN (SELECT id FROM inventory_movements WHERE branch_id = $1)`,
      branch.id
    )

    // Delete inventory_movements for Solana
    console.log('[purge-solana] Deleting inventory_movements for Solana...')
    await prisma.$executeRawUnsafe(
      `DELETE FROM inventory_movements WHERE branch_id = $1`,
      branch.id
    )

    // Delete transferred_history for Solana
    console.log('[purge-solana] Deleting transferred_history for Solana...')
    await prisma.$executeRawUnsafe(
      `DELETE FROM transferred_history WHERE branch_id = $1`,
      branch.id
    )

    // Post-counts
    const [{ vh_after } = { vh_after: 0 }] = await prisma.$queryRawUnsafe<any>(
      `SELECT COUNT(*)::int AS vh_after FROM vehicle_units v JOIN inventory_movements im ON im.id = v.inventory_id WHERE im.branch_id = $1`,
      branch.id
    )
    const [{ im_after } = { im_after: 0 }] = await prisma.$queryRawUnsafe<any>(
      `SELECT COUNT(*)::int AS im_after FROM inventory_movements WHERE branch_id = $1`,
      branch.id
    )
    const [{ th_after } = { th_after: 0 }] = await prisma.$queryRawUnsafe<any>(
      `SELECT COUNT(*)::int AS th_after FROM transferred_history WHERE branch_id = $1`,
      branch.id
    )

    console.log('[purge-solana] Completed. Post-purge counts:', {
      vehicle_units: vh_after,
      inventory_movements: im_after,
      transferred_history: th_after,
    })
  } catch (err: any) {
    console.error('[purge-solana] Failed:', err?.message || err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
