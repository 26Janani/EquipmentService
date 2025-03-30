import React from 'react';
import { MaintenanceRecord } from '../../types';
import { Pencil, Trash2, Calendar, Eye } from 'lucide-react';
import { Pagination } from '../../components/Pagination';
import { PaginationState } from '../../types';
import { format } from 'date-fns';
import { calculateAge } from '../../utils/age';

interface MaintenanceListProps {
  records: MaintenanceRecord[];
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (record: MaintenanceRecord) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onViewVisits: (record: MaintenanceRecord) => void;
  isRecordExpired: (record: MaintenanceRecord) => boolean;
}

export function MaintenanceList({
  records,
  pagination,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onAdd,
  onViewVisits,
  isRecordExpired
}: MaintenanceListProps) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Maintenance Records</h3>
          <button
            onClick={onAdd}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Calendar className="h-5 w-5 mr-2" />
            Add Maintenance
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Installation Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment Age</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warranty End Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Record Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record) => {
                const expired = isRecordExpired(record);
                return (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.customer.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.equipments.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.equipments.model_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.serial_no}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(record.installation_date), 'PP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {calculateAge(record.installation_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(record.warranty_end_date), 'PP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.service_status}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.service_start_date && record.service_end_date 
                        ? `${format(new Date(record.service_start_date), 'PP')} - ${format(new Date(record.service_end_date), 'PP')}`
                        : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.invoice_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.invoice_date ? format(new Date(record.invoice_date), 'PP') : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => onViewVisits(record)}
                        className="inline-flex items-center text-blue-600 hover:text-blue-900"
                        title="View visits"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        <span>{record.visits?.length || 0} visits</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        expired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {expired ? 'Expired' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.notes}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                      <button
                        onClick={() => !expired && onEdit(record)}
                        className={`inline-flex items-center ${expired ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-indigo-600 hover:text-indigo-900'}`}
                        title={expired ? 'Cannot edit expired records' : 'Edit record'}
                        disabled={expired}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => !expired && onDelete(record.id)}
                        className={`inline-flex items-center ${expired ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-red-600 hover:text-red-900'}`}
                        title={expired ? 'Cannot delete expired records' : 'Delete record'}
                        disabled={expired}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination
            pagination={pagination}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </div>
      </div>
    </div>
  );
}