const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  const sales = await prisma.sales.findMany({
    where: {
      branches: {
        name: { contains: 'Antipolo', mode: 'insensitive' }
      }
    },
    select: {
      total_amount: true,
      dr_no: true
    }
  });

  const total = sales.reduce((sum, s) => sum + Number(s.total_amount), 0);
  
  console.log('Antipolo sales count:', sales.length);
  console.log('Total amount:', total);
  console.log('Expected: 537000');
  console.log('Match:', total === 537000 ? 'YES!' : `NO - Diff: ${537000 - total}`);
  
  await prisma.$disconnect();
}

verify().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
