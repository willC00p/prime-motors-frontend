const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function undoAll() {
  console.log('Undoing ALL sales and resetting auto-increment...');
  
  try {
    // Get count before deletion
    const count = await prisma.sales.count();
    console.log(`Found ${count} sales to delete`);
    
    // Delete all sales (cascades to related tables)
    await prisma.sales.deleteMany({});
    console.log('✓ All sales deleted');
    
    // Reset the auto-increment sequence to 0
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE sales_id_seq RESTART WITH 1`);
    console.log('✓ Sales ID sequence reset to 1');
    
    // Verify all related tables are clean
    const siCount = await prisma.sales_items.count();
    const svCount = await prisma.sales_inventory.count();
    const lpCount = await prisma.loan_payments.count();
    const ltoCount = await prisma.lto_registrations.count();
    
    console.log('\nVerification:');
    console.log(`  sales: 0`);
    console.log(`  sales_items: ${siCount}`);
    console.log(`  sales_inventory: ${svCount}`);
    console.log(`  loan_payments: ${lpCount}`);
    console.log(`  lto_registrations: ${ltoCount}`);
    
    if (siCount === 0 && svCount === 0 && lpCount === 0 && ltoCount === 0) {
      console.log('\n✓ All sales and related data successfully removed');
    } else {
      console.log('\n⚠ Warning: Some related records still exist');
    }
    
    // Reset all vehicle units to available
    const updated = await prisma.vehicle_units.updateMany({
      where: { status: 'sold' },
      data: { status: 'available' }
    });
    console.log(`✓ Reset ${updated.count} vehicle units to available`);
    
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

undoAll().catch((e) => {
  console.error(e);
  process.exit(1);
});
