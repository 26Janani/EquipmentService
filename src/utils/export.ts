import * as XLSX from 'xlsx';
import { Customer, Equipment, MaintenanceRecord } from '../types';
import { format } from 'date-fns';

function prepareMaintenanceDataForExport(records: MaintenanceRecord[]) {
  return records.map(record => {
    const visitDetails = record.visits?.map(visit => ({
      date: format(new Date(visit.visit_date), 'yyyy-MM-dd'),
      work: visit.work_done,
      attendedBy: visit.attended_by
    })) || [];

    const visitsFormatted = visitDetails.map((visit, index) => 
      `Visit ${index + 1}: ${visit.date} - ${visit.work} (Attended by: ${visit.attendedBy})`
    ).join('\n');

    return {
      'Customer Name': record.customer.name,
      'Equipment Name': record.equipments.name,
      'Model Number': record.equipments.model_number,
      'Serial Number': record.serial_no,
      'Installation Date': format(new Date(record.installation_date), 'yyyy-MM-dd'),
      'Age': calculateAge(record.installation_date),
      'Warranty End Date': format(new Date(record.warranty_end_date), 'yyyy-MM-dd'),
      'Service Status': record.service_status,
      'Service Start Date': format(new Date(record.service_start_date), 'yyyy-MM-dd'),
      'Service End Date': format(new Date(record.service_end_date), 'yyyy-MM-dd'),
      'Total Visits': record.visits?.length || 0,
      'Visit Details': visitsFormatted,
      'Notes': record.notes || ''
    };
  });
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
  const months = differenceInMonths(new Date(), new Date(installationDate));
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
  const yearsDiff = date1.getFullYear() - date2.getFullYear();
  const monthsDiff = date1.getMonth() - date2.getMonth();

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
    const sheet = XLSX.utils.json_to_sheet(data);

    // Add headers manually at the top (row 1)
    XLSX.utils.sheet_add_aoa(sheet, [headers], { origin: "A1" });

    // Calculate column widths dynamically
    const colWidths = headers.map((key) => {
      const maxLength = Math.max(
        key.length, // Column header length
        ...data.map((row) => {
          const cellValue = row[key]?.toString() || '';
          // For multiline content, get the longest line
          return Math.max(...cellValue.split('\n').map(line => line.length));
        })
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

    // Set row heights for cells with multiline content
    const rowHeights: { [key: number]: number } = {};
    data.forEach((row, idx) => {
      const rowNum = idx + 2; // Add 2 because row 1 is headers
      Object.values(row).forEach((value) => {
        if (typeof value === 'string' && value.includes('\n')) {
          const lines = value.split('\n').length;
          rowHeights[rowNum] = Math.max(rowHeights[rowNum] || 15, lines * 15);
        }
      });
    });

    sheet['!rows'] = Object.entries(rowHeights).map(([rowNum, height]) => ({
      hpt: height // Set custom row height
    }));

    // Append the formatted sheet to the workbook
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  };

  // Add each dataset as a separate worksheet with formatting
  addSheetWithFormatting(prepareCustomerDataForExport(customers), 'Customers');
  addSheetWithFormatting(prepareEquipmentDataForExport(equipment), 'Equipments');
  addSheetWithFormatting(prepareMaintenanceDataForExport(maintenanceRecords), 'Maintenance Records');

  // Generate timestamp
  const timestamp = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");

  // Write the workbook to a file
  XLSX.writeFile(workbook, `Exported_Data_${timestamp}.xlsx`);
}