const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  const branch = await prisma.branches.findFirst({
    where: { name: { contains: 'Aurora', mode: 'insensitive' } }
  });

  if (!branch) {
    console.log('❌ Aurora branch not found');
    await prisma.$disconnect();
    return;
  }

  const sales = await prisma.sales.findMany({
    where: { branch_id: branch.id },
    select: {
      id: true,
      source_of_sales: true,
      total_amount: true
    }
  });

  console.log(`✓ Found ${sales.length} Aurora sales`);

  const agent = sales.filter(s => s.source_of_sales === 'AGENT').length;
  const walkIn = sales.filter(s => s.source_of_sales === 'WALK-IN').length;
  const nullSource = sales.filter(s => !s.source_of_sales).length;

  const total = sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);

  console.log(`Total Sales: ${sales.length}`);
  console.log(`  AGENT:   ${agent}`);
  console.log(`  WALK-IN: ${walkIn}`);
  console.log(`  NULL:    ${nullSource}`);
  console.log(`Total Amount: ${total.toLocaleString()}`);

  await prisma.$disconnect();
}

verify().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
