import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { catchAsync } from '../utils/catchAsync';
import { generateLTORegistrationsExcel } from '../utils/excelReports';

const prisma = new PrismaClient();

// Controller functions
interface LTORegistrationController {
    getPendingSales: (req: Request, res: Response) => Promise<void>;
    listRegistrations: (req: Request, res: Response) => Promise<void>;
    getRegistration: (req: Request, res: Response) => Promise<void>;
    createRegistration: (req: Request, res: Response) => Promise<void>;
    updateRegistration: (req: Request, res: Response) => Promise<void>;
    generateReport: (req: Request, res: Response) => Promise<void>;
}

// Get sales that need LTO registration
export const getPendingSales = catchAsync(async (req: Request, res: Response) => {
    // First get all completed sales that don't have registrations
    const sales = await prisma.sales.findMany({
        where: {
            payment_status: 'completed',
            NOT: {
                lto_registrations: {
                    some: {}
                }
            }
        },
        include: {
            sales_items: {
                include: {
                    vehicle_unit: true,
                    items: true
                }
            }
        },
        orderBy: {
            date_sold: 'desc'
        }
    });
    
    // Then for each sale, try to find its LTO registration
    const salesWithRegistrations = await Promise.all(sales.map(async (sale) => {
        const registration = await prisma.lto_registrations.findFirst({
            where: { sale_id: sale.id },
            select: {
                id: true,
                status: true,
                csr_number: true,
                sdr_number: true,
                insurance_number: true
            }
        });
        
        return {
            ...sale,
            lto_registrations: registration ? [registration] : []
        };
    }));

    res.json(salesWithRegistrations);
});

// List all LTO registrations with optional filters
export const listRegistrations = catchAsync(async (req: Request, res: Response) => {
    const { status, startDate, endDate } = req.query;
    
    const where: any = {};
    if (status) where.status = String(status);
    if (startDate && endDate) {
        where.registration_date = {
            gte: new Date(String(startDate)),
            lte: new Date(String(endDate))
        };
    }

    const registrations = await prisma.lto_registrations.findMany({
        where,
        select: {
            id: true,
            sale_id: true,
            vehicle_unit_id: true,
            plate_number: true,
            engine_number: true,
            chassis_number: true,
            mv_file_number: true,
            cr_number: true,
            or_number: true,
            registration_date: true,
            expiration_date: true,
            insurance_provider: true,
            insurance_policy_number: true,
            insurance_expiry: true,
            csr_number: true,
            sdr_number: true,
            insurance_number: true,
            registration_fee: true,
            insurance_fee: true,
            status: true,
            created_at: true,
            updated_at: true,
            remarks: true,
            sale: {
                include: {
                    sales_items: {
                        include: {
                            vehicle_unit: true,
                            items: true
                        }
                    }
                }
            },
            vehicle_unit: true
        },
        orderBy: {
            created_at: 'desc'
        }
    });

    res.json(registrations);
});

// Get a single registration
export const getRegistration = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const registration = await prisma.lto_registrations.findUnique({
        where: { id: Number(id) },
        select: {
            id: true,
            sale_id: true,
            vehicle_unit_id: true,
            plate_number: true,
            engine_number: true,
            chassis_number: true,
            mv_file_number: true,
            cr_number: true,
            or_number: true,
            registration_date: true,
            expiration_date: true,
            insurance_provider: true,
            insurance_policy_number: true,
            insurance_expiry: true,
            csr_number: true,
            sdr_number: true,
            insurance_number: true,
            registration_fee: true,
            insurance_fee: true,
            status: true,
            created_at: true,
            updated_at: true,
            remarks: true,
            sale: {
                include: {
                    sales_items: {
                        include: {
                            vehicle_unit: true,
                            items: true
                        }
                    }
                }
            },
            vehicle_unit: true
        }
    });

    if (!registration) {
        return res.status(404).json({ error: 'Registration not found' });
    }

    res.json(registration);
});

// Create new registration
export const createRegistration = catchAsync(async (req: Request, res: Response) => {
    const {
        sale_id,
        vehicle_unit_id,
        engine_number,
        chassis_number,
        plate_number,
        mv_file_number,
        cr_number,
        or_number,
        registration_date,
        expiration_date,
        status,
        csr_number,
        sdr_number,
        insurance_number,
        insurance_provider,
        insurance_policy_number,
        insurance_expiry,
        registration_fee,
        insurance_fee,
        ...otherDetails
    } = req.body;

    const registration = await prisma.lto_registrations.create({
        data: {
            sale: sale_id ? { connect: { id: sale_id } } : undefined,
            vehicle_unit: vehicle_unit_id ? { connect: { id: vehicle_unit_id } } : undefined,
            engine_number,
            chassis_number,
            plate_number,
            mv_file_number,
            cr_number,
            or_number,
            registration_date: registration_date ? new Date(registration_date) : undefined,
            expiration_date: expiration_date ? new Date(expiration_date) : undefined,
            status: status || 'pending',
            csr_number,
            sdr_number,
            insurance_number,
            insurance_provider,
            insurance_policy_number,
            insurance_expiry: insurance_expiry ? new Date(insurance_expiry) : undefined,
            registration_fee,
            insurance_fee,
            ...otherDetails
        },
        include: {
            sale: {
                include: {
                    sales_items: {
                        include: {
                            vehicle_unit: true,
                            items: true
                        }
                    }
                }
            },
            vehicle_unit: true
        }
    });

    res.status(201).json(registration);
});

// Update registration
export const updateRegistration = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { 
        sale_id,
        vehicle_unit,
        id: _id, // Destructure id to remove it from updateData
        ...updateData 
    } = req.body;

    // Convert date strings to Date objects
    if (updateData.registration_date) {
        updateData.registration_date = new Date(updateData.registration_date);
    }
    if (updateData.expiration_date) {
        updateData.expiration_date = new Date(updateData.expiration_date);
    }
    if (updateData.insurance_expiry) {
        updateData.insurance_expiry = new Date(updateData.insurance_expiry);
    }

    // Handle relationships properly
    if (sale_id) {
        updateData.sale = {
            connect: { id: sale_id }
        };
    }
    if (updateData.vehicle_unit_id) {
        updateData.vehicle_unit = {
            connect: { id: updateData.vehicle_unit_id }
        };
        delete updateData.vehicle_unit_id;
    }

    const registration = await prisma.lto_registrations.update({
        where: { id: Number(id) },
        data: updateData,
        include: {
            sale: {
                include: {
                    sales_items: {
                        include: {
                            vehicle_unit: true,
                            items: true
                        }
                    }
                }
            },
            vehicle_unit: true
        }
    });

    res.json(registration);
});

// Export LTO registrations to Excel
export const exportToExcel = catchAsync(async (req: Request, res: Response) => {
    const { startDate, endDate, csrNumber, sdrNumber, insuranceNumber } = req.query;

    const where: any = {};
    
    if (csrNumber) where.csr_number = String(csrNumber);
    if (sdrNumber) where.sdr_number = String(sdrNumber);
    if (insuranceNumber) where.insurance_number = String(insuranceNumber);
    
    if (startDate && endDate) {
        where.registration_date = {
            gte: new Date(String(startDate)),
            lte: new Date(String(endDate))
        };
    }

    const registrations = await prisma.lto_registrations.findMany({
        where,
        include: {
            sale: {
                include: {
                    sales_items: {
                        include: {
                            vehicle_unit: true,
                            items: true
                        }
                    }
                }
            },
            vehicle_unit: true
        },
        orderBy: {
            created_at: 'desc'
        }
    });
    
    // Generate and send Excel file
    generateLTORegistrationsExcel(res, registrations);
});

// Generate LTO registration report
export const generateReport = catchAsync(async (req: Request, res: Response) => {
    const { startDate, endDate, status } = req.query;

    const where: any = {};
    if (status) where.status = String(status);
    if (startDate && endDate) {
        where.registration_date = {
            gte: new Date(String(startDate)),
            lte: new Date(String(endDate))
        };
    }

    const registrations = await prisma.lto_registrations.findMany({
        where,
        include: {
            sale: true,
            vehicle_unit: true
        },
        orderBy: {
            created_at: 'desc'
        }
    });

    res.json({
        total: registrations.length,
        pending: registrations.filter(r => r.status === 'pending').length,
        processing: registrations.filter(r => r.status === 'processing').length,
        completed: registrations.filter(r => r.status === 'completed').length,
        registrations
    });
});
