import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// Get all models with their loan templates
export const listModels = async (req: Request, res: Response) => {
	try {
		const models = await prisma.items.findMany({
			include: {
				model_loan_templates: true
			}
		});
		res.json(models);
	} catch (error) {
		console.error('Error fetching models:', error);
		res.status(500).json({ error: 'Failed to fetch models' });
	}
};
