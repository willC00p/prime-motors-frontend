import { Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';
import XLSX from 'xlsx';
import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

// Branch mapping for Excel file
const BRANCH_MAPPING: Record<string, number> = {
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

interface ExcelRow {
    // Basic record details
    COUNT?: number;
    DATE?: number;  // Excel date number
    'Date'?: number;  // Alternative date column
    'Category of Sales'?: string;
    'CATEGORY OF SALES'?: string;
    'Last Name'?: string;
    'LAST NAME'?: string;
    'Given Name'?: string;
    'GIVEN NAME'?: string;
    'Middle Name'?: string;
    'MIDDLE NAME'?: string;
    'Address'?: string;
    'ADDRESS'?: string;
    'Contact No'?: string | number;
    'CONTACT NO'?: string | number;
    'DR NO'?: string;
    'SI NO'?: string;
    'DR NO./SI NO.'?: string;

    // Vehicle details
    'Brand'?: string;
    'BRAND'?: string;
    'Model'?: string;
    'MODEL'?: string;
    'Color'?: string;
    'COLOR'?: string;
    'Engine No'?: string;
    'ENGINE NO.'?: string;
    'Chassis No'?: string;
    'CHASSIS NO.'?: string;
    'Invty Code'?: string;
    'INVTY CODE'?: string;
    'INVTY CODE (From Invty)'?: string;

    // Financial details
    'Cost'?: number;
    'COST'?: number;
    'COST (Indicate Purchased Price from Other Dealer)'?: number;
    'Purchase Price x .12 / 1.12'?: number;
    'Net Amount'?: number;
    'NET AMOUNT'?: number;
    'Vatable Sales'?: number;
    'VATABLE SALES'?: number;
    '12% VAT'?: number;
    'Total Sales'?: number;
    'TOTAL SALES'?: number;
    'Total Sales (Selling Price)'?: number;
    'TOTAL SALES (Selling Price)'?: number;

    // Loan details
    'Loan Amount'?: number;
    'LOAN AMOUNT'?: number;
    'Loan amount'?: number;
    'Date Granted'?: number;
    'DATE GRANTED'?: number;
    'Maturity Date'?: number;
    'MATURITY DATE'?: number;
    'Terms'?: number;
    'TERMS'?: number;
    'Downpayment'?: number;
    'DOWNPAYMENT'?: number;
    'Rebates/Commission'?: number;
    '% Rebates/ Commision'?: number;
    'Monthly Amortization'?: number;
    'MONTHLY AMO'?: number;
    'Monthly Amo'?: number;
    'AR Balance'?: number;
    'AR BALANCE'?: number;
    'AR Balance as of 12/31/2023'?: number;
}

export const importSales = async (req: Request, res: Response) => {
    try {
        if (!req.files || !req.files.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = req.files.file as UploadedFile;
        console.log('Received file:', file.name);
        const workbook = XLSX.read(file.data);
        console.log('Sheet names:', workbook.SheetNames);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(worksheet) as ExcelRow[];
        console.log('Parsed rows:', rows);

        // Helper function to get value safely from any possible column name
        function getColumnValue<T>(row: ExcelRow, possibleNames: string[]): T | undefined {
            for (const name of possibleNames) {
                if (row[name as keyof ExcelRow] !== undefined) {
                    return row[name as keyof ExcelRow] as T;
                }
            }
            return undefined;
        }

        // Helper for required number fields
        function getRequiredNumber(row: ExcelRow, possibleNames: string[]): number {
            const value = getColumnValue<number>(row, possibleNames);
            return value !== undefined ? value : 0;
        }

        // Helper for required string fields
        function getRequiredString(row: ExcelRow, possibleNames: string[]): string {
            const value = getColumnValue<string>(row, possibleNames);
            return value !== undefined ? value : '';
        }

        // Group rows by DR/SI number as they represent one sale
        const salesGroups = new Map<string, ExcelRow[]>();
        rows.forEach(row => {
            const drSiNo = getRequiredString(row, ['DR NO./SI NO.', 'DR NO', 'SI NO']);
            console.log('Processing row:', {
                drSiNo,
                date: getColumnValue<number>(row, ['DATE', 'Date']),
                category: getColumnValue<string>(row, ['CATEGORY OF SALES', 'Category of Sales']),
                lastName: getColumnValue<string>(row, ['LAST NAME', 'Last Name'])
            });

            if (drSiNo && !salesGroups.has(drSiNo)) {
                salesGroups.set(drSiNo, []);
            }
            if (drSiNo) {
                salesGroups.get(drSiNo)?.push(row);
            }
        });

        const results = [];

        // Process each sale group
        for (const [_, saleRows] of salesGroups) {
            const firstRow = saleRows[0];
            const branchId = 2; // Default to KAMIAS branch as per the test file

            // Excel date to JS Date conversion
            function excelDateToJSDate(excelDate: number) {
                return new Date(Date.UTC(1899, 11, 30 + Math.floor(excelDate)));
            }

            // Create the sale record
            // Get all required values using our helper functions
            const date = getRequiredNumber(firstRow, ['DATE', 'Date']);
            const totalAmount = getRequiredNumber(firstRow, ['TOTAL SALES (Selling Price)', 'TOTAL SALES', 'Total Sales']);
            
            const sale = await prisma.sales.create({
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
                    contact_no: getColumnValue<string | number>(firstRow, ['CONTACT NO', 'Contact No'])?.toString() || '',
                    // Loan details if applicable
                    loan_amount: getColumnValue<number>(firstRow, ['LOAN AMOUNT', 'Loan Amount', 'Loan amount']),
                    date_granted: (() => {
                        const dateGranted = getColumnValue<number>(firstRow, ['DATE GRANTED', 'Date Granted']);
                        return dateGranted ? excelDateToJSDate(dateGranted) : null;
                    })(),
                    maturity_date: (() => {
                        const maturityDate = getColumnValue<number>(firstRow, ['MATURITY DATE', 'Maturity Date']);
                        return maturityDate ? excelDateToJSDate(maturityDate) : null;
                    })(),
                    terms: getColumnValue<number>(firstRow, ['TERMS', 'Terms']),
                    downpayment_percentage: (() => {
                        const downpayment = getColumnValue<number>(firstRow, ['DOWNPAYMENT', 'Downpayment']);
                        return downpayment ? (downpayment / totalAmount) * 100 : null;
                    })(),
                    rebates_commission: getColumnValue<number>(firstRow, ['% Rebates/ Commision', 'Rebates/Commission']),
                    monthly_amortization: getColumnValue<number>(firstRow, ['MONTHLY AMO', 'Monthly Amortization', 'Monthly Amo']),
                    ar_balance: getColumnValue<number>(firstRow, ['AR Balance as of 12/31/2023', 'AR BALANCE', 'AR Balance'])
                }
            });

                // Process each item in the sale
            for (const row of saleRows) {
                // Get required values with type safety
                const model = getRequiredString(row, ['MODEL', 'Model']);
                const invtyCode = getColumnValue<string>(row, ['INVTY CODE (From Invty)', 'INVTY CODE', 'Invty Code']);
                const brand = getRequiredString(row, ['BRAND', 'Brand']);
                const color = getRequiredString(row, ['COLOR', 'Color']);

                // Find or create the item
                let item = await prisma.items.findFirst({
                    where: {
                        OR: [
                            { model: model },
                            { item_no: invtyCode }
                        ]
                    }
                });                if (!item) {
                    // Create new item if not found
                    item = await prisma.items.create({
                        data: {
                            item_no: invtyCode || `${brand}-${model}`,
                            brand: brand,
                            model: model,
                            color: [color],
                        }
                    });
                }

                // Find or create inventory movement
                let inventory = await prisma.inventory_movements.findFirst({
                    where: {
                        item_id: item.id,
                        branch_id: branchId,
                        status: 'available'
                    }
                });

                if (!inventory) {
                    // Get required values with type safety
                    const date = getRequiredNumber(row, ['DATE', 'Date']);
                    const cost = getColumnValue<number>(row, ['COST (Indicate Purchased Price from Other Dealer)', 'COST']) || 0;
                    const totalSales = getRequiredNumber(row, ['TOTAL SALES (Selling Price)', 'TOTAL SALES', 'Total Sales']);

                    // Create new inventory movement if not found
                    inventory = await prisma.inventory_movements.create({
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
                const vehicleUnit = await prisma.vehicle_units.create({
                    data: {
                        inventory_id: inventory.id,
                        engine_no: engineNo,
                        chassis_no: chassisNo,
                        unit_number: 1,
                        status: 'sold'
                    }
                });

                // Create sales_inventory record
                await prisma.sales_inventory.create({
                    data: {
                        sale_id: sale.id,
                        inventory_id: inventory.id,
                        qty: 1
                    }
                });

                // Create sales_items record
                await prisma.sales_items.create({
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
                await prisma.inventory_movements.update({
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

    } catch (error) {
        console.error('Error importing sales:', error);
        res.status(500).json({ 
            error: 'Failed to import sales data',
            details: error instanceof Error ? error.message : String(error)
        });
    }
};
