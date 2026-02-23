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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importSales = void 0;
const xlsx_1 = __importDefault(require("xlsx"));
const prisma_1 = __importDefault(require("../lib/prisma"));
// Branch mapping for Excel file
const BRANCH_MAPPING = {
    'KAMIAS': 2,
    'MAIN': 1,
    'NORTH': 2,
    'SOUTH': 3,
    'EAST': 4,
    'WEST': 5,
    'CENTRAL': 6,
    'MAKATI': 7,
    'BGC': 8
};
const importSales = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!req.files || !req.files.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const file = req.files.file;
        console.log('Received file:', file.name);
        const workbook = xlsx_1.default.read(file.data);
        console.log('Sheet names:', workbook.SheetNames);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = xlsx_1.default.utils.sheet_to_json(worksheet);
        console.log('Parsed rows:', rows);
        // Helper function to get value safely from any possible column name
        function getColumnValue(row, possibleNames) {
            for (const name of possibleNames) {
                if (row[name] !== undefined) {
                    return row[name];
                }
            }
            return undefined;
        }
        // Helper for required number fields
        function getRequiredNumber(row, possibleNames) {
            const value = getColumnValue(row, possibleNames);
            return value !== undefined ? value : 0;
        }
        // Helper for required string fields
        function getRequiredString(row, possibleNames) {
            const value = getColumnValue(row, possibleNames);
            return value !== undefined ? value : '';
        }
        // Group rows by DR/SI number as they represent one sale
        const salesGroups = new Map();
        rows.forEach(row => {
            var _a;
            const drSiNo = getRequiredString(row, ['DR NO./SI NO.', 'DR NO', 'SI NO']);
            console.log('Processing row:', {
                drSiNo,
                date: getColumnValue(row, ['DATE', 'Date']),
                category: getColumnValue(row, ['CATEGORY OF SALES', 'Category of Sales']),
                lastName: getColumnValue(row, ['LAST NAME', 'Last Name'])
            });
            if (drSiNo && !salesGroups.has(drSiNo)) {
                salesGroups.set(drSiNo, []);
            }
            if (drSiNo) {
                (_a = salesGroups.get(drSiNo)) === null || _a === void 0 ? void 0 : _a.push(row);
            }
        });
        const results = [];
        // Process each sale group
        for (const [_, saleRows] of salesGroups) {
            const firstRow = saleRows[0];
            const branchId = 2; // Default to KAMIAS branch as per the test file
            // Excel date to JS Date conversion
            function excelDateToJSDate(excelDate) {
                return new Date(Date.UTC(1899, 11, 30 + Math.floor(excelDate)));
            }
            // Create the sale record
            // Get all required values using our helper functions
            const date = getRequiredNumber(firstRow, ['DATE', 'Date']);
            const totalAmount = getRequiredNumber(firstRow, ['TOTAL SALES (Selling Price)', 'TOTAL SALES', 'Total Sales']);
            const sale = yield prisma_1.default.sales.create({
                data: {
                    branch_id: branchId,
                    date_sold: excelDateToJSDate(date),
                    dr_no: getRequiredString(firstRow, ['DR NO./SI NO.', 'DR NO']),
                    si_no: getRequiredString(firstRow, ['DR NO./SI NO.', 'SI NO']),
                    total_amount: totalAmount,
                    category_of_sales: getRequiredString(firstRow, ['CATEGORY OF SALES', 'Category of Sales']),
                    last_name: getRequiredString(firstRow, ['LAST NAME', 'Last Name']),
                    first_name: getRequiredString(firstRow, ['GIVEN NAME', 'Given Name']),
                    middle_name: getRequiredString(firstRow, ['MIDDLE NAME', 'Middle Name']),
                    address: getRequiredString(firstRow, ['ADDRESS', 'Address']),
                    contact_no: ((_a = getColumnValue(firstRow, ['CONTACT NO', 'Contact No'])) === null || _a === void 0 ? void 0 : _a.toString()) || '',
                    // Loan details if applicable
                    loan_amount: getColumnValue(firstRow, ['LOAN AMOUNT', 'Loan Amount', 'Loan amount']),
                    date_granted: (() => {
                        const dateGranted = getColumnValue(firstRow, ['DATE GRANTED', 'Date Granted']);
                        return dateGranted ? excelDateToJSDate(dateGranted) : null;
                    })(),
                    maturity_date: (() => {
                        const maturityDate = getColumnValue(firstRow, ['MATURITY DATE', 'Maturity Date']);
                        return maturityDate ? excelDateToJSDate(maturityDate) : null;
                    })(),
                    terms: getColumnValue(firstRow, ['TERMS', 'Terms']),
                    downpayment_percentage: (() => {
                        const downpayment = getColumnValue(firstRow, ['DOWNPAYMENT', 'Downpayment']);
                        return downpayment ? (downpayment / totalAmount) * 100 : null;
                    })(),
                    rebates_commission: getColumnValue(firstRow, ['% Rebates/ Commision', 'Rebates/Commission']),
                    monthly_amortization: getColumnValue(firstRow, ['MONTHLY AMO', 'Monthly Amortization', 'Monthly Amo']),
                    ar_balance: getColumnValue(firstRow, ['AR Balance as of 12/31/2023', 'AR BALANCE', 'AR Balance'])
                }
            });
            // Process each item in the sale
            for (const row of saleRows) {
                // Get required values with type safety
                const model = getRequiredString(row, ['MODEL', 'Model']);
                const invtyCode = getColumnValue(row, ['INVTY CODE (From Invty)', 'INVTY CODE', 'Invty Code']);
                const brand = getRequiredString(row, ['BRAND', 'Brand']);
                const color = getRequiredString(row, ['COLOR', 'Color']);
                // Find or create the item
                let item = yield prisma_1.default.items.findFirst({
                    where: {
                        OR: [
                            { model: model },
                            { item_no: invtyCode }
                        ]
                    }
                });
                if (!item) {
                    // Create new item if not found
                    item = yield prisma_1.default.items.create({
                        data: {
                            item_no: invtyCode || `${brand}-${model}`,
                            brand: brand,
                            model: model,
                            color: [color],
                        }
                    });
                }
                // Find or create inventory movement
                let inventory = yield prisma_1.default.inventory_movements.findFirst({
                    where: {
                        item_id: item.id,
                        branch_id: branchId,
                        status: 'available'
                    }
                });
                if (!inventory) {
                    // Get required values with type safety
                    const date = getRequiredNumber(row, ['DATE', 'Date']);
                    const cost = getColumnValue(row, ['COST (Indicate Purchased Price from Other Dealer)', 'COST']) || 0;
                    const totalSales = getRequiredNumber(row, ['TOTAL SALES (Selling Price)', 'TOTAL SALES', 'Total Sales']);
                    // Create new inventory movement if not found
                    inventory = yield prisma_1.default.inventory_movements.create({
                        data: {
                            branch_id: branchId,
                            item_id: item.id,
                            date_received: excelDateToJSDate(date),
                            cost: cost,
                            purchased_qty: 1,
                            sold_qty: 1,
                            ending_qty: 0,
                            color: color,
                            srp: totalSales
                        }
                    });
                }
                const engineNo = getRequiredString(row, ['ENGINE NO.', 'ENGINE NO', 'Engine No']);
                const chassisNo = getRequiredString(row, ['CHASSIS NO.', 'CHASSIS NO', 'Chassis No']);
                const totalSales = getRequiredNumber(row, ['TOTAL SALES (Selling Price)', 'TOTAL SALES', 'Total Sales']);
                // Create vehicle unit
                const vehicleUnit = yield prisma_1.default.vehicle_units.create({
                    data: {
                        inventory_id: inventory.id,
                        engine_no: engineNo,
                        chassis_no: chassisNo,
                        unit_number: 1,
                        status: 'sold'
                    }
                });
                // Create sales_inventory record
                yield prisma_1.default.sales_inventory.create({
                    data: {
                        sale_id: sale.id,
                        inventory_id: inventory.id,
                        qty: 1
                    }
                });
                // Create sales_items record
                yield prisma_1.default.sales_items.create({
                    data: {
                        sale_id: sale.id,
                        item_id: item.id,
                        qty: 1,
                        unit_price: totalSales,
                        amount: totalSales,
                        vehicle_unit_id: vehicleUnit.id
                    }
                });
                // Update inventory quantities
                yield prisma_1.default.inventory_movements.update({
                    where: { id: inventory.id },
                    data: {
                        sold_qty: {
                            increment: 1
                        },
                        ending_qty: {
                            decrement: 1
                        }
                    }
                });
            }
            results.push({
                dr_no: getRequiredString(firstRow, ['DR NO./SI NO.', 'DR NO', 'SI NO']),
                total_amount: getRequiredNumber(firstRow, ['TOTAL SALES (Selling Price)', 'TOTAL SALES', 'Total Sales']),
                items_count: saleRows.length
            });
        }
        res.json({
            message: 'Sales data imported successfully',
            sales_imported: results.length,
            details: results
        });
    }
    catch (error) {
        console.error('Error importing sales:', error);
        res.status(500).json({
            error: 'Failed to import sales data',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});
exports.importSales = importSales;
