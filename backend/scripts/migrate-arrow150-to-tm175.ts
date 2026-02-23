import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const EXCLUDED_ENGINE = 'JN1P57QMJ24045995';

  // 1) Identify source items (RM15ST or model contains 'ARROW 150')
  const sourceItems = await prisma.items.findMany({
    where: {
      OR: [
        { item_no: { equals: 'RM15ST', mode: 'insensitive' } },
        { model: { contains: 'ARROW 150', mode: 'insensitive' } },
        { model: { contains: 'M1 ARROW 150', mode: 'insensitive' } },
      ],
    },
    select: { id: true, item_no: true, model: true },
  });

  if (sourceItems.length === 0) {
    console.log('No source items found (RM15ST/ARROW 150). Nothing to update.');
    return;
  }

  const sourceItemIds = sourceItems.map(i => i.id);
  console.log(`Found ${sourceItems.length} source items:`, sourceItems.map(i => `${i.id}:${i.item_no}:${i.model}`).join(', '));

  // 2) Identify target item (TM175 / MONARCH 175)
  const targetCandidates = await prisma.items.findMany({
    where: {
      OR: [
        { item_no: { equals: 'TM175', mode: 'insensitive' } },
        { model: { contains: 'MONARCH 175', mode: 'insensitive' } },
      ],
    },
    orderBy: { id: 'asc' },
  });

  if (targetCandidates.length === 0) {
    console.error('No target item found for TM175 / MONARCH 175. Aborting.');
    return;
  }

  const target = targetCandidates.find(i => i.item_no?.toUpperCase() === 'TM175') || targetCandidates[0];
  console.log(`Using target item id=${target.id} item_no=${target.item_no} model=${target.model}`);

  // 3) Count affected sales_items (excluding the specific engine via related vehicle_unit)
  const affectedCount = await prisma.sales_items.count({
    where: {
      item_id: { in: sourceItemIds },
      NOT: { vehicle_unit: { engine_no: EXCLUDED_ENGINE } },
    },
  });

  console.log(`Sales items to update: ${affectedCount}`);

  if (affectedCount === 0) {
    console.log('No sales_items match the criteria. Nothing to do.');
    return;
  }

  // 4) Perform the update
  const updateResult = await prisma.sales_items.updateMany({
    where: {
      item_id: { in: sourceItemIds },
      NOT: { vehicle_unit: { engine_no: EXCLUDED_ENGINE } },
    },
    data: {
      item_id: target.id,
    },
  });

  console.log(`Updated sales_items rows: ${updateResult.count}`);

  // 5) Verification snapshot: show a few sample rows after update (limit 5)
  const sample = await prisma.sales_items.findMany({
    where: {
      item_id: target.id,
    },
    take: 5,
    orderBy: { id: 'desc' },
    include: {
      sales: { select: { id: true, branch_id: true, date_sold: true, dr_no: true, si_no: true } },
      items: { select: { item_no: true, model: true } },
      vehicle_unit: { select: { engine_no: true, chassis_no: true } },
    },
  });

  console.log('Sample updated sales_items:', sample);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
