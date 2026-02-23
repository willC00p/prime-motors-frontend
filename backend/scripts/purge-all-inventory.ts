import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Purging all inventory data...\n');

    // Delete all transferred_history
    const deletedTransferred = await prisma.$executeRaw`
      DELETE FROM transferred_history
    `;
    console.log(`Deleted ${deletedTransferred} rows from transferred_history`);

    // Delete all vehicle_units
    const deletedVehicles = await prisma.$executeRaw`
      DELETE FROM vehicle_units
    `;
    console.log(`Deleted ${deletedVehicles} rows from vehicle_units`);

    // Delete all inventory_movements
    const deletedMovements = await prisma.inventory_movements.deleteMany({});
    console.log(`Deleted ${deletedMovements.count} rows from inventory_movements`);

    console.log('\nAll inventory data purged successfully');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
