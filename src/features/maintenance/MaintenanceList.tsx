import React , { useState } from 'react';
import { MaintenanceRecord } from '../../types';
import { Pencil, Trash2, Calendar, Eye, PlusCircle } from 'lucide-react';
import { Pagination } from '../../components/Pagination';
import { PaginationState } from '../../types';
import { format, compareAsc } from 'date-fns';
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
  onRenew: (record: MaintenanceRecord) => void;
  isRecordExpired: (record: MaintenanceRecord) => boolean;
  currentUserRole: string; // 'admin' or 'user'
  onShowServiceHistory: (record: MaintenanceRecord) => void;
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
  onRenew,
  isRecordExpired,
  currentUserRole,
  onShowServiceHistory
}: MaintenanceListProps) {
  const [selectedRow, setSelectedRow] = useState<string | null>(null);

  // Helper function to get the next scheduled visit date
  const getNextVisitDate = (visits) => {
    const now = new Date();
    // Filter for scheduled visits with dates in the future
    const futureScheduledVisits = visits
      .filter(visit =>
        visit.visit_status === 'Scheduled' &&
        visit.scheduled_date &&
        new Date(visit.scheduled_date) > now
      )
      // Sort by date, ascending (earliest first)
      .sort((a, b) => compareAsc(new Date(a.scheduled_date), new Date(b.scheduled_date)));
    // Return the earliest future date if available
    if (futureScheduledVisits.length > 0) {
      return format(new Date(futureScheduledVisits[0].scheduled_date), 'PP');
    }
    return 'No upcoming visits';
  };

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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Visit Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Record Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment Purchase Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Installation/ Warranty Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment Age</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warranty End Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Contract History</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map((record) => {
                const expired = isRecordExpired(record);
                return (
                  <tr key={record.id}
                    onClick={() => setSelectedRow(record.id)}
                    style={selectedRow === record.id ? {
                      backgroundColor: '#edf2f7'
                    } : {}}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.customer.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.equipment.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.serial_no}
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
                      {record.visits && record.visits.length > 0
                        ? getNextVisitDate(record.visits)
                        : 'No visits'}
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
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${expired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                        {expired ? 'Expired' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.equipment.model_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.equipment_purchase_value}
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
                        onClick={() => onShowServiceHistory(record)}
                        className="inline-flex items-center text-blue-600 hover:text-blue-900"
                        title="View Service Contract History"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        <span>{record.service_contracts?.length || 0}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.notes}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                      <button
                        onClick={() => onRenew(record)}
                        className="inline-flex items-center text-green-600 hover:text-green-900"
                        title="Add/Renew service record"
                      >
                        <PlusCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onEdit(record)}
                        className="inline-flex items-center text-indigo-600 hover:text-indigo-900"
                        title="Edit record"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {currentUserRole === 'admin' && (
                        <button
                          onClick={() => onDelete(record.id)}
                          className="inline-flex items-center text-red-600 hover:text-red-900"
                          title="Delete record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
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