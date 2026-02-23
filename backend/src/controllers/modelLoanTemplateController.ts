import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const createModelLoanTemplate = async (req: Request, res: Response) => {
    try {
        const { 
            item_id, 
            term_months, 
            loan_amount,
            downpayment_percentage,
            rebates_commission,
            monthly_amortization
        } = req.body;


        const template = await prisma.model_loan_templates.create({
            data: {
                item_id,
                term_months,
                loan_amount,
                downpayment_percentage,
                rebates_commission,
                monthly_amortization
            }
        });

        res.json(template);
    } catch (error) {
        console.error('Error creating loan template:', error);
        res.status(500).json({ error: 'Failed to create loan template' });
    }
};

export const getModelLoanTemplates = async (req: Request, res: Response) => {
    try {
        const { item_id } = req.params;
        

        const templates = await prisma.model_loan_templates.findMany({
            where: {
                item_id: parseInt(item_id)
            },
            orderBy: {
                term_months: 'asc'
            }
        });

        res.json(templates);
    } catch (error) {
        console.error('Error fetching loan templates:', error);
        res.status(500).json({ error: 'Failed to fetch loan templates' });
    }
};

export const updateModelLoanTemplate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { 
            loan_amount,
            downpayment_percentage,
            rebates_commission,
            monthly_amortization
        } = req.body;


        const template = await prisma.model_loan_templates.update({
            where: { id: parseInt(id) },
            data: {
                loan_amount,
                downpayment_percentage,
                rebates_commission,
                monthly_amortization
            }
        });

        res.json(template);
    } catch (error) {
        console.error('Error updating loan template:', error);
        res.status(500).json({ error: 'Failed to update loan template' });
    }
};

export const deleteModelLoanTemplate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;


        await prisma.model_loan_templates.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Template deleted successfully' });
    } catch (error) {
        console.error('Error deleting loan template:', error);
        res.status(500).json({ error: 'Failed to delete loan template' });
    }
};
