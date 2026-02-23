const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateOmniPrices() {
  try {
    console.log('Updating OMNI 125 / VM125 / WM125 prices...\n');

    // Find items with model matching OMNI 125, VM125, or WM125
    const items = await prisma.items.findMany({
      where: {
        OR: [
          { model: { contains: 'OMNI 125', mode: 'insensitive' } },
          { model: { contains: 'VM125', mode: 'insensitive' } },
          { model: { contains: 'WM125', mode: 'insensitive' } },
          { model: { equals: 'OMNI 125' } },
          { model: { equals: 'VM125' } },
          { model: { equals: 'WM125' } }
        ]
      }
    });

    console.log(`Found ${items.length} items matching OMNI 125/VM125/WM125\n`);

    const SRP = 72000;
    const COST = 60000; // Assuming ~16.7% margin (typical for motorcycles)

    for (const item of items) {
      console.log(`Updating item ID ${item.id}: ${item.model}`);
      console.log(`  Before: cost_of_purchase=${item.cost_of_purchase}, srp=${item.srp}`);
      
      await prisma.items.update({
        where: { id: item.id },
        data: {
          cost_of_purchase: COST,
          srp: SRP
        }
      });
      
      const margin = SRP - COST;
      console.log(`  After:  cost_of_purchase=${COST}, srp=${SRP}, margin=${margin}\n`);
    }

    console.log(`✓ Updated ${items.length} items successfully`);

  } catch (error) {
    console.error('Error updating prices:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateOmniPrices();
