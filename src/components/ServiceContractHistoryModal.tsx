import React from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';

interface ServiceContractHistoryModalProps {
  history: any[];
  onClose: () => void;
}

export function ServiceContractHistoryModal({ history, onClose }: ServiceContractHistoryModalProps) {
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Service Contract History</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            title="Close modal"
          >
            <span className="sr-only">Close</span>
            <X className="h-6 w-6" />
          </button>
        </div>
        <div>
          {history.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No service contract history available.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Service Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Service Period</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Invoice Number</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Invoice Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Invoice Amount</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2">{item.service_status}</td>
                    <td className="px-4 py-2">
                      {item.service_start_date && item.service_end_date
                        ? `${format(new Date(item.service_start_date), 'PP')} - ${format(new Date(item.service_end_date), 'PP')}`
                        : ''}
                    </td>
                    <td className="px-4 py-2">{item.invoice_number}</td>
                    <td className="px-4 py-2">{item.invoice_date ? format(new Date(item.invoice_date), 'PP') : ''}</td>
                    <td className="px-4 py-2">{item.amount}</td>
                    <td className="px-4 py-2">{item.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default ServiceContractHistoryModal;
