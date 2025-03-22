import React from 'react';
import type { Customer, Equipment, MaintenanceFilters as MaintenanceFiltersType } from '../types';
import { DateRangePicker } from './DateRangePicker';
import Select from 'react-select';
import { X } from 'lucide-react';

interface MaintenanceFiltersProps {
  filters: MaintenanceFiltersType;
  onFiltersChange: (filters: MaintenanceFiltersType) => void;
  customers: Customer[];
  equipment: Equipment[];
}

const SERVICE_STATUS_OPTIONS = [
  { value: 'WARRANTY', label: 'WARRANTY' },
  { value: 'CAMC', label: 'CAMC' },
  { value: 'AMC', label: 'AMC' },
  { value: 'CALIBRATION', label: 'CALIBRATION' },
  { value: 'ONCALL SERVICE', label: 'ONCALL SERVICE' }
];

const RECORD_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' }
];

export function MaintenanceFilters({ filters, onFiltersChange, customers, equipment }: MaintenanceFiltersProps) {
  const handleClearFilters = () => {
    onFiltersChange({});
  };

  const handleAgeRangeChange = (field: 'years' | 'months', type: 'min' | 'max', value: string) => {
    const numValue = value === '' ? null : parseInt(value, 10);
    onFiltersChange({
      ...filters,
      age_range: {
        ...filters.age_range,
        [field]: {
          ...filters.age_range?.[field],
          [type]: numValue
        }
      }
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Filter Records</h3>
        <button
          onClick={handleClearFilters}
          className="inline-flex items-center px-3 py-1.5 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
        >
          <X className="h-4 w-4 mr-1" />
          Clear All Filters
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Customers</label>
          <Select
            isMulti
            value={filters.customer_ids?.map(id => ({
              value: id,
              label: customers.find(c => c.id === id)?.name || ''
            })) || null}
            options={customers.map(customer => ({
              value: customer.id,
              label: customer.name
            }))}
            onChange={(selected) => onFiltersChange({
              ...filters,
              customer_ids: selected ? selected.map(option => option.value) : undefined
            })}
            className="basic-multi-select"
            classNamePrefix="select"
            placeholder="Select customers..."
            isClearable
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Equipment</label>
          <Select
            isMulti
            value={filters.equipment_ids?.map(id => ({
              value: id,
              label: equipment.find(e => e.id === id)?.name || ''
            })) || null}
            options={equipment.map(eq => ({
              value: eq.id,
              label: `${eq.name}`
            }))}
            onChange={(selected) => onFiltersChange({
              ...filters,
              equipment_ids: selected ? selected.map(option => option.value) : undefined
            })}
            className="basic-multi-select"
            classNamePrefix="select"
            placeholder="Select equipment..."
            isClearable
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Service Status</label>
          <Select
            isMulti
            value={filters.service_statuses?.map(status => ({
              value: status,
              label: status
            })) || null}
            options={SERVICE_STATUS_OPTIONS}
            onChange={(selected) => onFiltersChange({
              ...filters,
              service_statuses: selected ? selected.map(option => option.value) : undefined
            })}
            className="basic-multi-select"
            classNamePrefix="select"
            placeholder="Select service status..."
            isClearable
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Record Status</label>
          <Select
            isMulti
            value={filters.record_statuses?.map(status => ({
              value: status,
              label: status.charAt(0).toUpperCase() + status.slice(1)
            })) || null}
            options={RECORD_STATUS_OPTIONS}
            onChange={(selected) => onFiltersChange({
              ...filters,
              record_statuses: selected ? selected.map(option => option.value as 'active' | 'expired') : undefined
            })}
            className="basic-multi-select"
            classNamePrefix="select"
            placeholder="Select record status..."
            isClearable
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Equipment Age - Years</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="flex space-x-2">
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={filters.age_range?.years?.min ?? ''}
                  onChange={(e) => handleAgeRangeChange('years', 'min', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={filters.age_range?.years?.max ?? ''}
                  onChange={(e) => handleAgeRangeChange('years', 'max', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
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
          startDate={filters.service_start_date_range?.[0] || null}
          endDate={filters.service_start_date_range?.[1] || null}
          onChange={(dates) => onFiltersChange({ ...filters, service_start_date_range: dates })}
          label="Service Start Date Range"
        />

        <DateRangePicker
          startDate={filters.service_end_date_range?.[0] || null}
          endDate={filters.service_end_date_range?.[1] || null}
          onChange={(dates) => onFiltersChange({ ...filters, service_end_date_range: dates })}
          label="Service End Date Range"
        />
      </div>
    </div>
  );
}