import * as XLSX from 'xlsx';
import { Response } from 'express';

export interface ExcelReportColumn {
  header: string;
  key: string;
  width: number;
}

export interface ExcelReportConfig {
  sheetName: string;
  filename: string;
  columns: ExcelReportColumn[];
}

export function generateExcelReport(
  res: Response,
  data: any[],
  config: ExcelReportConfig
) {
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  
  // Convert data to worksheet format
  const rows = data.map(item => {
    const row: any = {};
    config.columns.forEach(col => {
      let value = item;
      // Handle nested properties (e.g., 'sale.customer_name')
      const keys = col.key.split('.');
      for (const key of keys) {
        value = value?.[key];
      }
      // Format dates if the value is a Date object
      if (value instanceof Date) {
        value = value.toLocaleDateString();
      }
      row[col.header] = value;
    });
    return row;
  });
  
  const ws = XLSX.utils.json_to_sheet(rows, {
    header: config.columns.map(col => col.header)
  });

  // Set column widths
  ws['!cols'] = config.columns.map(col => ({ wch: col.width }));

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, config.sheetName);

  // Write to a buffer
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  // Set response headers
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=${config.filename}`);
  
  // Send the file
  res.send(buf);
}

export function generateLTORegistrationsExcel(res: Response, data: any[]) {
  const config: ExcelReportConfig = {
    sheetName: 'LTO Registrations',
    filename: `LTO_Registrations_${new Date().toISOString().split('T')[0]}.xlsx`,
    columns: [
      { header: 'Customer Name', key: 'sale.first_name', width: 20 },
      { header: 'Plate Number', key: 'plate_number', width: 15 },
      { header: 'Engine Number', key: 'engine_number', width: 20 },
      { header: 'Chassis Number', key: 'chassis_number', width: 20 },
      { header: 'MV File Number', key: 'mv_file_number', width: 15 },
      { header: 'CR Number', key: 'cr_number', width: 15 },
      { header: 'OR Number', key: 'or_number', width: 15 },
      { header: 'CSR Number', key: 'csr_number', width: 15 },
      { header: 'SDR Number', key: 'sdr_number', width: 15 },
      { header: 'Registration Date', key: 'registration_date', width: 15 },
      { header: 'Expiration Date', key: 'expiration_date', width: 15 },
      { header: 'Insurance Provider', key: 'insurance_provider', width: 20 },
      { header: 'Insurance Policy', key: 'insurance_policy_number', width: 20 },
      { header: 'Insurance Expiry', key: 'insurance_expiry', width: 15 },
      { header: 'Registration Fee', key: 'registration_fee', width: 15 },
      { header: 'Insurance Fee', key: 'insurance_fee', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Remarks', key: 'remarks', width: 30 }
    ]
  };

  generateExcelReport(res, data, config);
}
