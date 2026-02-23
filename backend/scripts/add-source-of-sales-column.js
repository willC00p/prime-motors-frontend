const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addColumn() {
  try {
    console.log('Adding source_of_sales column to sales table...');
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE sales ADD COLUMN IF NOT EXISTS source_of_sales VARCHAR(20)
    `);
    
    console.log('✓ Column added successfully!');
    
    // Regenerate Prisma client
    console.log('\nNow run: npx prisma generate');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addColumn();
