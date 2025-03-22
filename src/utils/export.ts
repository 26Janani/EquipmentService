import * as XLSX from 'xlsx';
import { Customer, Equipment, MaintenanceRecord } from '../types';
import { format } from 'date-fns';

function prepareMaintenanceDataForExport(records: MaintenanceRecord[]) {
  return records.map(record => ({
    'Customer Name': record.customer.name,
    'Equipment Name': record.equipments.name,
    'Model Number': record.equipments.model_number,
    'Serial Number': record.serial_no,
    'Installation Date': format(new Date(record.installation_date), 'yyyy-MM-dd'),
    'Age': record.installation_date ? calculateAge(record.installation_date) : '',
    'Warranty End Date': format(new Date(record.warranty_end_date), 'yyyy-MM-dd'),
    'Service Status': record.service_status,
    'Service Start Date': format(new Date(record.service_start_date), 'yyyy-MM-dd'),
    'Service End Date': format(new Date(record.service_end_date), 'yyyy-MM-dd'),
    'Notes': record.notes || ''
  }));
}

function prepareEquipmentDataForExport(records: Equipment[]) {
  return records.map(record => ({
    'Name': record.name,
    'Model Number': record.model_number,
    'Notes': record.notes || ''
  }));
}

function prepareCustomerDataForExport(records: Customer[]) {
  return records.map(record => ({
    'Name': record.name,
    'Bio Medical Email': record.bio_medical_email,
    'Bio Medical Contact': record.bio_medical_contact,
    'Bio Medical HOD Name': record.bio_medical_hod_name,
    'Notes': record.notes || ''
  }));
}

function calculateAge(installationDate: string): string {
  const months = differenceInMonths(new Date(installationDate), new Date());
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) {
    return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
  }

  return `${years} year${years !== 1 ? 's' : ''} ${
    remainingMonths > 0 ? `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}` : ''
  }`;
}

function differenceInMonths(date1: Date, date2: Date): number {
  const yearsDiff = date2.getFullYear() - date1.getFullYear();
  const monthsDiff = date2.getMonth() - date1.getMonth();

  return yearsDiff * 12 + monthsDiff;
}

export function exportAllData(
  customers: Customer[],
  equipment: Equipment[],
  maintenanceRecords: MaintenanceRecord[]
) {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Function to create a sheet with bold headers and auto column width
  const addSheetWithFormatting = (data: any[], sheetName: string) => {
    if (!data || data.length === 0) return;

    // Extract headers from the data keys
    const headers = Object.keys(data[0]);

    // Convert data to worksheet (excluding headers)
    const sheet = XLSX.utils.json_to_sheet(data, { skipHeader: true });

    // Add headers manually at the top (row 1)
    XLSX.utils.sheet_add_aoa(sheet, [headers], { origin: "A1" });

    // Calculate column widths dynamically
    const colWidths = headers.map((key) => {
      const maxLength = Math.max(
        key.length, // Column header length
        ...data.map((row) => (row[key] ? row[key].toString().length : 0)) // Max cell length in column
      );
      return { wch: maxLength + 2 }; // Add padding for better readability
    });

    sheet['!cols'] = colWidths; // Apply column widths

    // Apply bold styling to headers
    if (!sheet['!ref']) return; // Ensure the sheet reference exists
    const range = XLSX.utils.decode_range(sheet['!ref']);

    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col }); // Get header cell reference (row 0)
      if (sheet[cellRef]) {
        sheet[cellRef].s = { font: { bold: true } }; // Apply bold style
      }
    }

    // Append the formatted sheet to the workbook
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  };

  // Add each dataset as a separate worksheet with formatting
  addSheetWithFormatting(prepareCustomerDataForExport(customers), 'Customers');
  addSheetWithFormatting(prepareEquipmentDataForExport(equipment), 'Equipment');
  addSheetWithFormatting(prepareMaintenanceDataForExport(maintenanceRecords), 'Maintenance');

  // Generate timestamp
  const timestamp = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");

  // Write the workbook to a file
  XLSX.writeFile(workbook, `Exported_Data_${timestamp}.xlsx`);
}