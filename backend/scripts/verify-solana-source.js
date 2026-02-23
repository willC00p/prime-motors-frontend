const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  const branch = await prisma.branches.findFirst({
    where: { name: { contains: 'Solana', mode: 'insensitive' } }
  });

  if (!branch) {
    console.log('Branch "Solana" not found');
    await prisma.$disconnect();
    return;
  }

  const sales = await prisma.sales.findMany({
    where: { branch_id: branch.id },
    select: { id: true, dr_no: true, total_amount: true, source_of_sales: true }
  });

  const agent = sales.filter(s => s.source_of_sales === 'AGENT');
  const walkIn = sales.filter(s => s.source_of_sales === 'WALK-IN');
  const nullSource = sales.filter(s => !s.source_of_sales);

  const totalAmount = sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);

  console.log(`\n✓ Found ${sales.length} Solana sales`);
  console.log(`Total Sales: ${sales.length}`);
  console.log(`  AGENT:   ${agent.length}`);
  console.log(`  WALK-IN: ${walkIn.length}`);
  console.log(`  NULL:    ${nullSource.length}`);
  console.log(`Total Amount: ${totalAmount.toLocaleString()}`);

  await prisma.$disconnect();
}

verify().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
