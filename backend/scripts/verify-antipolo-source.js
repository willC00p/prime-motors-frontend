const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  try {
    const branch = await prisma.branches.findFirst({
      where: { name: { contains: 'Antipolo', mode: 'insensitive' } }
    });

    if (!branch) {
      console.error('❌ Antipolo branch not found');
      process.exit(1);
    }

    const sales = await prisma.sales.findMany({
      where: { branch_id: branch.id },
      select: {
        id: true,
        dr_no: true,
        source_of_sales: true,
        total_amount: true
      },
      orderBy: { id: 'asc' }
    });

    const agentCount = sales.filter(s => s.source_of_sales === 'AGENT').length;
    const walkInCount = sales.filter(s => s.source_of_sales === 'WALK-IN').length;
    const nullCount = sales.filter(s => !s.source_of_sales).length;
    const totalAmount = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0);

    console.log(`✓ Found ${sales.length} Antipolo sales`);
    console.log(`Total Sales: ${sales.length}`);
    console.log(`  AGENT:   ${agentCount}`);
    console.log(`  WALK-IN: ${walkInCount}`);
    console.log(`  NULL:    ${nullCount}`);
    console.log(`Total Amount: ${totalAmount.toLocaleString()}`);

    if (nullCount > 0) {
      console.error('\n❌ WARNING: Found sales with NULL source_of_sales');
      process.exit(1);
    }

    console.log('\n✓ All sales have source_of_sales populated');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
