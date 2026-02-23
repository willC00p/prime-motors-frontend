const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const branch = await prisma.branches.findFirst({ 
    where: { name: { contains: 'Ilagan' } } 
  });
  
  const sales = await prisma.sales.findMany({ 
    where: { 
      branch_id: branch.id, 
      source_of_sales: null 
    }, 
    select: { 
      id: true, 
      dr_no: true, 
      last_name: true, 
      first_name: true, 
      date_sold: true 
    } 
  });
  
  console.log('NULL source entries:', sales);
  await prisma.$disconnect();
})();
