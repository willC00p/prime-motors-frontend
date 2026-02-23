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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateExcelReport = generateExcelReport;
exports.generateLTORegistrationsExcel = generateLTORegistrationsExcel;
const XLSX = __importStar(require("xlsx"));
function generateExcelReport(res, data, config) {
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    // Convert data to worksheet format
    const rows = data.map(item => {
        const row = {};
        config.columns.forEach(col => {
            let value = item;
            // Handle nested properties (e.g., 'sale.customer_name')
            const keys = col.key.split('.');
            for (const key of keys) {
                value = value === null || value === void 0 ? void 0 : value[key];
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
function generateLTORegistrationsExcel(res, data) {
    const config = {
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
