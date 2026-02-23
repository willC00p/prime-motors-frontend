import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  log: ['query', 'error', 'info', 'warn'],
});

async function checkLoanSales() {
  try {
    console.log('\n=== Checking All Sales with payment_method = loan ===');
    const allLoanSales = await prisma.sales.findMany({
      where: {
        payment_method: 'loan'
      },
      include: {
        loan_payments: true
      }
    });
    console.log(`Found ${allLoanSales.length} total loan sales`);

    console.log('\n=== Checking Sales Missing Required Loan Fields ===');
    allLoanSales.forEach((sale, idx) => {
      console.log(`\nSale #${idx + 1}:`);
      console.log(`ID: ${sale.id}`);
      console.log(`Payment Method: ${sale.payment_method}`);
      console.log(`Date Granted: ${sale.date_granted}`);
      console.log(`Loan Amount: ${sale.loan_amount}`);
      console.log(`Terms: ${sale.terms}`);
      console.log(`First Name: ${sale.first_name}`);
      console.log(`Last Name: ${sale.last_name}`);
      
      // Check for missing required fields
      const missingFields = [];
      if (!sale.date_granted) missingFields.push('date_granted');
      if (!sale.loan_amount) missingFields.push('loan_amount');
      if (!sale.terms) missingFields.push('terms');
      
      if (missingFields.length > 0) {
        console.log('⚠️ Missing fields:', missingFields.join(', '));
      }

      // Check date_granted format and year
      if (sale.date_granted) {
        const dateGranted = new Date(sale.date_granted);
        if (isNaN(dateGranted.getTime())) {
          console.log('⚠️ Invalid date_granted format');
        } else {
          console.log(`Year: ${dateGranted.getFullYear()}`);
        }
      }

      // Check loan payments
      console.log(`Loan Payments: ${sale.loan_payments?.length || 0}`);
    });

    console.log('\n=== Checking Sales by Year ===');
    const salesByYear = new Map<number, number>();
    allLoanSales
      .filter(sale => sale.date_granted)
      .forEach(sale => {
        const year = new Date(sale.date_granted!).getFullYear();
        if (!isNaN(year)) {
          salesByYear.set(year, (salesByYear.get(year) || 0) + 1);
        }
      });
    
    console.log('\nSales distribution by year:');
    salesByYear.forEach((count, year) => {
      console.log(`${year}: ${count} sales`);
    });

    // Check current year specifically
    const currentYear = new Date().getFullYear();
    const currentYearSales = allLoanSales.filter(sale => {
      if (!sale.date_granted) return false;
      const saleYear = new Date(sale.date_granted).getFullYear();
      return !isNaN(saleYear) && saleYear === currentYear;
    });
    
    console.log(`\n=== ${currentYear} Loan Sales ===`);
    console.log(`Total: ${currentYearSales.length}`);
    
    if (currentYearSales.length === 0) {
      console.log('⚠️ No loan sales found for current year!');
      console.log('\nPossible issues:');
      console.log('1. No sales data entered for current year');
      console.log('2. Sales exist but payment_method is not set to "loan"');
      console.log('3. Sales exist but date_granted is not set correctly');
    }

  } catch (error) {
    console.error('Error checking loan sales:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLoanSales();
