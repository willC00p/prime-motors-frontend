import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Get all branches
    const branches = await prisma.branches.findMany({
      orderBy: { name: 'asc' }
    });

    console.log(`\n=== Inventory Status for All Branches ===\n`);
    console.log('Branch'.padEnd(30) + 'Active'.padEnd(12) + 'Transferred'.padEnd(15) + 'Total');
    console.log('='.repeat(70));

    let totalActive = 0;
    let totalTransferred = 0;

    for (const branch of branches) {
      // Count active inventory (vehicle_units)
      const activeCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM vehicle_units vu
        JOIN inventory_movements im ON vu.inventory_id = im.id
        WHERE im.branch_id = ${branch.id}
      `;

      // Count transferred history
      const transferredCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM transferred_history
        WHERE branch_id = ${branch.id}
      `;

      const active = Number(activeCount[0].count);
      const transferred = Number(transferredCount[0].count);
      const total = active + transferred;

      totalActive += active;
      totalTransferred += transferred;

      console.log(
        branch.name.padEnd(30) + 
        active.toString().padEnd(12) + 
        transferred.toString().padEnd(15) + 
        total.toString()
      );
    }

    console.log('='.repeat(70));
    console.log(
      'TOTAL'.padEnd(30) + 
      totalActive.toString().padEnd(12) + 
      totalTransferred.toString().padEnd(15) + 
      (totalActive + totalTransferred).toString()
    );
    console.log('');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
