import { Request, Response } from 'express';
import prisma from '../lib/prisma';
// Use xlsx-js-style to enable styling (fonts, fills, borders)
import XLSX from 'xlsx-js-style';

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | 'all';

function getDateRange(period: Period, start?: string, end?: string) {
  const now = new Date();
  let from: Date | null = null;
  let to: Date | null = null;
  switch (period) {
    case 'daily': {
      const d = start ? new Date(start) : now;
      from = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      to = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      break;
    }
    case 'weekly': {
      const d = start ? new Date(start) : now;
      const day = d.getDay(); // 0=Sun
      const diffToMon = (day + 6) % 7; // Monday as start
      const monday = new Date(d);
      monday.setDate(d.getDate() - diffToMon);
      from = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      to = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate(), 23, 59, 59, 999);
      break;
    }
    case 'monthly': {
      const d = start ? new Date(start) : now;
      from = new Date(d.getFullYear(), d.getMonth(), 1);
      to = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    }
    case 'yearly': {
      const d = start ? new Date(start) : now;
      from = new Date(d.getFullYear(), 0, 1);
      to = new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    }
    case 'custom': {
      if (start) from = new Date(start);
      if (end) to = new Date(end);
      break;
    }
    case 'all':
    default:
      from = null; to = null;
  }
  return { from, to };
}

function toCurrency(n: any) { return Number(n || 0); }

export async function exportSalesReport(req: Request, res: Response) {
  const period = String(req.query.period || 'all').toLowerCase() as Period;
  const { from, to } = getDateRange(period, req.query.start as string, req.query.end as string);
  const branchId = req.query.branch_id ? Number(req.query.branch_id) : undefined;

  const where: any = {};
  if (branchId) where.branch_id = branchId;
  if (from && to) where.date_sold = { gte: from, lte: to };

  // Resolve branch label for metadata and filename
  let branchLabel = 'All Branches';
  if (branchId) {
    try {
      const b = await prisma.branches.findUnique({ where: { id: branchId } });
      if (b?.name) branchLabel = b.name;
      else branchLabel = `Branch ${branchId}`;
    } catch {
      branchLabel = `Branch ${branchId}`;
    }
  }

  const sales = await prisma.sales.findMany({
    where,
    include: {
      branches: true,
      sales_items: {
        include: {
          items: true,
          vehicle_unit: {
            include: {
              inventory: {
                include: { items: true, branches: true }
              }
            }
          }
        }
      },
      lto_registrations: {
        select: {
          plate_number: true,
          engine_number: true,
          chassis_number: true,
          mv_file_number: true,
          cr_number: true,
          or_number: true,
          registration_date: true,
          expiration_date: true,
          status: true
        }
      }
    },
    orderBy: { date_sold: 'asc' }
  });

  // Build detail rows (one per sales_item) as structured objects for computation
  const detailsRaw = sales.flatMap((s) => (
    s.sales_items.map((si) => {
      const inv = si.vehicle_unit?.inventory;
      const brand = si.items?.brand || inv?.items?.brand || '';
      const model = si.items?.model || inv?.items?.model || '';
      const color = si.items?.color || inv?.items?.color || '';
      const engine = si.vehicle_unit?.engine_no || (inv as any)?.engine_no || '';
      const chassis = si.vehicle_unit?.chassis_no || (inv as any)?.chassis_no || '';
      const lto = (s as any).lto_registrations || null;
      const dateSold = s.date_sold ? new Date(s.date_sold) : null;
      return {
        saleId: s.id,
        dateSold: dateSold ? dateSold.toISOString().slice(0, 10) : '',
        branch: s.branches?.name || '',
        drNo: s.dr_no || '',
        siNo: s.si_no || '',
        customerLast: (s as any).last_name || '',
        customerFirst: (s as any).first_name || '',
        customerMiddle: (s as any).middle_name || '',
        address: (s as any).address || '',
        contactNo: (s as any).contact_no || '',
        paymentMethod: s.payment_method || '',
        categoryOfSales: (s as any).category_of_sales || '',
        agent: (s as any).agent || '',
        fmo: (s as any).fmo || '',
        bm: (s as any).bm || '',
        mechanic: (s as any).mechanic || '',
        bao: (s as any).bao || '',
        brand,
        model,
        color,
        engineNo: engine,
        chassisNo: chassis,
        plateNo: lto?.plate_number || '',
        mvFileNo: lto?.mv_file_number || '',
        crNo: lto?.cr_number || '',
        orNo: lto?.or_number || '',
        regDate: lto?.registration_date ? new Date(lto.registration_date).toISOString().slice(0,10) : '',
        regExpiry: lto?.expiration_date ? new Date(lto.expiration_date).toISOString().slice(0,10) : '',
        ltoStatus: lto?.status || '',
        qty: Number(si.qty || 0),
        unitPrice: toCurrency(si.unit_price),
        amount: toCurrency(si.amount),
        saleTotalAmount: toCurrency(s.total_amount)
      };
    })
  ));

  // Build summaries
  const totalAmount = detailsRaw.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const totalUnits = detailsRaw.reduce((sum, r) => sum + Number(r.qty || 0), 0);
  const byBranch = new Map<string, { units: number; amount: number }>();
  const byModel = new Map<string, { units: number; amount: number }>();
  const byAgent = new Map<string, { units: number; amount: number }>();
  const byPayment = new Map<string, { units: number; amount: number }>();
  const byCategory = new Map<string, { units: number; amount: number }>();
  for (const r of detailsRaw) {
    const b = r.branch || 'Unassigned';
    const bm = byBranch.get(b) || { units: 0, amount: 0 };
    bm.units += Number(r.qty || 0);
    bm.amount += Number(r.amount || 0);
    byBranch.set(b, bm);
    const m = `${r.brand || ''} ${r.model || ''}`.trim();
    const mm = byModel.get(m) || { units: 0, amount: 0 };
    mm.units += Number(r.qty || 0);
    mm.amount += Number(r.amount || 0);
    byModel.set(m, mm);
    const agKey = (r.agent || 'Unassigned').trim() || 'Unassigned';
    const ag = byAgent.get(agKey) || { units: 0, amount: 0 };
    ag.units += Number(r.qty || 0);
    ag.amount += Number(r.amount || 0);
    byAgent.set(agKey, ag);
    const payKey = (r.paymentMethod || 'Unassigned').trim() || 'Unassigned';
    const pay = byPayment.get(payKey) || { units: 0, amount: 0 };
    pay.units += Number(r.qty || 0);
    pay.amount += Number(r.amount || 0);
    byPayment.set(payKey, pay);
    const catKey = (r.categoryOfSales || 'Unassigned').trim() || 'Unassigned';
    const cat = byCategory.get(catKey) || { units: 0, amount: 0 };
    cat.units += Number(r.qty || 0);
    cat.amount += Number(r.amount || 0);
    byCategory.set(catKey, cat);
  }

  // Build workbook with professional layout via AOAs
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const dateRangeLabel = period === 'all'
    ? 'All Time'
    : `${from ? new Date(from).toISOString().slice(0,10) : ''} to ${to ? new Date(to).toISOString().slice(0,10) : ''}`;
  const generatedAt = new Date();
  const summaryAOA: (string | number)[][] = [];
  summaryAOA.push([`Prime Motors — Sales Report`]);
  summaryAOA.push([`Period`, period.toUpperCase()]);
  summaryAOA.push([`Date Range`, dateRangeLabel]);
  summaryAOA.push([`Branch`, branchLabel]);
  summaryAOA.push([`Generated At`, generatedAt.toISOString()]);
  summaryAOA.push([]);
  summaryAOA.push([`Overview`]);
  summaryAOA.push([`Total Units`, totalUnits]);
  summaryAOA.push([`Total Amount`, totalAmount]);
  summaryAOA.push([]);
  summaryAOA.push([`By Branch`]);
  summaryAOA.push([`Branch`, `Units`, `Amount`]);
  for (const [k, v] of byBranch.entries()) {
    summaryAOA.push([k, v.units, v.amount]);
  }
  summaryAOA.push([]);
  summaryAOA.push([`By Model`]);
  summaryAOA.push([`Model`, `Units`, `Amount`]);
  for (const [k, v] of byModel.entries()) {
    summaryAOA.push([k, v.units, v.amount]);
  }
  summaryAOA.push([]);
  summaryAOA.push([`By Agent`]);
  summaryAOA.push([`Agent`, `Units`, `Amount`]);
  for (const [k, v] of byAgent.entries()) {
    summaryAOA.push([k, v.units, v.amount]);
  }
  summaryAOA.push([]);
  summaryAOA.push([`By Payment Method`]);
  summaryAOA.push([`Payment Method`, `Units`, `Amount`]);
  for (const [k, v] of byPayment.entries()) {
    summaryAOA.push([k, v.units, v.amount]);
  }
  summaryAOA.push([]);
  summaryAOA.push([`By Category of Sales`]);
  summaryAOA.push([`Category`, `Units`, `Amount`]);
  for (const [k, v] of byCategory.entries()) {
    summaryAOA.push([k, v.units, v.amount]);
  }
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryAOA);
  // Merge the title across first 3 columns
  wsSummary['!merges'] = wsSummary['!merges'] || [];
  wsSummary['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } });
  // Column widths for readability
  (wsSummary as any)['!cols'] = [
    { wch: 24 }, { wch: 24 }, { wch: 18 }, { wch: 18 }
  ];
  // Row heights and styling
  (wsSummary as any)['!rows'] = [
    { hpt: 28 }, // Title
    { hpt: 18 }, { hpt: 18 }, { hpt: 18 }, { hpt: 18 }, // Meta
  ];
  // Apply styles: title bold, larger, centered
  const titleCell = wsSummary['A1'];
  if (titleCell) (titleCell as any).s = {
    font: { name: 'Calibri', sz: 18, bold: true, color: { rgb: 'FF000000' } },
    alignment: { horizontal: 'center' }
  };
  // Section headers styling (Overview, By Branch, By Model)
  const sectionHeaderStyle = {
    font: { name: 'Calibri', sz: 12, bold: true, color: { rgb: 'FF000000' } },
    fill: { patternType: 'solid', fgColor: { rgb: 'FF39FF14' } }, // Neon green
    alignment: { horizontal: 'left' },
    border: {
      top: { style: 'thin', color: { rgb: 'FFBFBFBF' } },
      left: { style: 'thin', color: { rgb: 'FFBFBFBF' } },
      right: { style: 'thin', color: { rgb: 'FFBFBFBF' } },
      bottom: { style: 'thin', color: { rgb: 'FFBFBFBF' } },
    },
  } as any;
  // Apply section header style dynamically for rows starting with known titles
  const titles = new Set(['Overview', 'By Branch', 'By Model', 'By Agent', 'By Payment Method', 'By Category of Sales']);
  const range = XLSX.utils.decode_range(wsSummary['!ref'] as string);
  for (let r = range.s.r; r <= range.e.r; r++) {
    const cellAddr = XLSX.utils.encode_cell({ r, c: 0 });
    const cell = (wsSummary as any)[cellAddr];
    if (cell && titles.has(String(cell.v))) {
      (wsSummary as any)[cellAddr].s = sectionHeaderStyle;
    }
  }
  // Style table header rows (3-column tables) with neon green background
  const tableHeaderStyle = {
    font: { name: 'Calibri', sz: 11, bold: true },
    fill: { patternType: 'solid', fgColor: { rgb: 'FF39FF14' } },
    alignment: { horizontal: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'FFBFBFBF' } },
      left: { style: 'thin', color: { rgb: 'FFBFBFBF' } },
      right: { style: 'thin', color: { rgb: 'FFBFBFBF' } },
      bottom: { style: 'thin', color: { rgb: 'FFBFBFBF' } },
    },
  } as any;
  const headerRowMatchers: Array<[string, string, string]> = [
    ['Branch', 'Units', 'Amount'],
    ['Model', 'Units', 'Amount'],
    ['Agent', 'Units', 'Amount'],
    ['Payment Method', 'Units', 'Amount'],
    ['Category', 'Units', 'Amount']
  ];
  for (let r = range.s.r; r <= range.e.r; r++) {
    const a = (wsSummary as any)[XLSX.utils.encode_cell({ r, c: 0 })]?.v;
    const b = (wsSummary as any)[XLSX.utils.encode_cell({ r, c: 1 })]?.v;
    const c = (wsSummary as any)[XLSX.utils.encode_cell({ r, c: 2 })]?.v;
    if (headerRowMatchers.some(([aa, bb, cc]) => a === aa && b === bb && c === cc)) {
      for (let col = 0; col < 3; col++) {
        const addr = XLSX.utils.encode_cell({ r, c: col });
        if ((wsSummary as any)[addr]) (wsSummary as any)[addr].s = tableHeaderStyle;
      }
    }
  }
  // Align and format numeric columns (Units right align, Amount currency)
  const currencyStyleSummary = { alignment: { horizontal: 'right' }, numFmt: '₱#,##0.00' } as any;
  const numberStyleSummary = { alignment: { horizontal: 'right' }, numFmt: '#,##0' } as any;
  for (let r = range.s.r; r <= range.e.r; r++) {
    // Units in column B
    const unitsCellAddr = XLSX.utils.encode_cell({ r, c: 1 });
    const unitsCell = (wsSummary as any)[unitsCellAddr];
    if (unitsCell && typeof unitsCell.v === 'number') {
      (wsSummary as any)[unitsCellAddr].s = { ...(unitsCell.s || {}), ...numberStyleSummary };
    }
    // Amount in column C
    const amountCellAddr = XLSX.utils.encode_cell({ r, c: 2 });
    const amountCell = (wsSummary as any)[amountCellAddr];
    if (amountCell && typeof amountCell.v === 'number') {
      (wsSummary as any)[amountCellAddr].s = { ...(amountCell.s || {}), ...currencyStyleSummary };
    }
  }

  // Details sheet (professional columns requested)
  const detailsHeaders = [
    'No.', 'Date', 'Branch', 'Category', 'DR/SI No', 'Agent', 'Last Name', 'First Name', 'Middle Name', 'Address', 'Contact No', 'Age',
    'Brand', 'Model', 'Color', 'Engine No', 'Chassis No', 'Invty Code', 'Cost', 'Delivery Status', 'Delivery Date', 'Actions', 'VAT', 'Net Amount', 'SRP',
    'Plate No', 'MV File No', 'CR No', 'OR No', 'Reg Date', 'Expiry', 'LTO Status',
    'Qty', 'Unit Price', 'Amount', 'Sale Total Amount'
  ];
  const detailsAOA: (string | number)[][] = [];
  detailsAOA.push([`Prime Motors — Sales Report`]);
  detailsAOA.push([`Period`, period.toUpperCase()]);
  detailsAOA.push([`Date Range`, dateRangeLabel]);
  detailsAOA.push([`Branch`, branchLabel]);
  detailsAOA.push([]);
  detailsAOA.push(detailsHeaders);
  detailsRaw.forEach((r, idx) => {
    const drsi = [r.drNo, r.siNo].filter(Boolean).join(' / ');
    const sale = sales.find(s => s.id === r.saleId) as any;
    const age = sale?.age || '';
    const saleItem = (sale?.sales_items || [])[0] as any;
    const invRecord: any = saleItem?.vehicle_unit?.inventory || {};
    const invtyCode = invRecord?.inventory_code || invRecord?.invty_code || invRecord?.code || '';
    const cost = saleItem?.cost ?? invRecord?.cost ?? saleItem?.items?.cost ?? '';
    const deliveryStatus = sale?.delivery_status || sale?.status || '';
    const deliveryDate = sale?.delivery_date || sale?.delivered_at || '';
    const actions = sale?.actions || '';
    const srp = saleItem?.items?.srp ?? invRecord?.items?.srp ?? r.unitPrice;
    const net = Number(r.amount || 0) / 1.12;
    const vat = Number(r.amount || 0) - net;
    detailsAOA.push([
      idx + 1,
      r.dateSold,
      r.branch,
      r.categoryOfSales,
      drsi,
      r.agent,
      r.customerLast,
      r.customerFirst,
      r.customerMiddle,
      r.address,
      r.contactNo,
      age,
      r.brand,
      r.model,
      r.color,
      r.engineNo,
      r.chassisNo,
      invtyCode,
      cost || '',
      deliveryStatus,
      deliveryDate ? (new Date(deliveryDate)).toISOString().slice(0,10) : '',
      actions,
      vat,
      net,
      srp,
      r.plateNo,
      r.mvFileNo,
      r.crNo,
      r.orNo,
      r.regDate,
      r.regExpiry,
      r.ltoStatus,
      r.qty,
      r.unitPrice,
      r.amount,
      r.saleTotalAmount
    ]);
  });
  // Totals row (Qty, VAT, Net, Amount)
  const qtySum = detailsRaw.reduce((s, r) => s + Number(r.qty || 0), 0);
  const vatSum = detailsRaw.reduce((s, r) => s + (Number(r.amount || 0) - Number(r.amount || 0) / 1.12), 0);
  const netSum = detailsRaw.reduce((s, r) => s + (Number(r.amount || 0) / 1.12), 0);
  detailsAOA.push([]);
  const totalsRow: any[] = new Array(detailsHeaders.length).fill('');
  totalsRow[5] = 'TOTALS';
  totalsRow[detailsHeaders.indexOf('VAT')] = vatSum;
  totalsRow[detailsHeaders.indexOf('Net Amount')] = netSum;
  totalsRow[detailsHeaders.indexOf('Qty')] = qtySum;
  totalsRow[detailsHeaders.indexOf('Amount')] = totalAmount;
  detailsAOA.push(totalsRow);
  const wsDetails = XLSX.utils.aoa_to_sheet(detailsAOA);
  wsDetails['!merges'] = wsDetails['!merges'] || [];
  wsDetails['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: detailsHeaders.length - 1 } });
  (wsDetails as any)['!cols'] = [
    { wch: 6 },   // No.
    { wch: 12 },  // Date
    { wch: 18 },  // Branch
    { wch: 14 },  // Category
    { wch: 16 },  // DR/SI No
    { wch: 16 },  // Agent
    { wch: 14 },  // Last Name
    { wch: 14 },  // First Name
    { wch: 12 },  // Middle Name
    { wch: 28 },  // Address
    { wch: 16 },  // Contact No
    { wch: 6 },   // Age
    { wch: 12 },  // Brand
    { wch: 18 },  // Model
    { wch: 12 },  // Color
    { wch: 18 },  // Engine No
    { wch: 18 },  // Chassis No
    { wch: 14 },  // Invty Code
    { wch: 12 },  // Cost
    { wch: 14 },  // Delivery Status
    { wch: 12 },  // Delivery Date
    { wch: 12 },  // Actions
    { wch: 12 },  // VAT
    { wch: 14 },  // Net Amount
    { wch: 12 },  // SRP
    { wch: 14 },  // Plate No
    { wch: 16 },  // MV File No
    { wch: 14 },  // CR No
    { wch: 14 },  // OR No
    { wch: 12 },  // Reg Date
    { wch: 12 },  // Expiry
    { wch: 14 },  // LTO Status
    { wch: 6 },   // Qty
    { wch: 14 },  // Unit Price
    { wch: 14 },  // Amount
    { wch: 16 }   // Sale Total Amount
  ];
  // Row heights: title + header
  (wsDetails as any)['!rows'] = [
    { hpt: 28 }, // Title
    { hpt: 18 }, { hpt: 18 }, { hpt: 18 }, // Meta rows
    { hpt: 8 },  // spacer
    { hpt: 22 }, // header
  ];
  // Style title
  const dtTitleCell = wsDetails['A1'];
  if (dtTitleCell) (dtTitleCell as any).s = {
    font: { name: 'Calibri', sz: 18, bold: true, color: { rgb: 'FF000000' } },
    alignment: { horizontal: 'center' }
  };
  // Style header row (neon green background)
  const headerRowIdx = 6; // 1-based row index in Excel
  const headerStyle = {
    font: { name: 'Calibri', sz: 12, bold: true, color: { rgb: 'FF000000' } },
    fill: { patternType: 'solid', fgColor: { rgb: 'FF39FF14' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { rgb: 'FFBFBFBF' } },
      left: { style: 'thin', color: { rgb: 'FFBFBFBF' } },
      right: { style: 'thin', color: { rgb: 'FFBFBFBF' } },
      bottom: { style: 'thin', color: { rgb: 'FFBFBFBF' } },
    },
  } as any;
  // Apply header style across all header cells
  for (let c = 0; c < detailsHeaders.length; c++) {
    const addr = XLSX.utils.encode_cell({ r: headerRowIdx - 1, c });
    if ((wsDetails as any)[addr]) (wsDetails as any)[addr].s = headerStyle;
  }
  // Style currency and number columns for data rows
  const firstDataRow = headerRowIdx + 1; // 7
  const lastDataRow = firstDataRow + detailsRaw.length - 1;
  const qtyCol = detailsHeaders.indexOf('Qty');
  const costCol = detailsHeaders.indexOf('Cost');
  const vatCol = detailsHeaders.indexOf('VAT');
  const netCol = detailsHeaders.indexOf('Net Amount');
  const srpCol = detailsHeaders.indexOf('SRP');
  const unitPriceCol = detailsHeaders.indexOf('Unit Price');
  const amountCol = detailsHeaders.indexOf('Amount');
  const saleTotalCol = detailsHeaders.indexOf('Sale Total Amount');
  const numberStyle = { alignment: { horizontal: 'right' }, numFmt: '#,##0' } as any;
  const currencyStyle = { alignment: { horizontal: 'right' }, numFmt: '₱#,##0.00' } as any;
  for (let r = firstDataRow; r <= lastDataRow; r++) {
    [qtyCol].forEach((c) => {
      const addr = XLSX.utils.encode_cell({ r: r - 1, c });
      if ((wsDetails as any)[addr]) (wsDetails as any)[addr].s = { ...(wsDetails as any)[addr].s, ...numberStyle };
    });
    [costCol, vatCol, netCol, srpCol, unitPriceCol, amountCol, saleTotalCol].forEach((c) => {
      const addr = XLSX.utils.encode_cell({ r: r - 1, c });
      if ((wsDetails as any)[addr]) (wsDetails as any)[addr].s = { ...(wsDetails as any)[addr].s, ...currencyStyle };
    });
  }
  // Add autofilter to the details table
  const lastColLetter = XLSX.utils.encode_col(detailsHeaders.length - 1);
  wsDetails['!autofilter'] = { ref: `A${headerRowIdx}:${lastColLetter}${lastDataRow}` } as any;

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
  XLSX.utils.book_append_sheet(wb, wsDetails, 'Details');

  const titleParts = [
    'Sales Report',
    branchLabel.replace(/\s+/g, '-'),
    period.toUpperCase(),
    from ? new Date(from).toISOString().slice(0,10) : '',
    to ? new Date(to).toISOString().slice(0,10) : ''
  ].filter(Boolean);
  const filename = `${titleParts.join('_')}.xlsx`;

  const out = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(out);
}
