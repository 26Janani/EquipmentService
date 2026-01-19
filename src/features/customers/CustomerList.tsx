import React, { useState } from 'react';
import { Customer } from '../../types';
import { Pencil, Trash2, Users } from 'lucide-react';
import { Pagination } from '../../components/Pagination';
import { PaginationState } from '../../types';

interface CustomerListProps {
  customers: Customer[];
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  currentUserRole: string; // 'admin' or 'user'
}

export function CustomerList({
  customers,
  pagination,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onAdd,
  currentUserRole
}: CustomerListProps) {
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Customers</h3>
          <button
            onClick={onAdd}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Users className="h-5 w-5 mr-2" />
            Add Customer
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bio Medical Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bio Medical Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bio Medical HOD</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer.id}
                  onClick={() => setSelectedRow(customer.id)}
                  style={selectedRow === customer.id ? {
                    backgroundColor: '#edf2f7'
                  } : {}}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {customer.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.bio_medical_email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.bio_medical_contact}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.bio_medical_hod_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {customer.notes}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                    <button
                      onClick={() => onEdit(customer)}
                      className="inline-flex items-center text-indigo-600 hover:text-indigo-900"
                      title="Edit customer"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    {currentUserRole === 'admin' && (
                      <button
                        onClick={() => onDelete(customer.id)}
                        className="inline-flex items-center text-red-600 hover:text-red-900"
                        title="Delete customer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
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