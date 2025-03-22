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

  // Add each dataset as a separate worksheet
  const customersSheet = XLSX.utils.json_to_sheet(prepareCustomerDataForExport(customers));
  const equipmentSheet = XLSX.utils.json_to_sheet(prepareEquipmentDataForExport(equipment));
  const maintenanceSheet = XLSX.utils.json_to_sheet(prepareMaintenanceDataForExport(maintenanceRecords));

  // Add the worksheets to the workbook
  XLSX.utils.book_append_sheet(workbook, customersSheet, 'Customers');
  XLSX.utils.book_append_sheet(workbook, equipmentSheet, 'Equipment');
  XLSX.utils.book_append_sheet(workbook, maintenanceSheet, 'Maintenance');

  // Generate timestamp
  const timestamp = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
  
  // Write the workbook to a file
  XLSX.writeFile(workbook, `Exported_Data_${timestamp}.xlsx`);
}