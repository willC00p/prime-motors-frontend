import { useEffect, useState, useMemo } from 'react';
import { useToast } from '../components/ToastProvider';
import { api } from '../services/api';

export interface Branch { id: number; name: string; address: string; }
interface Item {
  id: number;
  item_no: string;
  brand: string;
  model: string;
  color: string[];
  engine_no?: string;
  chassis_no?: string;
}

interface Supplier {
  id: number;
  name: string;
  tin_number?: string;
}

interface UpcomingItem {
  id: string | number;
  branch_id: number;
  item_id: number;
  supplier_id?: number;
  po_number: string;
  date_received?: string;
  date_issued?: string;
  status: 'pending';
  cost: number;
  srp?: number;
  purchased_qty: number;
  items?: Item;
  branches?: Branch;
  suppliers?: Supplier;
  prepared_by?: string;
  checked_by?: string;
}

interface VehicleUnit {
  chassis_no?: string;
  engine_no?: string;
  status?: 'available' | 'sold' | 'reserved';
  id?: number;
  created_at?: string;
  unit_number?: string;
}

interface InventoryItem {
  id: number;
  branch_id: number;
  item_id: number;
  supplier_id?: number;
  date_received: string;
  dr_no?: string;
  si_no?: string;
  cost: number;
  srp?: number;
  beginning_qty?: number;
  purchased_qty?: number;
  transferred_qty?: number;
  sold_qty?: number;
  ending_qty?: number;
  remarks?: string;
  created_at?: string;
  items?: Item;
  branches?: Branch;
  suppliers?: Supplier;
  color?: string;
  engine_no?: string;
  chassis_no?: string;
  prepared_by?: string;
  checked_by?: string;
  vehicle_units?: VehicleUnit[];  // Changed from units to vehicle_units to match backend
}

const emptyForm: Partial<InventoryItem> = {
  branch_id: undefined,
  item_id: undefined,
  supplier_id: undefined,
  date_received: '',
  cost: 0,
  srp: 0,
  purchased_qty: 0,
  remarks: '',
  vehicle_units: [], // Changed from units to vehicle_units
  color: '',
};

type TabType = 'details' | 'pricing' | 'movement' | 'documents' | 'upcoming' | 'models';
// include transferred tab
type ExtendedTab = TabType | 'transferred';

const Inventory: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<InventoryItem>>(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<ExtendedTab>('details');
  // State for viewing units modal
  const [unitsModalOpen, setUnitsModalOpen] = useState(false);
  const [unitsToView, setUnitsToView] = useState<VehicleUnit[]>([]);
  // Transfer UI state
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferBranch, setTransferBranch] = useState<string>('');
  const [transferRemarks, setTransferRemarks] = useState<string>('');
  const [transferredUnits, setTransferredUnits] = useState<any[]>([]);
  const [transferredLoading, setTransferredLoading] = useState(false);
  const [selectedTransferUnit, setSelectedTransferUnit] = useState<number | null>(null);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferInventoryItem, setTransferInventoryItem] = useState<InventoryItem | null>(null);
  
  // New filter states
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [stockStatus, setStockStatus] = useState<'all' | 'low' | 'out' | 'healthy'>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: new Date().toISOString().split('T')[0]
  });
  type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all-time' | 'custom';
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('all-time');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Constants for inventory status
  const LOW_STOCK_THRESHOLD = 5;
  const HEALTHY_STOCK_THRESHOLD = 10;

  // State for upcoming items from PO
  const [upcomingItems, setUpcomingItems] = useState<UpcomingItem[]>([]);

  // Add Tailwind classes for styling messages

  // Fetch inventory and related lists
  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/inventory'),
      api.get<Branch[]>('/branches'),
      api.get<Item[]>('/items'),
      api.get<Supplier[]>('/suppliers')
    ])
      .then(([invData, br, it, su]) => {
        // Type assertion for the new inventory response format
        const invResponse = invData as { current: InventoryItem[], pending: InventoryItem[] };
        setItems(invResponse.current);
        
        // Transform pending items to match UpcomingItem interface
        const pendingItems = (invResponse.pending as any[])
          .map(item => ({
            id: item.id || item.po_number || '',
            branch_id: item.branch_id,
            item_id: item.item_id,
            supplier_id: item.supplier_id,
            po_number: item.po_number || '',
            date_received: item.date_received,
            date_issued: item.date_issued || '',
            status: 'pending' as const,
            cost: item.cost ?? 0,
            srp: item.srp ?? undefined,
            purchased_qty: item.purchased_qty ?? item.quantity ?? 0,
            items: item.items ?? undefined,
            branches: item.branches ?? undefined,
            suppliers: item.suppliers ?? undefined,
            prepared_by: item.prepared_by ?? '',
            checked_by: item.checked_by ?? ''
          }))
          .filter(item => !item.date_received); // Only show items not yet received
        setUpcomingItems(pendingItems);
        
        setBranches(br);
        setAllItems(it);
        setSuppliers(su);
      })
  .catch(() => { setError('Failed to load inventory'); showToast({ type: 'error', message: 'Failed to load inventory' }); })
      .finally(() => setLoading(false));
  }, []);

    // Fetch transferred units for the Transferred tab
    const fetchTransferred = async () => {
      try {
        setTransferredLoading(true);
        const res = await api.get<any[]>('/inventory/transferred');
        setTransferredUnits(res || []);
      } catch (e: any) {
        console.error('Failed to load transferred units', e);
      } finally {
        setTransferredLoading(false);
      }
    };

    useEffect(() => { fetchTransferred(); }, []);

  // Filter transferred units by global search, selected branch and date range
  const filteredTransferredUnits = useMemo(() => {
    if (!Array.isArray(transferredUnits)) return [];
    const s = (search || '').toLowerCase().trim();
    const start = dateRange.start ? new Date(dateRange.start) : null;
    const end = dateRange.end ? new Date(dateRange.end) : null;

    return transferredUnits.filter((u: any) => {
      // Branch match: either branch id or branch name
      const branchMatch = !selectedBranch ||
        (u.branch_id && Number(selectedBranch) === Number(u.branch_id)) ||
        (u.branch && u.branch === (branches.find(b => b.id === Number(selectedBranch))?.name));

      // Date match: check common fields
      const dateStr = u.transferred_at || u.date || u.created_at || u.transfer_date || '';
      const dateOk = (() => {
        if (!start && !end) return true;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return false;
        if (start && d < start) return false;
        if (end && d > end) return false;
        return true;
      })();

      // Search match across engine, chassis, item brand/model, branch and item_no
      const matchesSearch = !s || [
        u.engine_no,
        u.chassis_no,
        u.branch,
        u.item?.brand,
        u.item?.model,
        u.item?.item_no,
        ...(Array.isArray(u.counterparts) ? u.counterparts.flatMap((c: any) => [c.engine_no, c.chassis_no, c.branch]) : [])
      ].some((val: any) => typeof val === 'string' && val.toLowerCase().includes(s));

      return branchMatch && dateOk && matchesSearch;
    });
  }, [transferredUnits, search, selectedBranch, dateRange, branches]);

  // Helper: set date range based on selected period
  function setRangeForPeriod(period: PeriodType) {
    const today = new Date();
    const toISO = (d: Date) => d.toISOString().split('T')[0];
    let start = '';
    let end = toISO(today);
    if (period === 'daily') {
      start = end;
    } else if (period === 'weekly') {
      const day = today.getDay(); // 0 (Sun) - 6 (Sat)
      const diffToMonday = (day === 0 ? -6 : 1) - day; // Monday as start
      const monday = new Date(today);
      monday.setDate(today.getDate() + diffToMonday);
      start = toISO(monday);
    } else if (period === 'monthly') {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      start = toISO(first);
    } else if (period === 'yearly') {
      const jan1 = new Date(today.getFullYear(), 0, 1);
      start = toISO(jan1);
    } else if (period === 'all-time') {
      start = '';
      end = toISO(today);
    } else {
      // custom - don't change existing dateRange
      return;
    }
    setDateRange({ start, end });
  }

  // Filtered items
  // Export inventory to Excel
  const handleExportExcel = async () => {
    try {
      setLoading(true);
      
      if (!filtered || filtered.length === 0) {
        throw new Error('No inventory data to export');
      }
      
      console.log('Starting export process with', filtered.length, 'items');
      
      // Create a flat list of all units with their details, preserving numeric values
      const inventoryData = filtered.flatMap(item => 
        (item.vehicle_units || []).map(unit => ({
          // Branch Information
          'Branch': item.branches?.name || '',
          'Branch Address': item.branches?.address || '',
          
          // Item Details
          'Item No': item.items?.item_no || '',
          'Brand': item.items?.brand || '',
          'Model': item.items?.model || '',
          'Color': item.color || '',
          
          // Unit Details
          'Engine Number': unit.engine_no || '',
          'Chassis Number': unit.chassis_no || '',
          'Unit Status': unit.status || 'available',
          
          // Pricing Information
          'Unit Cost': item.cost || 0,
          'SRP': item.srp || 0,
          'Margin %': item.cost && item.srp ? 
            Number((((Number(item.srp) - Number(item.cost)) / Number(item.cost)) * 100).toFixed(2)) :
            0,
          
          // Document Information
          'Date Received': item.date_received ? new Date(item.date_received) : null,
          'Days in Inventory': item.date_received ? 
            Math.max(0, Math.floor((new Date().getTime() - new Date(item.date_received).getTime()) / (1000 * 60 * 60 * 24))) :
            0,
          'Supplier': item.suppliers?.name || '',
          'Supplier TIN': item.suppliers?.tin_number || '',
          'DR Number': item.dr_no || '',
          'SI Number': item.si_no || '',
          'Remarks': item.remarks || '',
          // Summary Columns (blank at unit level)
          'Available': '',
          'Sold': '',
          'Total': ''
        })));
      
      // Calculate status counts
      const statusCounts = inventoryData.reduce((acc, item) => {
        const status = item['Unit Status'];
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate inventory per model and branch
      const branchModelInventory = inventoryData.reduce((acc, item) => {
        const branch = item['Branch'];
        const itemNo = item['Item No'];
        const model = item['Model'];
        const brand = item['Brand'];
        const key = `${branch} - ${itemNo}`;
        
        if (!acc[key]) {
          acc[key] = {
            branch,
            itemNo,
            brand,
            model,
            available: 0,
            sold: 0,
            total: 0
          };
        }
        
        if (item['Unit Status'] === 'available') acc[key].available++;
        if (item['Unit Status'] === 'sold') acc[key].sold++;
        acc[key].total++;
        
        return acc;
      }, {} as Record<string, { branch: string; itemNo: string; brand: string; model: string; available: number; sold: number; total: number; }>);

      // Create branch-model summary rows
      const branchModelSummaryRows = Object.values(branchModelInventory).map(summary => ({
        'Branch': summary.branch,
        'Branch Address': '',
        'Item No': summary.itemNo,
        'Brand': summary.brand,
        'Model': summary.model,
        'Color': '',
        'Engine Number': '',
        'Chassis Number': '',
        'Unit Status': '',
        'Unit Cost': '',
        'SRP': '',
        'Margin %': '',
        'Date Received': '',
        'Days in Inventory': '',
        'Supplier': '',
        'Supplier TIN': '',
        'DR Number': '',
        'SI Number': '',
        'Remarks': '',
        'Available': summary.available,
        'Sold': summary.sold,
        'Total': summary.total
      }));

      // Calculate overall summary data
      const summary = {
        'Branch': 'OVERALL SUMMARY',
        'Branch Address': `Total Branches: ${new Set(inventoryData.map(item => item['Branch'])).size}`,
        'Item No': `Total Models: ${new Set(inventoryData.map(item => item['Item No'])).size}`,
        'Brand': '',
        'Model': '',
        'Color': `Total Colors: ${new Set(inventoryData.map(item => item['Color'])).size}`,
        'Engine Number': '',
        'Chassis Number': '',
        'Unit Status': '',
        'Unit Cost': inventoryData.reduce((sum, item) => sum + Number(item['Unit Cost']), 0),
        'SRP': inventoryData.reduce((sum, item) => sum + Number(item['SRP']), 0),
        'Margin %': inventoryData.length > 0 ? 
          Number((inventoryData.reduce((sum, item) => sum + Number(item['Margin %']), 0) / 
          inventoryData.filter(item => Number(item['Margin %']) > 0).length).toFixed(2)) : 
          0,
        'Date Received': '',
        'Days in Inventory': inventoryData.length > 0 ?
          Math.round(inventoryData.reduce((sum, item) => sum + Number(item['Days in Inventory']), 0) / 
          inventoryData.filter(item => Number(item['Days in Inventory']) > 0).length) :
          0,
        'Supplier': `Total Suppliers: ${new Set(inventoryData.map(item => item['Supplier'])).size}`,
        'Supplier TIN': '',
        'DR Number': '',
        'SI Number': '',
        'Remarks': '*** End of Report ***',
        'Available': statusCounts['available'] || 0,
        'Sold': statusCounts['sold'] || 0,
        'Total': (statusCounts['available'] || 0) + (statusCounts['reserved'] || 0) + (statusCounts['sold'] || 0)
      };

      // Add empty row, branch-model summary section title, branch-model summaries, empty row, and overall summary
      const branchModelTitle = {
        'Branch': 'INVENTORY BY BRANCH AND MODEL',
        'Branch Address': '',
        'Item No': '',
        'Brand': '',
        'Model': '',
        'Color': '',
        'Engine Number': '',
        'Chassis Number': '',
        'Unit Status': '',
        'Unit Cost': '',
        'SRP': '',
        'Margin %': '',
        'Date Received': '',
        'Days in Inventory': '',
        'Supplier': '',
        'Supplier TIN': '',
        'DR Number': '',
        'SI Number': '',
        'Remarks': '',
        'Available': '',
        'Sold': '',
        'Total': ''
      };

      const emptyRow = Object.fromEntries(Object.keys(summary).map(key => [key, '']));
      const finalData = [
        ...inventoryData,
        emptyRow,
        branchModelTitle,
        ...branchModelSummaryRows,
        emptyRow,
        summary
      ];

  // Convert to Excel using a styling-capable client library
  const XLSX = await import('xlsx-js-style');
      const workbook = XLSX.utils.book_new();      // First create an empty worksheet
      const worksheet = XLSX.utils.aoa_to_sheet([]);

      // Define headers explicitly to ensure consistent ordering
      const headers = [
        'Branch',
        'Branch Address',
        'Item No',
        'Brand',
        'Model',
        'Color',
        'Engine Number',
        'Chassis Number',
        'Unit Status',
        'Unit Cost',
        'SRP',
        'Margin %',
        'Date Received',
        'Days in Inventory',
        'Supplier',
        'Supplier TIN',
        'DR Number',
        'SI Number',
        'Remarks',
        'Available',
        'Sold',
        'Total'
      ];

      // Add title and date at the top
      // Prepare branch/period subtitle
      const branchLabel = selectedBranch ? (branches.find(b => b.id === Number(selectedBranch))?.name || 'Selected Branch') : 'All Branches';
      const periodText = selectedPeriod === 'custom'
        ? `Custom (${dateRange.start || 'start'} to ${dateRange.end || 'today'})`
        : selectedPeriod.replace(/\b\w/g, (c) => c.toUpperCase());

      XLSX.utils.sheet_add_aoa(worksheet, [
        ['PRIME MOTORS - VEHICLE INVENTORY REPORT'],
        [`Branch: ${branchLabel}    •    Period: ${periodText}    •    Generated: ${new Date().toLocaleString()}`],
        [''], // Empty row after title
        // Add headers
        headers
      ], { origin: 'A1' });

      // Add the data starting from row 5 (after title, date, empty row, and headers)
      XLSX.utils.sheet_add_json(worksheet, finalData, {
        origin: 'A5',
        skipHeader: true // Skip header since we already added it
      });

      // Color code rows based on status
      finalData.forEach((row, index) => {
        const rowIndex = index + 5; // Data starts at row 5
        const status = row['Unit Status'];
        let fillColor;
        
        switch(status) {
          case 'available':
            fillColor = 'E3F2FD'; // Light blue
            break;
          case 'reserved':
            fillColor = 'FFF3E0'; // Light orange
            break;
          case 'sold':
            fillColor = 'FFEBEE'; // Light red
            break;
          default:
            fillColor = 'FFFFFF'; // White
        }

        // Apply background color to each cell in the row
        Object.keys(row).forEach((_, colIndex) => {
          const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
          if (!worksheet[cellRef]) worksheet[cellRef] = {};
          worksheet[cellRef].s = {
            ...worksheet[cellRef].s,
            fill: { patternType: 'solid', fgColor: { rgb: fillColor } },
            border: {
              top: { style: 'thin' },
              bottom: { style: 'thin' },
              left: { style: 'thin' },
              right: { style: 'thin' }
            }
          };
        });
      });

      // Adjust row heights for title
      if (!worksheet['!rows']) worksheet['!rows'] = [];
      worksheet['!rows'][0] = { hpt: 30 }; // Title row height
      worksheet['!rows'][1] = { hpt: 25 }; // Date row height
      worksheet['!rows'][2] = { hpt: 20 }; // Empty row height

      // Merge cells for title
      if (!worksheet['!merges']) worksheet['!merges'] = [];
      worksheet['!merges'].push(
        { s: { r: 0, c: 0 }, e: { r: 0, c: 20 } },  // Title
        { s: { r: 1, c: 0 }, e: { r: 1, c: 20 } }   // Subtitle
      );

      // Style the title, date, and headers
      const headerStyle = {
        font: { bold: true, color: { rgb: '000000' } },
        // Neon green header fill
        fill: { patternType: 'solid', fgColor: { rgb: '39FF14' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' }
        }
      };

      const reportTitleStyle = {
        font: { bold: true, sz: 16 },
        alignment: { horizontal: 'center' }
      };

      // Apply styles to title and date
      ['A1', 'A2'].forEach(cellRef => {
        if (!worksheet[cellRef]) worksheet[cellRef] = {};
        worksheet[cellRef].s = reportTitleStyle;
      });

      // Apply styles to headers (row 4)
      headers.forEach((_, index) => {
        const cellRef = XLSX.utils.encode_cell({ r: 3, c: index });
        if (!worksheet[cellRef]) worksheet[cellRef] = {};
        worksheet[cellRef].s = headerStyle;
      });

      // Style the summary sections
      const summaryStyle = {
        font: { bold: true },
        fill: { patternType: 'solid', fgColor: { rgb: 'FFF9C4' } }, // Light yellow background
        border: {
          top: { style: 'medium' },
          bottom: { style: 'medium' }
        },
        alignment: { horizontal: 'center' }
      };

      const titleStyle = {
        font: { bold: true, sz: 12 },
        fill: { patternType: 'solid', fgColor: { rgb: 'E3F2FD' } }, // Light blue background
        alignment: { horizontal: 'center' },
        border: {
          top: { style: 'medium' },
          bottom: { style: 'medium' }
        }
      };

      // Find the row indices for the different sections
      const titleRowIndex = inventoryData.length + 6; // After data, empty row, and starting at 5
  const summaryRowIndex = finalData.length + 4; // Last row

      // Style the branch-model summary title
      Object.entries(branchModelTitle).forEach((_, colIndex) => {
        const cellRef = XLSX.utils.encode_cell({ r: titleRowIndex, c: colIndex });
        if (!worksheet[cellRef]) worksheet[cellRef] = {};
        worksheet[cellRef].s = titleStyle;
      });

      // Style the branch-model summary rows
      branchModelSummaryRows.forEach((_, rowOffset) => {
        Object.entries(branchModelTitle).forEach((_, colIndex) => {
          const cellRef = XLSX.utils.encode_cell({ r: titleRowIndex + 1 + rowOffset, c: colIndex });
          if (!worksheet[cellRef]) worksheet[cellRef] = {};
          worksheet[cellRef].s = {
            font: { bold: false },
            alignment: { horizontal: 'left' },
            border: {
              bottom: { style: 'thin' }
            }
          };
        });
      });

      // Style the overall summary row
      Object.entries(summary).forEach((_, colIndex) => {
        const cellRef = XLSX.utils.encode_cell({ r: summaryRowIndex, c: colIndex });
        if (!worksheet[cellRef]) worksheet[cellRef] = {};
        worksheet[cellRef].s = summaryStyle;
      });

  // Add the worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Vehicle Units');

      // Define and set column widths
      const wscols = [
        {wch: 25}, // Branch
        {wch: 25}, // Branch Address
        {wch: 12}, // Item No
        {wch: 12}, // Brand
        {wch: 20}, // Model
        {wch: 12}, // Color
        {wch: 18}, // Engine Number
        {wch: 18}, // Chassis Number
        {wch: 30}, // Status - Made wider for better visibility
        {wch: 12}, // Unit Cost
        {wch: 12}, // SRP
        {wch: 12}, // Margin %
        {wch: 15}, // Date Received
        {wch: 12}, // Days in Inventory
        {wch: 20}, // Supplier
        {wch: 15}, // Supplier TIN
        {wch: 12}, // DR No
        {wch: 12}, // SI No
        {wch: 25}, // Remarks
        {wch: 12}, // Available
        {wch: 12}, // Sold
        {wch: 12}  // Total
      ];
      worksheet['!cols'] = wscols;
      
      // Validate workbook before saving
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('Workbook was not properly created');
      }

      if (!worksheet['!ref']) {
        throw new Error('Worksheet is empty or invalid');
      }

      // Format numeric cells and dates
      // Data starts at row 5 (after title, date, empty row, and headers)
      const headerRow = 4;
      for (let rowIndex = headerRow + 1; rowIndex <= finalData.length + headerRow; rowIndex++) {
        // Format Unit Cost and SRP as currency
        const costCell = XLSX.utils.encode_cell({ r: rowIndex, c: 9 });
        const srpCell = XLSX.utils.encode_cell({ r: rowIndex, c: 10 });
        if (worksheet[costCell]?.v) worksheet[costCell].z = '"₱"#,##0.00';
        if (worksheet[srpCell]?.v) worksheet[srpCell].z = '"₱"#,##0.00';
        
        // Format Margin as percentage
        const marginCell = XLSX.utils.encode_cell({ r: rowIndex, c: 11 });
        if (worksheet[marginCell]?.v) worksheet[marginCell].z = '0.00"%"';
        
        // Format Date Received
        const dateCell = XLSX.utils.encode_cell({ r: rowIndex, c: 12 });
        if (worksheet[dateCell]?.v) worksheet[dateCell].z = 'mm/dd/yyyy';
      }

      // Build dynamic filename with branch and period
      const today = new Date().toISOString().split('T')[0];
      const branchName = selectedBranch ? (branches.find(b => b.id === Number(selectedBranch))?.name?.replace(/\s+/g, '_') || 'Branch') : 'AllBranches';
      const periodLabel = selectedPeriod.replace(/\s+/g, '-');
      XLSX.writeFile(workbook, `Prime_Motors_Inventory_${branchName}_${periodLabel}_${today}.xlsx`);
  setSuccess('Inventory exported successfully to Excel!');
  showToast({ type: 'success', message: 'Inventory exported successfully to Excel!' });
    } catch (err) {
      console.error('Export error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
  setError(`Failed to export inventory: ${errorMessage}`);
  showToast({ type: 'error', message: `Failed to export inventory: ${errorMessage}` });
      
      // Additional debugging information
      console.debug('Export debug info:', {
        filteredDataLength: filtered?.length || 0,
        hasData: !!filtered,
        error: err
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate inventory report
  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      // Generate PDF using jspdf
      const { jsPDF } = await import('jspdf');
      const { autoTable } = await import('jspdf-autotable');
      
      const doc = new jsPDF();
      let yPos = 15;
      
      // Add title and date
      doc.setFontSize(16);
      doc.text('Inventory Report', 14, yPos);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, yPos + 10);
      yPos += 25;

  // Add report metadata (removed Prepared/Checked by per requirements)
  yPos += 10;

      // Add summary table
      const totalValue = filtered.reduce((sum, item) => sum + (item.cost * (item.ending_qty || 0)), 0);
      const summaryData = [
        ['Total Items', filtered.length.toString()],
        ['Total Value', totalValue.toLocaleString()],
        ['Low Stock Items', filtered.filter(item => (item.ending_qty || 0) < 5).length.toString()],
        ['Total SRP Value', (totalValue * 1.2).toLocaleString()],
        ['Expected Margin', (totalValue * 0.2).toLocaleString()]
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        margin: { left: 14 },
        headStyles: { fillColor: [59, 130, 246] }
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;

      // Add inventory status
      doc.setFontSize(14);
      doc.text('Inventory Status by Branch', 14, yPos);
      yPos += 10;

      const branchSummary = filtered.reduce((acc, item) => {
        const branch = item.branches?.name || 'Unassigned';
        if (!acc[branch]) {
          acc[branch] = {
            totalItems: 0,
            totalValue: 0,
            lowStock: 0
          };
        }
        acc[branch].totalItems += item.ending_qty || 0;
        acc[branch].totalValue += (item.cost * (item.ending_qty || 0));
        if ((item.ending_qty || 0) < 5) acc[branch].lowStock++;
        return acc;
      }, {} as Record<string, { totalItems: number; totalValue: number; lowStock: number; }>);

      const branchData = Object.entries(branchSummary).map(([branch, data]) => [
        branch,
        data.totalItems.toString(),
        data.totalValue.toLocaleString(),
        data.lowStock.toString()
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Branch', 'Total Items', 'Total Value', 'Low Stock Items']],
        body: branchData,
        theme: 'grid',
        margin: { left: 14 },
        headStyles: { fillColor: [59, 130, 246] }
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;

      // Add low stock items
      doc.setFontSize(14);
      doc.text('Low Stock Items (Less than 5)', 14, yPos);
      yPos += 10;

      const lowStockData = filtered
        .filter(item => (item.ending_qty || 0) < 5)
        .map(item => [
          item.items?.item_no || '',
          item.items?.brand || '',
          item.items?.model || '',
          (item.ending_qty || 0).toString(),
          item.cost?.toLocaleString() || '0',
          (Number(item.cost) * 1.2)?.toLocaleString() || '0'
        ]);

      if (lowStockData.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [['Item No', 'Brand', 'Model', 'Stock', 'Cost', 'SRP']],
          body: lowStockData,
          theme: 'grid',
          margin: { left: 14 },
          headStyles: { fillColor: [59, 130, 246] }
        });
      } else {
        doc.text('No low stock items found.', 14, yPos);
      }

      // Add signature lines at the bottom
      yPos = (doc as any).lastAutoTable.finalY + 30;
      
  // Removed signature lines (Prepared/Checked by) per requirements

      // Save the PDF
      doc.save(`inventory-report-${new Date().toISOString().split('T')[0]}.pdf`);
  setSuccess('Report generated successfully!');
  showToast({ type: 'success', message: 'Report generated successfully!' });
    } catch (err) {
  setError('Failed to generate report');
  showToast({ type: 'error', message: 'Failed to generate report' });
    } finally {
      setLoading(false);
    }
  };

  // Get stock status for an item
  const getStockStatus = (item: InventoryItem) => {
    const currentStock = (Number(item.beginning_qty) || 0) + 
                        (Number(item.purchased_qty) || 0) - 
                        (Number(item.transferred_qty) || 0) - 
                        (Number(item.sold_qty) || 0);
    
    if (currentStock <= 0) return 'out';
    if (currentStock < LOW_STOCK_THRESHOLD) return 'low';
    return 'healthy';
  };

  // Get row color based on stock status
  const getRowColorClass = (item: InventoryItem) => {
    // If this inventory has any transferred units, highlight bright yellow
    if ((item as any).has_transferred) return 'bg-yellow-200';
    const status = getStockStatus(item);
    switch (status) {
      case 'out':
        return 'bg-red-50';
      case 'low':
        return 'bg-yellow-50';
      case 'healthy':
        return 'bg-green-50';
      default:
        return '';
    }
  };

  // Models tab: color rows by available count per branch-model
  function getModelRowColor(available: number) {
    if (available <= 0) return 'bg-red-50';
    if (available < LOW_STOCK_THRESHOLD) return 'bg-yellow-50';
    return 'bg-green-50';
  }

  // Sort function
  const sortItems = (a: InventoryItem, b: InventoryItem) => {
    if (!sortField) return 0;
    
    let aValue: any = a[sortField as keyof InventoryItem];
    let bValue: any = b[sortField as keyof InventoryItem];
    
    // Handle nested properties
    if (sortField.includes('.')) {
      const [parent, child] = sortField.split('.');
      const aParent = a[parent as keyof InventoryItem];
      const bParent = b[parent as keyof InventoryItem];
      aValue = (typeof aParent === 'object' && aParent !== null && child in aParent)
        ? (aParent as Record<string, any>)[child]
        : undefined;
      bValue = (typeof bParent === 'object' && bParent !== null && child in bParent)
        ? (bParent as Record<string, any>)[child]
        : undefined;
    }

    if (aValue === bValue) return 0;
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    return aValue > bValue ? 
      (sortDirection === 'asc' ? 1 : -1) : 
      (sortDirection === 'asc' ? -1 : 1);
  };

  // Advanced filtering (keep both sold and available; add engine/chassis search)
  const filtered = items.filter((item) => {
    // Keep both sold and available items visible as requested.

    const searchLower = search.toLowerCase();
    const unitSearchHit = (Array.isArray(item.vehicle_units) ? item.vehicle_units : []).some(u =>
      (u.engine_no || '').toLowerCase().includes(searchLower) ||
      (u.chassis_no || '').toLowerCase().includes(searchLower)
    );
    const matchesSearch = 
      item.items?.item_no?.toLowerCase().includes(searchLower) ||
      item.items?.brand?.toLowerCase().includes(searchLower) ||
      item.items?.model?.toLowerCase().includes(searchLower) ||
      item.branches?.name?.toLowerCase().includes(searchLower) ||
      item.suppliers?.name?.toLowerCase().includes(searchLower) ||
      item.color?.toLowerCase().includes(searchLower) ||
      unitSearchHit ||
      item.dr_no?.toLowerCase().includes(searchLower) ||
      item.si_no?.toLowerCase().includes(searchLower);

    // Branch filter
    const matchesBranch = !selectedBranch || item.branch_id === Number(selectedBranch);

    // Stock status filter
    const matchesStockStatus = stockStatus === 'all' || getStockStatus(item) === stockStatus;

    // Date range filter
    const itemDate = new Date(item.date_received);
    const startDate = dateRange.start ? new Date(dateRange.start) : new Date(0);
    const endDate = dateRange.end ? new Date(dateRange.end) : new Date();
    const matchesDateRange = itemDate >= startDate && itemDate <= endDate;

    return matchesSearch && matchesBranch && matchesStockStatus && matchesDateRange;
  }).sort(sortItems);

  // Helpers for unit status counts per inventory item (align with dashboard logic)
  function getUnitStatusCounts(item: InventoryItem) {
    const units = Array.isArray(item.vehicle_units) ? item.vehicle_units : [];
    const available = units.filter(u => (u.status || 'available') === 'available').length;
    const sold = units.filter(u => u.status === 'sold').length;
    const reserved = units.filter(u => u.status === 'reserved').length;
    return { available, sold, reserved, total: units.length };
  }

  // Handle Excel import
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    try {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);

      interface ImportResponse {
        success: boolean;
        processed: number;
        errors?: string[];
      }

      const response = await api.post<ImportResponse>('/import/inventory', formData);
      console.log('Import response:', response);

      if (response.success) {
  setSuccess(`Successfully imported ${response.processed} items`);
  showToast({ type: 'success', message: `Successfully imported ${response.processed} items` });
        if (response.errors && response.errors.length > 0) {
          console.warn('Import warnings:', response.errors);
        }
        // Refresh the inventory list
        const invData = await api.get<{ current: InventoryItem[] }>('/inventory');
        setItems(invData.current);
      } else {
  setError('Import failed');
  showToast({ type: 'error', message: 'Import failed' });
      }
    } catch (err: any) {
  setError(err.message || 'Failed to import Excel file');
  showToast({ type: 'error', message: err.message || 'Failed to import Excel file' });
    }
  };

  // Handle form input
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    // If selecting an item/model, auto-fill cost and srp from the model record when available
    if (name === 'item_id') {
      const itemId = value === '' ? undefined : Number(value);
      const selectedModel = allItems.find(a => a.id === Number(itemId));
      const modelSrp = (selectedModel as any)?.srp ?? (selectedModel as any)?.default_srp ?? undefined;
      const modelCost = (selectedModel as any)?.cost ?? (selectedModel as any)?.cost_of_purchase ?? undefined;
      setForm((f) => ({
        ...f,
        [name]: itemId,
        ...(modelSrp != null ? { srp: Number(modelSrp) } : {}),
        ...(modelCost != null ? { cost: Number(modelCost) } : {}),
      }));
      return;
    }

    setForm((f) => ({
      ...f,
      [name]: ['branch_id', 'supplier_id', 'cost', 'purchased_qty', 'beginning_qty', 'transferred_qty', 'sold_qty'].includes(name)
        ? value === '' ? undefined : Number(value)
        : value,
    }));
  }

  // Handle vehicle unit input
  function handleUnitChange(index: number, field: keyof VehicleUnit, value: string) {
    setForm((f) => {
      const units = f.vehicle_units ? [...f.vehicle_units] : [];
      units[index] = { ...units[index], [field]: value };
      return { ...f, vehicle_units: units };
    });
  }

  // Add or remove vehicle units
  function addUnit() {
    setForm((f) => ({ ...f, vehicle_units: [...(f.vehicle_units || []), { chassis_no: '', engine_no: '' }] }));
  }
  function removeUnit(index: number) {
    setForm((f) => {
      const units = f.vehicle_units ? [...f.vehicle_units] : [];
      units.splice(index, 1);
      return { ...f, vehicle_units: units };
    });
  }

  // Open modal for add/edit
  function openModal(item?: InventoryItem) {
    setEditId(item?.id ?? null);
    // Ensure color is included when editing
    setForm(item ? {
      ...item,
      color: item.color || ''  // Always ensure color is defined
    } : emptyForm);
    setModalOpen(true);
  setError(null);
  // hide any previous toast by showing nothing (no-op)
  setSuccess(null);
  }

  // Open units modal
  function openUnitsModal(units: VehicleUnit[] = []) {
    setUnitsToView(units);
    setUnitsModalOpen(true);
  }
  function closeUnitsModal() {
    setUnitsModalOpen(false);
    setUnitsToView([]);
  }

  // Close modal
  function closeModal() {
    setModalOpen(false);
    setForm(emptyForm);
    setEditId(null);
    setError(null);
    setSuccess(null);
  }

  // Total units when branch filter is active
  const totalUnits = filtered.reduce((sum, item) => {
    const unitCount = Array.isArray(item.vehicle_units) && item.vehicle_units.length > 0
      ? item.vehicle_units.length
      : (Number(item.ending_qty) || 0);
    return sum + unitCount;
  }, 0);

  // Submit form
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      // Remove fields that belong to items table
      const { color, engine_no, chassis_no, si_photo_file, ...formData } = form;

      // Prepare units array for backend if purchased_qty > 0
      let units = form.vehicle_units || [];
      if (!editId && form.purchased_qty && units.length < form.purchased_qty) {
        // If not enough units, fill with empty objects
        units = Array.from({ length: form.purchased_qty }, (_, i) => units[i] || { chassis_no: '', engine_no: '' });
      }

      const payload = {
        ...formData,
        color: typeof form.color === 'string' ? form.color : '', // Always send color as string
        branch_id: formData.branch_id ? Number(formData.branch_id) : undefined,
        item_id: formData.item_id ? Number(formData.item_id) : undefined,
        supplier_id: formData.supplier_id ? Number(formData.supplier_id) : undefined,
        cost: formData.cost ? Number(formData.cost) : undefined,
        purchased_qty: formData.purchased_qty ? Number(formData.purchased_qty) : undefined,
        srp: formData.srp ? Number(formData.srp) : undefined,
        vehicle_units: units, // Send as vehicle_units for backend
      };
      // Log and alert the payload for debugging (copy-paste friendly)
      const debugText = [
        '==== COPY BELOW FOR DEBUGGING ====',
        'PAYLOAD:',
        JSON.stringify(payload, null, 2),
        '',
        'FORM COLOR:',
        JSON.stringify(form.color),
        '',
        'FORM UNITS:',
        JSON.stringify(units, null, 2),
        '==== END ===='
      ].join('\n');
      console.log(debugText);
      // Do not spam debug payload to toasts in production; keep it in console for debugging

      // Convert to FormData if file upload is needed
      let requestBody: any = payload;
      if (si_photo_file) {
        const formDataObj = new FormData();
        
        // Append all payload fields
        Object.entries(payload).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            // For vehicle_units array, send as JSON string
            formDataObj.append(key, JSON.stringify(value));
          } else if (value !== undefined && value !== null) {
            formDataObj.append(key, String(value));
          }
        });
        
        // Append the file
        formDataObj.append('si_photo', si_photo_file);
        
        requestBody = formDataObj;
      }

      if (editId) {
        await api.put(`/inventory/${editId}`, requestBody);
      } else {
        await api.post('/inventory', requestBody);
      }

      // Inform the user immediately
      showToast({ type: 'success', message: editId ? 'Inventory updated' : 'Inventory created' });
      setSuccess(editId ? 'Updated!' : 'Saved!');
      // Close modal and clear form for better UX
      setTimeout(() => {
        closeModal();
      }, 400);

      // Refresh inventory (and transferred list) in background. If refresh fails, show a friendly message.
      (async () => {
        try {
          const inv = await api.get('/inventory');
          setItems(inv.current || inv);
          // refresh transferred list too so transferred tab is up-to-date
          await fetchTransferred();
        } catch (refreshErr) {
          console.error('Failed to refresh inventory after save', refreshErr);
          showToast({ type: 'error', message: 'Saved but failed to refresh inventory list. Please reload.' });
        }
      })();
    } catch (err: any) {
  // Sanitize backend/Prisma errors for users while logging full details for debugging
  console.error('Create/update inventory error (full):', err);
  const friendly = (() => {
    try {
      const e = err as any;
      if (!e) return 'Failed to save inventory';
      const msg = e instanceof Error ? e.message : String(e);
      if (/prisma/i.test(msg) || /P200|PrismaClientKnownRequestError/.test(msg)) {
        return 'Server validation failed — please check required fields across tabs and try again.';
      }
      if (msg.length > 300) return msg.slice(0, 300) + '...';
      return msg || 'Failed to save inventory';
    } catch (ex) {
      return 'Failed to save inventory';
    }
  })();
  setError(friendly);
  showToast({ type: 'error', message: friendly });
    }
  }

  // Delete
  async function handleDelete(id: number) {
    if (!window.confirm('Delete this inventory record?')) return;
    try {
      await api.delete(`/inventory/${id}`);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
  setError('Failed to delete');
  showToast({ type: 'error', message: 'Failed to delete' });
    }
  }

  return (
    <div className="p-4">
      {/* Test element to verify Tailwind */}
     

      <div className="flex flex-col gap-4 mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <h1 className="text-2xl font-bold">Inventory</h1>
          <div className="flex gap-2">
            <input
              className="border rounded px-2 py-1"
              placeholder="Search item, brand, branch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
              onClick={() => openModal()}
            >
              + Add Inventory
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
              <select
                className="w-full border rounded px-2 py-1"
                value={selectedPeriod}
                onChange={(e) => {
                  const p = e.target.value as PeriodType;
                  setSelectedPeriod(p);
                  setRangeForPeriod(p);
                }}
              >
                <option value="all-time">All-time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
              <select
                className="w-full border rounded px-2 py-1"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                <option value="">All Branches</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
              <select
                className="w-full border rounded px-2 py-1"
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value as 'all' | 'low' | 'out' | 'healthy')}
              >
                <option value="all">All Status</option>
                <option value="out">Out of Stock</option>
                <option value="low">Low Stock</option>
                <option value="healthy">Healthy Stock</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
              <input
                type="date"
                className="w-full border rounded px-2 py-1"
                value={dateRange.start}
                onChange={(e) => { setDateRange(prev => ({ ...prev, start: e.target.value })); setSelectedPeriod('custom'); }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
              <input
                type="date"
                className="w-full border rounded px-2 py-1"
                value={dateRange.end}
                onChange={(e) => { setDateRange(prev => ({ ...prev, end: e.target.value })); setSelectedPeriod('custom'); }}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Stock Status Legend */}
          <div className="mt-4 flex gap-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
              <span className="text-sm">Out of Stock</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
              <span className="text-sm">Low Stock (&lt; {LOW_STOCK_THRESHOLD})</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-sm">Healthy Stock (≥ {HEALTHY_STOCK_THRESHOLD})</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded mr-2 bg-yellow-200 border border-yellow-400"></div>
              <span className="text-sm">Has Transferred Unit(s)</span>
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'transferred' ? (
        <div>
          <h2 className="text-lg font-semibold mb-2">Transferred Units</h2>
          {transferredLoading ? (
            <div>Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engine No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chassis No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From Branch</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Received</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DR No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SI No</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">SRP</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Margin %</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Created</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original Inv</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orig Vehicle Unit</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Other Locations</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransferredUnits.length === 0 ? (
                    <tr><td colSpan={7} className="p-4 text-center text-gray-500">No transferred units found.</td></tr>
                  ) : filteredTransferredUnits.map((u: any, idx: number) => (
                    <tr key={u.id || idx} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{idx+1}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{u.engine_no || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{u.chassis_no || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{u.branch || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{u.item?.brand} {u.item?.model}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{u.date_received ? new Date(u.date_received).toLocaleDateString() : (u.unit_created_at ? new Date(u.unit_created_at).toLocaleDateString() : '')}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{u.supplier_name || (u.supplier_id ? `#${u.supplier_id}` : '-')}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{u.dr_no || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{u.si_no || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{u.cost != null ? Number(u.cost).toLocaleString() : '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{u.srp != null ? Number(u.srp).toLocaleString() : '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{u.margin != null ? Number(u.margin).toFixed(2) + '%' : '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{u.color || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{u.status || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{u.unit_number ?? '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{u.unit_created_at ? new Date(u.unit_created_at).toLocaleString() : '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{u.inventory_id ?? '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{u.original_vehicle_unit_id ?? '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{u.remarks || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(u.counterparts || []).length > 0 ? (
                          <div className="space-y-1">
                            {(u.counterparts || []).map((d: any, i: number) => (
                              <div key={i} className="text-sm">{d.branch || 'Unknown'} (inv #{d.inventory_id}) — {d.engine_no || '-'} / {d.chassis_no || '-'}{d.supplier_name ? ` — ${d.supplier_name}` : ''}</div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">—</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      <div className="overflow-x-auto">
        {/* Branch total units summary (shown when a branch is selected) */}
        {selectedBranch && (
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Total units in <span className="font-semibold">{branches.find(b => b.id === Number(selectedBranch))?.name || 'Selected Branch'}</span>:
              <span className="ml-2 inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{totalUnits}</span>
            </div>
          </div>
        )}
        <div className="mb-4 flex gap-4">
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            onClick={() => handleExportExcel()}
          >
            Export to Excel
          </button>
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            onClick={() => handleGenerateReport()}
          >
            Generate PDF
          </button>
        
          <label className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 cursor-pointer">
            Import Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImportExcel}
            />
          </label>
        </div>
      <div className="mb-4 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {(['details', 'models', 'pricing', 'movement', 'documents', 'upcoming'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                ${activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}
                whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
              `}
            >
              {tab === 'models' ? 'In-Stock Models' : (tab.charAt(0).toUpperCase() + tab.slice(1))}
            </button>
          ))}
          <button
            onClick={() => setActiveTab('transferred')}
            className={`${activeTab === 'transferred' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
          >
            Transferred
          </button>
        </nav>
      </div>

      <table className="min-w-full bg-white rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {activeTab === 'details' && (
              <>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    setSortDirection(sortField === 'branches.name' && sortDirection === 'asc' ? 'desc' : 'asc');
                    setSortField('branches.name');
                  }}
                >
                  Branch {sortField === 'branches.name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    setSortDirection(sortField === 'items.item_no' && sortDirection === 'asc' ? 'desc' : 'asc');
                    setSortField('items.item_no');
                  }}
                >
                  Item No {sortField === 'items.item_no' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    setSortDirection(sortField === 'items.brand' && sortDirection === 'asc' ? 'desc' : 'asc');
                    setSortField('items.brand');
                  }}
                >
                  Brand {sortField === 'items.brand' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    setSortDirection(sortField === 'items.model' && sortDirection === 'asc' ? 'desc' : 'asc');
                    setSortField('items.model');
                  }}
                >
                  Model {sortField === 'items.model' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    setSortDirection(sortField === 'color' && sortDirection === 'asc' ? 'desc' : 'asc');
                    setSortField('color');
                  }}
                >
                  Color {sortField === 'color' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engine No(s)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chassis No(s)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Received</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aging (days)</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Avail</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sold</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              </>
            )}
            {activeTab === 'models' && (
              <>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variants</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Avail</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sold</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              </>
            )}
            {activeTab === 'pricing' && (
              <>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item No</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">SRP</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
              </>
            )}
            {activeTab === 'movement' && (
              <>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item No</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Beg. Inv</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Purchased</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Transfer</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">End. Inv</th>
              </>
            )}
            {activeTab === 'documents' && (
              <>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DR No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SI No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engine No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chassis No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
              </>
            )}
            {activeTab === 'upcoming' && (
              <>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Number</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">SRP</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </>
            )}
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {activeTab === 'upcoming' ? (
              upcomingItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.po_number}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.branches?.name}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.items?.brand} {item.items?.model}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.items?.color?.join(', ')}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.purchased_qty}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">₱{item.cost?.toLocaleString()}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.suppliers?.name}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">₱{item.srp?.toLocaleString() || '-'}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      PENDING
                    </span>
                  </td>
                </tr>
              ))
            ) : loading ? (
              <tr>
                <td colSpan={20} className="text-center p-4">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-2">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 && activeTab !== 'models' ? (
              <tr>
                <td colSpan={20} className="text-center p-4">
                  <div className="text-gray-500">No inventory found.</div>
                </td>
              </tr>
            ) : (activeTab === 'models' ? (
              (() => {
                // Group by branch + model for selected branch; only include models with any units
                const pool = selectedBranch ? filtered.filter(i => i.branch_id === Number(selectedBranch)) : filtered;
                const groups = new Map<string, { branch: string; key: string; model: string; variants: Set<string>; available: number; sold: number; total: number; units: VehicleUnit[] }>();
                pool.forEach(it => {
                  const branch = it.branches?.name || 'Unassigned';
                  const model = `${it.items?.brand || ''} ${it.items?.model || ''}`.trim();
                  const key = `${branch}::${model}`;
                  const units = Array.isArray(it.vehicle_units) ? it.vehicle_units : [];
                  if (!groups.has(key)) groups.set(key, { branch, key, model, variants: new Set<string>(), available: 0, sold: 0, total: 0, units: [] });
                  const g = groups.get(key)!;
                  if (it.color) g.variants.add(it.color);
                  units.forEach(u => {
                    g.total += 1;
                    g.units.push(u);
                    if ((u.status || 'available') === 'available') g.available += 1;
                    if (u.status === 'sold') g.sold += 1;
                  });
                });
                const rows = Array.from(groups.values()).filter(r => r.total > 0);
                if (rows.length === 0) {
                  return (
                    <tr>
                      <td colSpan={20} className="text-center p-4">
                        <div className="text-gray-500">No in-stock models{selectedBranch ? ' for this branch' : ''}.</div>
                      </td>
                    </tr>
                  );
                }
                return rows.map(r => (
                  <tr key={r.key} className={`hover:bg-gray-50 ${getModelRowColor(r.available)}`}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{r.branch}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{r.model}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{Array.from(r.variants).join(', ') || '-'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">{r.available}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">{r.sold}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{r.total}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                      <button className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded border border-indigo-200" onClick={() => openUnitsModal(r.units)}>
                        View Units
                      </button>
                    </td>
                  </tr>
                ));
              })()
            ) : (
              filtered.map((item) => (
                <tr 
                  key={item.id} 
                  className={`hover:bg-gray-100 transition-colors ${getRowColorClass(item)}`}
                >
                  {activeTab === 'details' && (
                    <>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.branches?.name}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.items?.item_no}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.items?.brand}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.items?.model}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.color}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{(() => { const list=(item.vehicle_units||[]).map(u=>u.engine_no).filter(Boolean) as string[]; return list.length? (list.slice(0,2).join(', ') + (list.length>2? '…':'')) : '-'; })()}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{(() => { const list=(item.vehicle_units||[]).map(u=>u.chassis_no).filter(Boolean) as string[]; return list.length? (list.slice(0,2).join(', ') + (list.length>2? '…':'')) : '-'; })()}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.date_received ? new Date(item.date_received).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{
                        item.date_received ? Math.max(0, Math.floor((new Date().getTime() - new Date(item.date_received).getTime()) / (1000 * 60 * 60 * 24))) : '-'
                      }</td>
                      {(() => { const c = getUnitStatusCounts(item); return (
                        <>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{c.available}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{c.sold}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{c.total}</td>
                        </>
                      ); })()}
                    </>
                  )}
                  {activeTab === 'pricing' && (
                    <>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.items?.item_no}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.cost?.toLocaleString()}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.srp?.toLocaleString()}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {item.cost && item.srp ? `${(((Number(item.srp) - Number(item.cost)) / Number(item.cost)) * 100).toFixed(2)}%` : '-'}
                      </td>
                    </>
                  )}
                  {activeTab === 'movement' && (
                    <>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.items?.item_no}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.beginning_qty}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.purchased_qty}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.transferred_qty}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.sold_qty}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.ending_qty}</td>
                    </>
                  )}
                  {activeTab === 'documents' && (
                    <>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.items?.item_no}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.date_received ? new Date(item.date_received).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.suppliers?.name || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.dr_no || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.si_no || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.engine_no || item.vehicle_units?.[0]?.engine_no || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.chassis_no || item.vehicle_units?.[0]?.chassis_no || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.remarks || '-'}</td>
                    </>
                  )}
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-center flex flex-col gap-1 items-center">
                    <button
                      className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded w-full"
                      onClick={() => openModal(item)}>
                      Edit
                    </button>
                    <button
                      className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded w-full"
                      onClick={() => handleDelete(item.id)}>
                      Delete
                    </button>
                    <button
                      className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded w-full mt-1 border border-indigo-200"
                      type="button"
                      onClick={() => openUnitsModal(item.vehicle_units || [])}
                    >
                      View Units
                    </button>
                    <button
                      className="text-yellow-700 hover:text-yellow-900 bg-yellow-50 px-3 py-1 rounded w-full mt-1 border border-yellow-200"
                      type="button"
                      onClick={() => { setTransferInventoryItem(item); setTransferModalOpen(true); setSelectedTransferUnit(null); setTransferBranch(''); setTransferRemarks(''); }}
                    >
                      Transfer
                    </button>
                  </td>
                </tr>
              )))
            )}
          </tbody>
        </table>
      </div>
        </>
  )}

  {/* Units Modal */}
      {unitsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-md max-h-[85vh] overflow-y-auto relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-black"
              onClick={closeUnitsModal}
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4">Vehicle Units</h2>
            {unitsToView.length === 0 ? (
              <div className="text-gray-500">No units recorded for this inventory.</div>
            ) : (
              <table className="min-w-full bg-white rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chassis No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engine No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {unitsToView.map((unit, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2">{idx + 1}</td>
                      <td className="px-4 py-2">{unit.chassis_no || '-'}</td>
                      <td className="px-4 py-2">{unit.engine_no || '-'}</td>
                      <td className="px-4 py-2">
                        {selectedTransferUnit === unit.id ? (
                          <div className="space-y-2">
                            <select className="border rounded px-2 py-1 w-full text-sm" value={transferBranch} onChange={e => setTransferBranch(e.target.value)}>
                              <option value="">Select destination branch</option>
                              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                            <input className="border rounded px-2 py-1 w-full text-sm" placeholder="Remarks (optional)" value={transferRemarks} onChange={e => setTransferRemarks(e.target.value)} />
                            <div className="flex gap-2">
                              <button className="px-2 py-1 bg-gray-200 rounded text-sm" onClick={() => setSelectedTransferUnit(null)}>Cancel</button>
                              <button className="px-2 py-1 bg-green-600 text-white rounded text-sm" onClick={async () => {
                                if (!transferBranch) { showToast({ type: 'error', message: 'Select a destination branch' }); return; }
                                try {
                                  setTransferLoading(true);
                                  await api.post('/inventory/transfer', { unit_id: unit.id, to_branch_id: Number(transferBranch), remarks: transferRemarks });
                                  // refresh inventory and transferred lists
                                  const inv = await api.get('/inventory');
                                  setItems(inv.current || inv);
                                  // switch to transferred tab and refresh its data so user sees the history row immediately
                                  setActiveTab('transferred');
                                  await fetchTransferred();
                                  setSuccess('Unit transferred successfully');
                                  showToast({ type: 'success', message: 'Unit transferred successfully' });
                                  setSelectedTransferUnit(null);
                                  closeUnitsModal();
                                } catch (e: any) {
                                  console.error('Transfer failed', e);
                                  showToast({ type: 'error', message: 'Transfer failed: ' + (e?.message || e) });
                                } finally { setTransferLoading(false); }
                              }}>{transferLoading ? 'Saving...' : 'Confirm'}</button>
                            </div>
                          </div>
                        ) : (
                          <button className="px-2 py-1 bg-yellow-500 text-white rounded text-sm" onClick={() => { setSelectedTransferUnit(unit.id); setTransferBranch(''); setTransferRemarks(''); }}>
                            Transfer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Transfer Modal (page-level) */}
      {transferModalOpen && transferInventoryItem && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-black"
              onClick={() => { setTransferModalOpen(false); setTransferInventoryItem(null); setSelectedTransferUnit(null); }}
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4">Transfer Units — {transferInventoryItem.items?.brand} {transferInventoryItem.items?.model}</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Unit</label>
              <div className="space-y-2">
                {(transferInventoryItem.vehicle_units || []).map((unit) => (
                  <div key={unit.id ?? unit.chassis_no} className="flex items-center justify-between border rounded p-2">
                    <div>
                      <div className="text-sm font-medium">{unit.unit_number || `${unit.engine_no || '-'} / ${unit.chassis_no || '-'}`}</div>
                      <div className="text-xs text-gray-500">Engine: {unit.engine_no || '-'} • Chassis: {unit.chassis_no || '-'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="radio" name="transferUnitRadio" checked={selectedTransferUnit === unit.id} onChange={() => setSelectedTransferUnit(unit.id ?? null)} />
                      <button className="text-sm text-gray-600" onClick={() => { setSelectedTransferUnit(unit.id ?? null); }}>Select</button>
                    </div>
                  </div>
                ))}
                {(transferInventoryItem.vehicle_units || []).length === 0 && (
                  <div className="text-gray-500">No units available to transfer for this inventory record.</div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Destination Branch</label>
              <select className="w-full border rounded px-2 py-1" value={transferBranch} onChange={e => setTransferBranch(e.target.value)}>
                <option value="">Select destination branch</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Remarks (optional)</label>
              <input className="w-full border rounded px-2 py-1" value={transferRemarks} onChange={e => setTransferRemarks(e.target.value)} />
            </div>

            <div className="flex justify-end gap-2">
              <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => { setTransferModalOpen(false); setTransferInventoryItem(null); setSelectedTransferUnit(null); }}>Cancel</button>
              <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={async () => {
                if (!selectedTransferUnit) { showToast({ type: 'error', message: 'Select a unit to transfer' }); return; }
                if (!transferBranch) { showToast({ type: 'error', message: 'Select destination branch' }); return; }
                try {
                  setTransferLoading(true);
                  await api.post('/inventory/transfer', { unit_id: selectedTransferUnit, to_branch_id: Number(transferBranch), remarks: transferRemarks });
                  const inv = await api.get('/inventory');
                  setItems(inv.current || inv);
                  setActiveTab('transferred');
                  await fetchTransferred();
                  showToast({ type: 'success', message: 'Unit transferred successfully' });
                  setTransferModalOpen(false);
                  setTransferInventoryItem(null);
                  setSelectedTransferUnit(null);
                } catch (err: any) {
                  console.error('Transfer failed', err);
                  showToast({ type: 'error', message: 'Transfer failed: ' + (err?.message || err) });
                } finally { setTransferLoading(false); }
              }}>{transferLoading ? 'Saving...' : 'Confirm Transfer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-black"
              onClick={closeModal}
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4">{editId ? 'Edit' : 'Add'} Inventory</h2>
            <form className="space-y-3" onSubmit={handleSubmit}>
              {/* Form Tabs */}
              <div className="mb-4 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  {(['details', 'pricing', 'movement', 'documents'] as const).map((tab) => (
                    <button
                      type="button"
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`
                        ${activeTab === tab
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}
                        whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
                      `}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Details Tab */}
              {activeTab === 'details' && (
                <>
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium text-blue-800 mb-2">Location Information</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Branch *</label>
                      <select
                        name="branch_id"
                        className="mt-1 border rounded px-2 py-1 w-full bg-white"
                        value={form.branch_id ?? ''}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select branch</option>
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700">Item *</label>
                      <select
                        name="item_id"
                        className="mt-1 border rounded px-2 py-1 w-full bg-white"
                        value={form.item_id ?? ''}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select item</option>
                        {allItems.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.item_no} - {i.brand} {i.model}
                          </option>
                        ))}
                      </select>
                    </div>

                    {form.item_id && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-medium text-gray-700 mb-2">Item Details</h3>
                        <p className="text-sm text-gray-500 mb-4">Enter specific details for this inventory item</p>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm text-gray-600">Color</label>
                            <select
                              name="color"
                              className="mt-1 border rounded px-2 py-1 w-full"
                              value={form.color ?? ''}
                              onChange={handleChange}
                              required
                            >
                              <option value="">Select color</option>
                              {allItems.find(i => i.id === Number(form.item_id))?.color.map(color => (
                                <option key={color} value={color}>
                                  {color}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Vehicle Units Section */}
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Vehicle Units (Chassis/Engine)</label>
                            <div className="space-y-2">
                              {(form.vehicle_units || []).map((unit: VehicleUnit, idx: number) => (
                                <div key={idx} className="flex gap-2 items-center">
                                  <input
                                    type="text"
                                    className="border rounded px-2 py-1 w-1/2"
                                    placeholder="Chassis No"
                                    value={unit.chassis_no || ''}
                                    onChange={e => handleUnitChange(idx, 'chassis_no', e.target.value)}
                                  />
                                  <input
                                    type="text"
                                    className="border rounded px-2 py-1 w-1/2"
                                    placeholder="Engine No"
                                    value={unit.engine_no || ''}
                                    onChange={e => handleUnitChange(idx, 'engine_no', e.target.value)}
                                  />
                                  <button type="button" className="text-red-500 ml-2" onClick={() => removeUnit(idx)}>
                                    ×
                                  </button>
                                </div>
                              ))}
                              <button type="button" className="bg-green-500 text-white px-2 py-1 rounded mt-2" onClick={addUnit}>
                                + Add Unit
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Pricing Tab */}
              {activeTab === 'pricing' && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">Unit Pricing</h3>
                  <p className="text-sm text-gray-600 mb-4">Enter the unit cost and SRP. Margin will be automatically calculated.</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Unit Cost (₱) *</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          name="cost"
                          type="number"
                          min="0"
                          step="0.01"
                          className="border rounded px-2 py-1 w-full focus:ring-blue-500 focus:border-blue-500"
                          value={form.cost ?? ''}
                          onChange={handleChange}
                          required
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Selling Price - SRP (₱) *</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          name="srp"
                          type="number"
                          min={form.cost || 0}
                          step="0.01"
                          className="border rounded px-2 py-1 w-full focus:ring-blue-500 focus:border-blue-500"
                          value={form.srp ?? ''}
                          onChange={handleChange}
                          required
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Margin</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          type="text"
                          className="border rounded px-2 py-1 w-full bg-gray-100 text-gray-600"
                          value={form.cost && form.srp 
                            ? `${(((Number(form.srp) - Number(form.cost)) / Number(form.cost)) * 100).toFixed(2)}%`
                            : '0.00%'}
                          readOnly
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          Calculated from cost and SRP
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Movement Tab */}
              {activeTab === 'movement' && (
                <div className="space-y-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium text-blue-800 mb-2">Initial Stock</h3>
                    <p className="text-sm text-gray-600 mb-4">Set the beginning inventory for this item.</p>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Beginning Quantity</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          name="beginning_qty"
                          type="number"
                          min="0"
                          className="border rounded px-2 py-1 w-full focus:ring-blue-500 focus:border-blue-500"
                          value={form.beginning_qty ?? ''}
                          onChange={handleChange}
                          placeholder="0"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Initial stock quantity</p>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-medium text-green-800 mb-2">Stock Movement *</h3>
                    <p className="text-sm text-gray-600 mb-4">Record incoming and outgoing stock.</p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Purchased Quantity *</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <input
                            name="purchased_qty"
                            type="number"
                            min="0"
                            className="border rounded px-2 py-1 w-full focus:ring-green-500 focus:border-green-500"
                            value={form.purchased_qty ?? ''}
                            onChange={handleChange}
                            required
                            placeholder="0"
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Number of units being added to inventory</p>
                      </div>

                      {!editId && (
                        <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                          <p className="text-sm text-yellow-800">
                            Transferred and Sold quantities can only be updated after creating the initial record.
                          </p>
                        </div>
                      )}

                      {editId && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Transferred Quantity</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                              <input
                                name="transferred_qty"
                                type="number"
                                min="0"
                                max={(Number(form.beginning_qty) || 0) + (Number(form.purchased_qty) || 0)}
                                className="border rounded px-2 py-1 w-full"
                                value={form.transferred_qty ?? ''}
                                onChange={handleChange}
                                placeholder="0"
                              />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Units transferred to other branches</p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Sold Quantity</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                              <input
                                name="sold_qty"
                                type="number"
                                min="0"
                                max={(Number(form.beginning_qty) || 0) + (Number(form.purchased_qty) || 0) - (Number(form.transferred_qty) || 0)}
                                className="border rounded px-2 py-1 w-full"
                                value={form.sold_qty ?? ''}
                                onChange={handleChange}
                                placeholder="0"
                              />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Units sold to customers</p>
                          </div>

                          <div className="p-3 bg-gray-50 rounded">
                            <label className="block text-sm font-medium text-gray-700">Ending Inventory</label>
                            <div className="text-lg font-semibold text-gray-900">
                              {(Number(form.beginning_qty || 0) + 
                                Number(form.purchased_qty || 0) - 
                                Number(form.transferred_qty || 0) - 
                                Number(form.sold_qty || 0))} units
                            </div>
                            <p className="text-xs text-gray-500">
                              Calculated: Beginning + Purchased - Transferred - Sold
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Documents Tab */}
              {activeTab === 'documents' && (
                <div className="space-y-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium text-blue-800 mb-2">Receiving Information</h3>
                    <p className="text-sm text-gray-600 mb-4">Record when and from whom the items were received.</p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Date Received *</label>
                        <div className="mt-1">
                          <input
                            name="date_received"
                            type="date"
                            className="border rounded px-2 py-1 w-full focus:ring-blue-500 focus:border-blue-500"
                            value={form.date_received ?? ''}
                            onChange={handleChange}
                            required
                            max={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Cannot be a future date</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Supplier</label>
                        <select
                          name="supplier_id"
                          className="mt-1 border rounded px-2 py-1 w-full focus:ring-blue-500 focus:border-blue-500"
                          value={form.supplier_id ?? ''}
                          onChange={handleChange}
                        >
                          <option value="">Select supplier</option>
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-800 mb-2">Reference Documents</h3>
                    <p className="text-sm text-gray-600 mb-4">Enter any relevant document references.</p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Delivery Receipt (DR) No.</label>
                        <div className="mt-1">
                          <input
                            name="dr_no"
                            type="text"
                            className="border rounded px-2 py-1 w-full focus:ring-gray-500 focus:border-gray-500"
                            value={form.dr_no ?? ''}
                            onChange={handleChange}
                            placeholder="Enter DR number"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Sales Invoice (SI) No.</label>
                        <div className="mt-1">
                          <input
                            name="si_no"
                            type="text"
                            className="border rounded px-2 py-1 w-full focus:ring-gray-500 focus:border-gray-500"
                            value={form.si_no ?? ''}
                            onChange={handleChange}
                            placeholder="Enter SI number"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Remarks</label>
                        <div className="mt-1">
                          <textarea
                            name="remarks"
                            className="border rounded px-2 py-1 w-full focus:ring-gray-500 focus:border-gray-500"
                            value={form.remarks ?? ''}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Any additional notes or comments"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {error && <div className="text-red-600">{error}</div>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-1 rounded border"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
                >
                  {editId ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;
