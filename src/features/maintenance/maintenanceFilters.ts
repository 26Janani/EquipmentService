import { MaintenanceRecord, MaintenanceFilters } from '../../types';

export const calculateAgeInMonths = (date: string) => {
  const installDate = new Date(date);
  const now = new Date();
  return (now.getFullYear() - installDate.getFullYear()) * 12 + 
         (now.getMonth() - installDate.getMonth());
};

export const isRecordExpired = (record: MaintenanceRecord) => {
  const serviceEndDate = new Date(record.service_end_date);
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() - 1)
  
  serviceEndDate.setHours(0, 0, 0, 0);
  currentDate.setHours(0, 0, 0, 0);
  
  return serviceEndDate < currentDate;
};

export const filterMaintenanceRecords = (
  records: MaintenanceRecord[],
  filters: MaintenanceFilters
): MaintenanceRecord[] => {
  return records.filter(record => {
    if (filters.customer_ids?.length && !filters.customer_ids.includes(record.customer_id)) return false;
    if (filters.equipment_ids?.length && !filters.equipment_ids.includes(record.equipment_id)) return false;

    // Serial number filter
    if (filters.serial_no) {
      const serialNumbers = filters.serial_no.split(',');
      if (!serialNumbers.includes(record.serial_no)) return false;
    }

    // Installation date filter
    if (filters.installation_date_range?.[0] || filters.installation_date_range?.[1]) {
      const installationDate = new Date(record.installation_date);
      installationDate.setHours(0, 0, 0, 0);

      if (filters.installation_date_range[0]) {
        const startDate = new Date(filters.installation_date_range[0]);
        startDate.setHours(0, 0, 0, 0);
        if (installationDate < startDate) return false;
      }

      if (filters.installation_date_range[1]) {
        const endDate = new Date(filters.installation_date_range[1]);
        endDate.setHours(23, 59, 59, 999);
        if (installationDate > endDate) return false;
      }
    }

    // Warranty end date filter
    if (filters.warranty_end_date_range?.[0] || filters.warranty_end_date_range?.[1]) {
      const warrantyEndDate = new Date(record.warranty_end_date);
      warrantyEndDate.setHours(0, 0, 0, 0);

      if (filters.warranty_end_date_range[0]) {
        const startDate = new Date(filters.warranty_end_date_range[0]);
        startDate.setHours(0, 0, 0, 0);
        if (warrantyEndDate < startDate) return false;
      }

      if (filters.warranty_end_date_range[1]) {
        const endDate = new Date(filters.warranty_end_date_range[1]);
        endDate.setHours(23, 59, 59, 999);
        if (warrantyEndDate > endDate) return false;
      }
    }

    // Service date filter
    if (filters.service_date_range?.[0] || filters.service_date_range?.[1]) {
      const serviceStartDate = new Date(record.service_start_date);
      serviceStartDate.setHours(0, 0, 0, 0);
      const serviceEndDate = new Date(record.service_end_date);
      serviceEndDate.setHours(0, 0, 0, 0);

      if (filters.service_date_range[0]) {
        const startDate = new Date(filters.service_date_range[0]);
        startDate.setHours(0, 0, 0, 0);
        if (serviceStartDate < startDate || serviceEndDate < startDate) return false;
      }

      if (filters.service_date_range[1]) {
        const endDate = new Date(filters.service_date_range[1]);
        endDate.setHours(23, 59, 59, 999);
        if (serviceStartDate > endDate || serviceEndDate > endDate) return false;
      }
    }

    if (filters.service_statuses?.length && !filters.service_statuses.includes(record.service_status)) return false;

    if (filters.record_statuses?.length) {
      const isExpired = isRecordExpired(record);
      const status = isExpired ? 'expired' : 'active';
      if (!filters.record_statuses.includes(status)) return false;
    }

    if (filters.age_range?.years) {
      const ageInMonths = calculateAgeInMonths(record.installation_date);
      const ageInYears = ageInMonths / 12;

      const { min, max } = filters.age_range.years;

      if (min !== null && ageInYears < min) return false;

      if (max !== null) {
        if (min === 0) {
          if (ageInYears >= max) return false;
        } else {
          if (ageInYears > max) return false;
        }
      }
    }

    return true;
  });
};