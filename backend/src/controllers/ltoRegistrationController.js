"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReport = exports.exportToExcel = exports.updateRegistration = exports.createRegistration = exports.getRegistration = exports.listRegistrations = exports.getPendingSales = void 0;
const client_1 = require("@prisma/client");
const catchAsync_1 = require("../utils/catchAsync");
const excelReports_1 = require("../utils/excelReports");
const prisma = new client_1.PrismaClient();
// Get sales that need LTO registration
exports.getPendingSales = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // First get all completed sales that don't have registrations
    const sales = yield prisma.sales.findMany({
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
    const salesWithRegistrations = yield Promise.all(sales.map((sale) => __awaiter(void 0, void 0, void 0, function* () {
        const registration = yield prisma.lto_registrations.findFirst({
            where: { sale_id: sale.id },
            select: {
                id: true,
                status: true,
                csr_number: true,
                sdr_number: true,
                insurance_number: true
            }
        });
        return Object.assign(Object.assign({}, sale), { lto_registrations: registration ? [registration] : [] });
    })));
    res.json(salesWithRegistrations);
}));
// List all LTO registrations with optional filters
exports.listRegistrations = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { status, startDate, endDate } = req.query;
    const where = {};
    if (status)
        where.status = String(status);
    if (startDate && endDate) {
        where.registration_date = {
            gte: new Date(String(startDate)),
            lte: new Date(String(endDate))
        };
    }
    const registrations = yield prisma.lto_registrations.findMany({
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
}));
// Get a single registration
exports.getRegistration = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const registration = yield prisma.lto_registrations.findUnique({
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
}));
// Create new registration
exports.createRegistration = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const _a = req.body, { sale_id, vehicle_unit_id, engine_number, chassis_number, plate_number, mv_file_number, cr_number, or_number, registration_date, expiration_date, status, csr_number, sdr_number, insurance_number, insurance_provider, insurance_policy_number, insurance_expiry, registration_fee, insurance_fee } = _a, otherDetails = __rest(_a, ["sale_id", "vehicle_unit_id", "engine_number", "chassis_number", "plate_number", "mv_file_number", "cr_number", "or_number", "registration_date", "expiration_date", "status", "csr_number", "sdr_number", "insurance_number", "insurance_provider", "insurance_policy_number", "insurance_expiry", "registration_fee", "insurance_fee"]);
    const registration = yield prisma.lto_registrations.create({
        data: Object.assign({ sale: sale_id ? { connect: { id: sale_id } } : undefined, vehicle_unit: vehicle_unit_id ? { connect: { id: vehicle_unit_id } } : undefined, engine_number,
            chassis_number,
            plate_number,
            mv_file_number,
            cr_number,
            or_number, registration_date: registration_date ? new Date(registration_date) : undefined, expiration_date: expiration_date ? new Date(expiration_date) : undefined, status: status || 'pending', csr_number,
            sdr_number,
            insurance_number,
            insurance_provider,
            insurance_policy_number, insurance_expiry: insurance_expiry ? new Date(insurance_expiry) : undefined, registration_fee,
            insurance_fee }, otherDetails),
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
}));
// Update registration
exports.updateRegistration = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const _a = req.body, { sale_id, vehicle_unit, id: _id } = _a, // Destructure id to remove it from updateData
    updateData = __rest(_a, ["sale_id", "vehicle_unit", "id"]);
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
    const registration = yield prisma.lto_registrations.update({
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
}));
// Export LTO registrations to Excel
exports.exportToExcel = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { startDate, endDate, csrNumber, sdrNumber, insuranceNumber } = req.query;
    const where = {};
    if (csrNumber)
        where.csr_number = String(csrNumber);
    if (sdrNumber)
        where.sdr_number = String(sdrNumber);
    if (insuranceNumber)
        where.insurance_number = String(insuranceNumber);
    if (startDate && endDate) {
        where.registration_date = {
            gte: new Date(String(startDate)),
            lte: new Date(String(endDate))
        };
    }
    const registrations = yield prisma.lto_registrations.findMany({
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
    (0, excelReports_1.generateLTORegistrationsExcel)(res, registrations);
}));
// Generate LTO registration report
exports.generateReport = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { startDate, endDate, status } = req.query;
    const where = {};
    if (status)
        where.status = String(status);
    if (startDate && endDate) {
        where.registration_date = {
            gte: new Date(String(startDate)),
            lte: new Date(String(endDate))
        };
    }
    const registrations = yield prisma.lto_registrations.findMany({
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
}));
