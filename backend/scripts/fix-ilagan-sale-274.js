const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  await prisma.sales.update({
    where: { id: 274 },
    data: { source_of_sales: 'AGENT' }
  });
  console.log('✓ Updated sale 274 source_of_sales to AGENT');
  await prisma.$disconnect();
})();
