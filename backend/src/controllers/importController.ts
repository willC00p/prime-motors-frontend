import { Request, Response } from 'express';
import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import { UploadedFile } from 'express-fileupload';

const prisma = new PrismaClient();

interface ExcelRow {
  'BRANCH': string;
  'ITEM NO.'?: string;
  'DATE RECEIVED': string | number;
  'RECEIVED FROM': string;
  'TIN NUMBER': string;
  'DR NO. .'?: string | number;
  'SI NO.'?: string | number;
  'BRAND': string;
  'MODEL': string;
  'COLOR': string;
  'ENGINE NO. '?: string;
  'CHASSIS NO.'?: string;
  'PNPC STATUS': string;
  'COST (Indicate Purchased Price from Other Dealer'?: string | number;
  'Beg. Invty.'?: number;
  'Purchased'?: number;
  'Transfer'?: number;
  'Sales'?: number;
  'Ending Invty.'?: number;
  'Date Sold'?: string | number;
  'REMARKS'?: string;
}

// Mapping of item_no to item_id
// Branch mapping for names in the Excel file
const BRANCH_MAPPING: Record<string, number> = {
  'KAMIAS': 2,  // Using branch ID 2 as requested
  'MAIN': 1,
  'NORTH': 2,
  'SOUTH': 3,
  'EAST': 4,
  'WEST': 5,
  'CENTRAL': 6,
  'MAKATI': 7,
  'BGC': 8
};

const ITEM_MAPPING: Record<string, number> = {
  // New models found in import file
  'TM150T': 5,  // Mapping to TM 150 ID
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

export const importInventory = async (req: Request, res: Response) => {
  try {
    console.log('Import request:', {
      files: req.files,
      body: req.body,
      headers: req.headers
    });
    
    if (!req.files || !('file' in req.files)) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.files.file as UploadedFile;
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
      defval: null  // Return null for empty cells
    });
    
    // Filter out empty rows
    const filteredRawData = rawData.filter(row => 
      Array.isArray(row) && row.some(cell => cell !== null && cell !== '')
    );
    
    console.log('Raw headers:', filteredRawData[0]);
    console.log('First data row:', filteredRawData[1]);
    
    // Now convert to objects with proper headers
    const data = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      dateNF: 'yyyy-mm-dd',
      defval: null  // Return null for empty cells
    }) as ExcelRow[];
    
    // Filter out rows that don't have essential data
    const filteredData = data.filter(row => 
      row['ITEM NO.'] && 
      (row['DR NO. .'] || row['SI NO.']) && 
      (row['ENGINE NO. '] || row['CHASSIS NO.'])
    );
    
    console.log('Total rows:', data.length);

    const results = [];
    const errors = [];
    
    // Group items by DR and SI number
    // Log filtered data
    console.log('Filtered data length:', filteredData.length);
    if (filteredData.length > 0) {
      console.log('Sample filtered row:', filteredData[0]);
    }

    const groupedItems = new Map<string, ExcelRow[]>();
    filteredData.forEach(row => {
      console.log('Processing row:', row);
      const drNo = row['DR NO. .']?.toString() || '';
      const siNo = row['SI NO.']?.toString() || '';
      const itemNo = row['ITEM NO.'];
      console.log('DR No:', drNo, 'SI No:', siNo, 'Item No:', itemNo);
      const key = `${drNo}-${siNo}`;
      if (!groupedItems.has(key)) {
        groupedItems.set(key, []);
      }
      groupedItems.get(key)!.push(row);
    });
    
    console.log('Number of grouped items:', groupedItems.size);
    for (const [key, items] of groupedItems) {
      console.log(`Group ${key}:`, items.length, 'items');
    }

    for (const [key, group] of groupedItems) {
      try {
        // Use the first row for common data
        const firstRow = group[0];
        const itemNo = firstRow['ITEM NO.'] as string;
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
        const branchName = firstRow['BRANCH'] as string;
        const branchId = BRANCH_MAPPING[branchName];
        
        if (!branchId) {
          errors.push(`Unknown branch name: ${branchName}. Using default branch ID 2.`);
        }
        
        // Get supplier name from RECEIVED FROM
        const supplierName = firstRow['RECEIVED FROM'] as string;
        
        // Find or create supplier
        let supplier = await prisma.suppliers.findFirst({
          where: { name: supplierName }
        });
        
        if (!supplier) {
          supplier = await prisma.suppliers.create({
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
        const inventoryMovement = await prisma.inventory_movements.create({
          data: {
            branch_id: 1, // Default branch ID as specified
            supplier_id: 2, // Default supplier ID as specified
            item_id: itemId,
            date_received: new Date(firstRow['DATE RECEIVED']),
            dr_no: firstRow['DR NO. .']?.toString() || '',
            si_no: firstRow['SI NO.']?.toString() || '',
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

        // Track vehicle units for this inventory movement
        type VehicleUnit = {
          id: number;
          inventory_id: number;
          engine_no: string | null;
          chassis_no: string | null;
          unit_number: number;
          status: string | null;
          created_at?: Date | null;
        };
        const vehicleUnits: VehicleUnit[] = [];

        // Create vehicle units for each unique engine/chassis number combination
        for (const row of group) {
          const engineNo = (row['ENGINE NO. '] || '').toString().trim();
          const chassisNo = (row['CHASSIS NO.'] || '').toString().trim();
          
          if (engineNo && chassisNo) {
            const vehicleUnit = await prisma.vehicle_units.create({
              data: {
                inventory_id: inventoryMovement.id,
                engine_no: engineNo,
                chassis_no: chassisNo,
                unit_number: vehicleUnits.length + 1,  // Increment unit number
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
      } catch (err) {
        const error = err as Error;
        errors.push(`Error processing group with key ${key}, Error: ${error.message}`);
      }
    }

    return res.json({
      success: true,
      processed: results.length,
      errors: errors
    });
  } catch (error) {
    const err = error as Error;
    console.error('Import error:', err);
    return res.status(500).json({ error: 'Import failed', details: err.message });
  }
};
