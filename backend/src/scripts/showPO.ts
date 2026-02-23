import prisma from '../lib/prisma';

async function main() {
  const poNumber = process.argv[2];
  if (!poNumber) {
    console.error('Usage: ts-node showPO.ts <PO_NUMBER>');
    process.exit(1);
  }

  const po = await prisma.purchase_orders.findFirst({
    where: { po_number: poNumber },
    include: {
      purchase_order_items: {
        include: { items: true }
      },
      branches: true,
      suppliers: true
    }
  });

  if (!po) {
    console.error('PO not found:', poNumber);
    process.exit(1);
  }

  console.dir(po, { depth: null, colors: true });
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
