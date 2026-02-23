"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importInventory = void 0;
const XLSX = __importStar(require("xlsx"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Mapping of item_no to item_id
// Branch mapping for names in the Excel file
const BRANCH_MAPPING = {
    'KAMIAS': 2, // Using branch ID 2 as requested
    'MAIN': 1,
    'NORTH': 2,
    'SOUTH': 3,
    'EAST': 4,
    'WEST': 5,
    'CENTRAL': 6,
    'MAKATI': 7,
    'BGC': 8
};
const ITEM_MAPPING = {
    // New models found in import file
    'TM150T': 5, // Mapping to TM 150 ID
    'SG150T-L': 17,
    'SG150T-8G': 18,
    'SG150T KL': 19,
    'SG150T-8U': 17,
    'SGT150T KL': 19,
    'SG150T 8U': 17,
    // Base models
    'TM 175': 4,
    'TM 150': 5,
    'TM 125': 6,
    'WM125': 7,
    'RM150ST': 8,
    'RM125': 9,
    'RM110CB': 10,
    'RM125CB': 11,
    'RM175CB': 12,
    'RM250ST': 13,
    'SG150-1': 14,
    'SG125-8A-1': 15,
    'SG175-1': 16,
    'SG150-L': 17,
    'SG150-B': 18,
    'RM15ST': 8,
    'RM150 ST': 8
};
const importInventory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        console.log('Import request:', {
            files: req.files,
            body: req.body,
            headers: req.headers
        });
        if (!req.files || !('file' in req.files)) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const file = req.files.file;
        console.log('Reading file from:', file.tempFilePath);
        const workbook = XLSX.readFile(file.tempFilePath);
        console.log('Workbook sheets:', workbook.SheetNames);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        console.log('Worksheet range:', worksheet['!ref']);
        // Convert to array of arrays first to see raw data
        // Find the last row with data
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        console.log('Sheet range:', range);
        // Get all the cell references
        const cells = Object.keys(worksheet).filter(key => key[0] !== '!');
        console.log('Cell references:', cells);
        const rawData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            raw: false,
            dateNF: 'yyyy-mm-dd',
            defval: null // Return null for empty cells
        });
        // Filter out empty rows
        const filteredRawData = rawData.filter(row => Array.isArray(row) && row.some(cell => cell !== null && cell !== ''));
        console.log('Raw headers:', filteredRawData[0]);
        console.log('First data row:', filteredRawData[1]);
        // Now convert to objects with proper headers
        const data = XLSX.utils.sheet_to_json(worksheet, {
            raw: false,
            dateNF: 'yyyy-mm-dd',
            defval: null // Return null for empty cells
        });
        // Filter out rows that don't have essential data
        const filteredData = data.filter(row => row['ITEM NO.'] &&
            (row['DR NO. .'] || row['SI NO.']) &&
            (row['ENGINE NO. '] || row['CHASSIS NO.']));
        console.log('Total rows:', data.length);
        const results = [];
        const errors = [];
        // Group items by DR and SI number
        // Log filtered data
        console.log('Filtered data length:', filteredData.length);
        if (filteredData.length > 0) {
            console.log('Sample filtered row:', filteredData[0]);
        }
        const groupedItems = new Map();
        filteredData.forEach(row => {
            var _a, _b;
            console.log('Processing row:', row);
            const drNo = ((_a = row['DR NO. .']) === null || _a === void 0 ? void 0 : _a.toString()) || '';
            const siNo = ((_b = row['SI NO.']) === null || _b === void 0 ? void 0 : _b.toString()) || '';
            const itemNo = row['ITEM NO.'];
            console.log('DR No:', drNo, 'SI No:', siNo, 'Item No:', itemNo);
            const key = `${drNo}-${siNo}`;
            if (!groupedItems.has(key)) {
                groupedItems.set(key, []);
            }
            groupedItems.get(key).push(row);
        });
        console.log('Number of grouped items:', groupedItems.size);
        for (const [key, items] of groupedItems) {
            console.log(`Group ${key}:`, items.length, 'items');
        }
        for (const [key, group] of groupedItems) {
            try {
                // Use the first row for common data
                const firstRow = group[0];
                const itemNo = firstRow['ITEM NO.'];
                if (!itemNo || !(itemNo in ITEM_MAPPING)) {
                    errors.push(`Unknown item number: ${itemNo}`);
                    continue;
                }
                const itemId = ITEM_MAPPING[itemNo];
                const cost = firstRow['COST (Indicate Purchased Price from Other Dealer'] ?
                    parseFloat(firstRow['COST (Indicate Purchased Price from Other Dealer'].toString().replace(/[^0-9.]/g, '')) :
                    0;
                const dateSold = firstRow['Date Sold'] ?
                    (typeof firstRow['Date Sold'] === 'number' ?
                        // Excel stores dates as numbers, need to convert
                        new Date((firstRow['Date Sold'] - 25569) * 86400 * 1000) :
                        new Date(firstRow['Date Sold'])) :
                    null;
                // Get branch from BRANCH column
                const branchName = firstRow['BRANCH'];
                const branchId = BRANCH_MAPPING[branchName];
                if (!branchId) {
                    errors.push(`Unknown branch name: ${branchName}. Using default branch ID 2.`);
                }
                // Get supplier name from RECEIVED FROM
                const supplierName = firstRow['RECEIVED FROM'];
                // Find or create supplier
                let supplier = yield prisma.suppliers.findFirst({
                    where: { name: supplierName }
                });
                if (!supplier) {
                    supplier = yield prisma.suppliers.create({
                        data: {
                            name: supplierName,
                            contact_person: '',
                            contact_number: ''
                        }
                    });
                }
                // Calculate total quantities from the group
                const totalPurchased = group.reduce((sum, row) => sum + (Number(row['Purchased']) || 0), 0);
                const totalSold = group.reduce((sum, row) => sum + (Number(row['Sales']) || 0), 0);
                const totalTransferred = group.reduce((sum, row) => sum + (Number(row['Transfer']) || 0), 0);
                const totalEndingQty = group.reduce((sum, row) => sum + (Number(row['Ending Invty.']) || 0), 0);
                // Create inventory movement
                // Create inventory movement
                const inventoryMovement = yield prisma.inventory_movements.create({
                    data: {
                        branch_id: 1, // Default branch ID as specified
                        supplier_id: 2, // Default supplier ID as specified
                        item_id: itemId,
                        date_received: new Date(firstRow['DATE RECEIVED']),
                        dr_no: ((_a = firstRow['DR NO. .']) === null || _a === void 0 ? void 0 : _a.toString()) || '',
                        si_no: ((_b = firstRow['SI NO.']) === null || _b === void 0 ? void 0 : _b.toString()) || '',
                        color: typeof firstRow['COLOR'] === 'string' ?
                            firstRow['COLOR'].includes('/') ?
                                firstRow['COLOR'].split('/')[0].trim() : // Take first color if multiple
                                firstRow['COLOR'].trim() :
                            '',
                        cost: cost,
                        beginning_qty: Number(firstRow['Beg. Invty.']) || 0,
                        purchased_qty: totalPurchased,
                        transferred_qty: totalTransferred,
                        sold_qty: totalSold,
                        ending_qty: totalEndingQty,
                        status: dateSold ? 'sold' : 'available'
                    }
                });
                const vehicleUnits = [];
                // Create vehicle units for each unique engine/chassis number combination
                for (const row of group) {
                    const engineNo = (row['ENGINE NO. '] || '').toString().trim();
                    const chassisNo = (row['CHASSIS NO.'] || '').toString().trim();
                    if (engineNo && chassisNo) {
                        const vehicleUnit = yield prisma.vehicle_units.create({
                            data: {
                                inventory_id: inventoryMovement.id,
                                engine_no: engineNo,
                                chassis_no: chassisNo,
                                unit_number: vehicleUnits.length + 1, // Increment unit number
                                status: dateSold ? 'sold' : 'available'
                            }
                        });
                        vehicleUnits.push(vehicleUnit);
                    }
                }
                // Add the inventory movement and all its vehicle units to results
                results.push({
                    inventoryMovement,
                    vehicleUnits,
                    vehicleCount: vehicleUnits.length
                });
            }
            catch (err) {
                const error = err;
                errors.push(`Error processing group with key ${key}, Error: ${error.message}`);
            }
        }
        return res.json({
            success: true,
            processed: results.length,
            errors: errors
        });
    }
    catch (error) {
        const err = error;
        console.error('Import error:', err);
        return res.status(500).json({ error: 'Import failed', details: err.message });
    }
});
exports.importInventory = importInventory;
