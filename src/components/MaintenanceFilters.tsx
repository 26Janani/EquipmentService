import React from 'react';
import { Customer, Equipment, MaintenanceFilters } from '../types';
import { DateRangePicker } from './DateRangePicker';

interface MaintenanceFiltersProps {
  filters: MaintenanceFilters;
  onFiltersChange: (filters: MaintenanceFilters) => void;
  customers: Customer[];
  equipment: Equipment[];
}

export function MaintenanceFilters({ filters, onFiltersChange, customers, equipment }: MaintenanceFiltersProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6 space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Filters</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Customer</label>
          <select
            value={filters.customer_id || ''}
            onChange={(e) => onFiltersChange({ ...filters, customer_id: e.target.value || undefined })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">All Customers</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Equipment</label>
          <select
            value={filters.equipment_id || ''}
            onChange={(e) => onFiltersChange({ ...filters, equipment_id: e.target.value || undefined })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">All Equipment</option>
            {equipment.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.name} - {eq.model_number}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Model Number</label>
          <input
            type="text"
            value={filters.model_number || ''}
            onChange={(e) => onFiltersChange({ ...filters, model_number: e.target.value || undefined })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Search by model number"
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