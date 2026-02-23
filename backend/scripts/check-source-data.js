const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const sales = await prisma.sales.findMany({
    select: {
      id: true,
      source_of_sales: true,
      total_amount: true
    },
    take: 20
  });
  
  console.log('Sample sales:');
  sales.forEach(s => {
    console.log(`ID ${s.id}: source="${s.source_of_sales}" amount=${s.total_amount}`);
  });
  
  const sourceCount = await prisma.sales.groupBy({
    by: ['source_of_sales'],
    _count: true
  });
  
  console.log('\nSource breakdown:');
  sourceCount.forEach(s => {
    console.log(`${s.source_of_sales || 'NULL'}: ${s._count} sales`);
  });
  
  await prisma.$disconnect();
})();
