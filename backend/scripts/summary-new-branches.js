const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function summary() {
  const branches = [
    { name: 'Antipolo', expected: 537000 },
    { name: 'San Mateo', expected: 575000 },
    { name: 'Ilagan', expected: 593000 },
    { name: 'Gattaran', expected: 445000 }
  ];

  console.log('=== SOURCE_OF_SALES SUMMARY ===\n');

  for (const branchInfo of branches) {
    const branch = await prisma.branches.findFirst({
      where: { name: { contains: branchInfo.name, mode: 'insensitive' } }
    });

    if (!branch) {
      console.log(`❌ ${branchInfo.name}: Branch not found\n`);
      continue;
    }

    const sales = await prisma.sales.findMany({
      where: { branch_id: branch.id },
      select: {
        id: true,
        source_of_sales: true,
        total_amount: true
      }
    });

    const agentCount = sales.filter(s => s.source_of_sales === 'AGENT').length;
    const walkInCount = sales.filter(s => s.source_of_sales === 'WALK-IN').length;
    const nullCount = sales.filter(s => !s.source_of_sales).length;
    
    // Convert Decimal to number properly
    const totalAmount = sales.reduce((sum, s) => {
      const amt = s.total_amount ? Number(s.total_amount.toString()) : 0;
      return sum + amt;
    }, 0);

    const status = nullCount === 0 ? '✓' : '❌';
    console.log(`${status} ${branchInfo.name}:`);
    console.log(`   Total Sales: ${sales.length}`);
    console.log(`   AGENT: ${agentCount}, WALK-IN: ${walkInCount}, NULL: ${nullCount}`);
    console.log(`   Total Amount: ₱${totalAmount.toLocaleString()}`);
    console.log();
  }

  await prisma.$disconnect();
}

summary();
