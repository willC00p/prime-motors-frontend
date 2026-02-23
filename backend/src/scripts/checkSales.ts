import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSales() {
  try {
    const sales = await prisma.sales.findMany({
      orderBy: {
        date_sold: 'desc'
      },
      include: {
        loan_payments: true
      }
    });

    console.log('\nSales Records:');
    console.log('=============');
    for (const sale of sales) {
      console.log(`\nID: ${sale.id}`);
      console.log(`Date Sold: ${sale.date_sold}`);
      console.log(`Payment Method: ${sale.payment_method}`);
      console.log(`Total Amount: ${sale.total_amount}`);
      console.log(`Loan Amount: ${sale.loan_amount}`);
      console.log(`Date Granted: ${sale.date_granted}`);
      console.log(`Terms: ${sale.terms}`);
      console.log(`Monthly Amortization: ${sale.monthly_amortization}`);
      console.log(`Customer: ${sale.first_name} ${sale.last_name}`);
      console.log(`Loan Payments Count: ${sale.loan_payments.length}`);
      console.log('------------------------');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSales();
