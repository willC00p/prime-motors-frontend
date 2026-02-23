import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Find Baggao branch
    const branch = await prisma.branches.findFirst({
      where: { name: { contains: 'Baggao', mode: 'insensitive' } }
    });

    if (!branch) {
      console.log('Baggao branch not found');
      return;
    }

    console.log(`Purging inventory for branch: ${branch.name} (ID: ${branch.id})`);

    // Delete from transferred_history using raw SQL
    const deletedTransferred = await prisma.$executeRaw`
      DELETE FROM transferred_history WHERE branch_id = ${branch.id}
    `;
    console.log(`Deleted ${deletedTransferred} rows from transferred_history`);

    // Delete vehicle_units for this branch
    const deletedVehicles = await prisma.$executeRaw`
      DELETE FROM vehicle_units
      WHERE inventory_id IN (
        SELECT id FROM inventory_movements WHERE branch_id = ${branch.id}
      )
    `;
    console.log(`Deleted ${deletedVehicles} rows from vehicle_units`);

    // Delete inventory_movements
    const deletedMovements = await prisma.inventory_movements.deleteMany({
      where: { branch_id: branch.id }
    });
    console.log(`Deleted ${deletedMovements.count} rows from inventory_movements`);

    console.log('Baggao inventory purged successfully');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
