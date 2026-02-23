import { Router } from 'express';
import prisma from '../lib/prisma';

const router = Router();

router.get('/', async (_, res) => {
  try {
    const items = await prisma.items.findMany();
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items', details: error instanceof Error ? error.message : String(error) });
  }
});

router.post('/', async (req, res) => {
  try {
    const { item_no, brand, model, color, srp, cost_of_purchase } = req.body;
    const colorArray = Array.isArray(color) ? color : color.split(',').map((c: string) => c.trim());
    const data: any = {
      item_no,
      brand,
      model,
      color: colorArray,
      srp: srp ? Number(srp) : null
    };
    if (cost_of_purchase !== undefined) data.cost_of_purchase = cost_of_purchase ? Number(cost_of_purchase) : null;
    const newItem = await prisma.items.create({ data });
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating item:', error);
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return res.status(409).json({ error: 'Item number already exists' });
      }
    }
    res.status(500).json({ error: 'Failed to create item', details: error instanceof Error ? error.message : String(error) });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { item_no, brand, model, color, srp, cost_of_purchase } = req.body;
    const colorArray = Array.isArray(color) ? color : color.split(',').map((c: string) => c.trim());
    const data: any = {
      item_no,
      brand,
      model,
      color: colorArray,
      srp: srp ? Number(srp) : null
    };
    if (cost_of_purchase !== undefined) data.cost_of_purchase = cost_of_purchase ? Number(cost_of_purchase) : null;
    const updatedItem = await prisma.items.update({ where: { id: Number(id) }, data });
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.items.delete({
      where: { id: Number(id) }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

export default router;
