import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import ltoRegistration from './ltoRegistration';

const router = Router();
const prisma = new PrismaClient();

// LTO Registration routes
router.use('/lto-registrations', ltoRegistration);
router.get('/lto-registrations/check-plate/:plateNumber', async (req, res) => {
    const { plateNumber } = req.params;
    
    try {
        const registration = await prisma.lto_registrations.findFirst({
            where: {
                plate_number: plateNumber
            }
        });
        
        res.json({ exists: !!registration });
    } catch (error) {
        res.status(500).json({ error: 'Failed to check plate number' });
    }
});

export default router;
