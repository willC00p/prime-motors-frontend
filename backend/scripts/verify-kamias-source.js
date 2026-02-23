const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  try {
    const sales = await prisma.sales.findMany({
      where: {
        branches: {
          name: { contains: 'Kamias', mode: 'insensitive' }
        }
      },
      select: {
        id: true,
        dr_no: true,
        date_sold: true,
        source_of_sales: true,
        total_amount: true,
        last_name: true,
        first_name: true
      },
      orderBy: { id: 'asc' }
    });

    console.log(`\n✓ Found ${sales.length} Kamias sales\n`);
    
    let agentCount = 0;
    let walkInCount = 0;
    let nullCount = 0;
    let totalAmount = 0;

    sales.forEach(s => {
      const source = s.source_of_sales || 'NULL';
      if (s.source_of_sales === 'AGENT') agentCount++;
      else if (s.source_of_sales === 'WALK-IN') walkInCount++;
      else nullCount++;
      
      totalAmount += Number(s.total_amount);
      
      const drNo = s.dr_no?.padEnd(10) || 'N/A'.padEnd(10);
      const dateStr = s.date_sold.toISOString().split('T')[0];
      console.log(`ID ${s.id.toString().padStart(3)} | DR ${drNo} | ${dateStr} | ${source.padEnd(7)} | ${s.last_name.padEnd(20).substring(0, 20)} | ${s.total_amount.toString().padStart(8)}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log(`Total Sales: ${sales.length}`);
    console.log(`  AGENT:   ${agentCount}`);
    console.log(`  WALK-IN: ${walkInCount}`);
    console.log(`  NULL:    ${nullCount}`);
    console.log(`\nTotal Amount: ${totalAmount.toLocaleString()}`);
    console.log('Expected: 31 sales, 3,215,000 total');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
