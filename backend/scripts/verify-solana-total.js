const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  const sales = await prisma.sales.findMany({
    where: {
      branches: {
        name: { contains: 'Solana', mode: 'insensitive' }
      }
    },
    select: {
      total_amount: true
    }
  });

  const total = sales.reduce((sum, s) => sum + Number(s.total_amount), 0);
  
  console.log('Solana sales count:', sales.length);
  console.log('Total amount:', total);
  console.log('Expected: 4034000');
  console.log('Match:', Math.abs(total - 4034000) < 1 ? 'YES!' : `NO - Diff: ${4034000 - total}`);
  
  await prisma.$disconnect();
}

verify().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
