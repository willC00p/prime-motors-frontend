import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Find Tumauini branch
    const branch = await prisma.branches.findFirst({
      where: { name: { contains: 'Tumauini', mode: 'insensitive' } }
    });

    if (!branch) {
      console.log('Tumauini branch not found');
      return;
    }

    console.log(`\n=== Tumauini Branch Inventory Status ===\n`);

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

    console.log(`Active inventory (vehicle_units):     ${active}`);
    console.log(`Transferred history:                  ${transferred}`);
    console.log(`Total units:                          ${total}`);

    // Show sample of transferred units
    console.log(`\n=== Sample Transferred Units (showing first 10) ===\n`);
    const transferredSamples = await prisma.$queryRaw<Array<{
      engine_no: string;
      chassis_no: string;
      remarks: string | null;
    }>>`
      SELECT engine_no, chassis_no, remarks
      FROM transferred_history
      WHERE branch_id = ${branch.id}
      LIMIT 10
    `;

    transferredSamples.forEach((unit, index) => {
      console.log(`${index + 1}. Engine: ${unit.engine_no}, Chassis: ${unit.chassis_no}`);
      console.log(`   Remarks: ${unit.remarks || 'N/A'}`);
    });

    // Show sample of active units
    console.log(`\n=== Sample Active Units (showing first 10) ===\n`);
    const activeSamples = await prisma.$queryRaw<Array<{
      engine_no: string;
      chassis_no: string;
      remarks: string | null;
    }>>`
      SELECT vu.engine_no, vu.chassis_no, im.remarks
      FROM vehicle_units vu
      JOIN inventory_movements im ON vu.inventory_id = im.id
      WHERE im.branch_id = ${branch.id}
      LIMIT 10
    `;

    activeSamples.forEach((unit, index) => {
      console.log(`${index + 1}. Engine: ${unit.engine_no}, Chassis: ${unit.chassis_no}`);
      console.log(`   Remarks: ${unit.remarks || 'N/A'}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
