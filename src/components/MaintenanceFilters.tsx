import React from 'react';
import type { Customer, Equipment, MaintenanceFilters as MaintenanceFiltersType } from '../types';
import { DateRangePicker } from './DateRangePicker';
import Select from 'react-select';

interface MaintenanceFiltersProps {
  filters: MaintenanceFiltersType;
  onFiltersChange: (filters: MaintenanceFiltersType) => void;
  customers: Customer[];
  equipment: Equipment[];
}

export function MaintenanceFilters({ filters, onFiltersChange, customers, equipment }: MaintenanceFiltersProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6 space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Filters</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Customers</label>
          <Select
            isMulti
            options={customers.map(customer => ({
              value: customer.id,
              label: customer.name
            }))}
            value={filters.customer_ids?.map(id => ({
              value: id,
              label: customers.find(c => c.id === id)?.name || ''
            }))}
            onChange={(selected) => onFiltersChange({
              ...filters,
              customer_ids: selected.map(option => option.value)
            })}
            className="mt-1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Equipment</label>
          <Select
            isMulti
            options={equipment.map(eq => ({
              value: eq.id,
              label: `${eq.name}`
            }))}
            value={filters.equipment_ids?.map(id => ({
              value: id,
              label: equipment.find(e => e.id === id)?.name || ''
            }))}
            onChange={(selected) => onFiltersChange({
              ...filters,
              equipment_ids: selected.map(option => option.value)
            })}
            className="mt-1"
          />
        </div>

        <DateRangePicker
          startDate={filters.installation_date_range?.[0] || null}
          endDate={filters.installation_date_range?.[1] || null}
          onChange={(dates) => onFiltersChange({ ...filters, installation_date_range: dates })}
          label="Installation Date Range"
        />

        <DateRangePicker
          startDate={filters.warranty_end_date_range?.[0] || null}
          endDate={filters.warranty_end_date_range?.[1] || null}
          onChange={(dates) => onFiltersChange({ ...filters, warranty_end_date_range: dates })}
          label="Warranty End Date Range"
        />

        <DateRangePicker
          startDate={filters.service_date_range?.[0] || null}
          endDate={filters.service_date_range?.[1] || null}
          onChange={(dates) => onFiltersChange({ ...filters, service_date_range: dates })}
          label="Service Date Range"
        />
      </div>
    </div>
  );
}