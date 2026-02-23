import { Router } from 'express';
import prisma from '../lib/prisma';

const router = Router();

router.get('/', async (_, res) => {
  try {
    const branches = await prisma.branches.findMany();
    res.json(branches);
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, address } = req.body;
    const newBranch = await prisma.branches.create({
      data: {
        name,
        address
      }
    });
    res.status(201).json(newBranch);
  } catch (error) {
    console.error('Error creating branch:', error);
    res.status(500).json({ error: 'Failed to create branch' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address } = req.body;
    const updatedBranch = await prisma.branches.update({
      where: { id: Number(id) },
      data: {
        name,
        address
      }
    });
    res.json(updatedBranch);
  } catch (error) {
    console.error('Error updating branch:', error);
    res.status(500).json({ error: 'Failed to update branch' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.branches.delete({
      where: { id: Number(id) }
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting branch:', error);
    res.status(500).json({ error: 'Failed to delete branch' });
  }
});

export default router;
