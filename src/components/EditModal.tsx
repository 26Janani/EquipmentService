import React from 'react';
import { Customer, Equipment, MaintenanceRecord } from '../types';

interface EditModalProps {
  type: 'customer' | 'equipment' | 'maintenance';
  data: Customer | Equipment | MaintenanceRecord | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  customers?: Customer[];
  equipment?: Equipment[];
}

export function EditModal({ type, data, onClose, onSave, customers, equipment }: EditModalProps) {
  const [formData, setFormData] = React.useState(data);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
    onClose();
  };

  const renderCustomerForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Customer Name</label>
        <input
          type="text"
          value={(formData as Customer)?.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Bio Medical Email</label>
        <input
          type="email"
          value={(formData as Customer)?.bio_medical_email || ''}
          onChange={(e) => setFormData({ ...formData, bio_medical_email: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Bio Medical Contact</label>
        <input
          type="text"
          value={(formData as Customer)?.bio_medical_contact || ''}
          onChange={(e) => setFormData({ ...formData, bio_medical_contact: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Bio Medical HOD Name</label>
        <input
          type="text"
          value={(formData as Customer)?.bio_medical_hod_name || ''}
          onChange={(e) => setFormData({ ...formData, bio_medical_hod_name: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          value={(formData as Customer)?.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          rows={3}
        />
      </div>
    </div>
  );

  const renderEquipmentForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Equipment Name</label>
        <input
          type="text"
          value={(formData as Equipment)?.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Model Number</label>
        <input
          type="text"
          value={(formData as Equipment)?.model_number || ''}
          onChange={(e) => setFormData({ ...formData, model_number: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          value={(formData as Equipment)?.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          rows={3}
        />
      </div>
    </div>
  );

  const renderMaintenanceForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Customer</label>
        <select
          value={(formData as MaintenanceRecord)?.customer_id || ''}
          onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        >
          <option value="">Select Customer</option>
          {customers?.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Equipment</label>
        <select
          value={(formData as MaintenanceRecord)?.equipment_id || ''}
          onChange={(e) => setFormData({ ...formData, equipment_id: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        >
          <option value="">Select Equipment</option>
          {equipment?.map((eq) => (
            <option key={eq.id} value={eq.id}>
              {eq.name} - {eq.model_number}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Serial Number</label>
        <input
          type="text"
          value={(formData as MaintenanceRecord)?.serial_no || ''}
          onChange={(e) => setFormData({ ...formData, serial_no: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Installation Date</label>
        <input
          type="date"
          value={(formData as MaintenanceRecord)?.installation_date?.split('T')[0] || ''}
          onChange={(e) => setFormData({ ...formData, installation_date: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Warranty End Date</label>
        <input
          type="date"
          value={(formData as MaintenanceRecord)?.warranty_end_date?.split('T')[0] || ''}
          onChange={(e) => setFormData({ ...formData, warranty_end_date: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Service Status</label>
        <select
          value={(formData as MaintenanceRecord)?.service_status || 'WARRANTY'}
          onChange={(e) => setFormData({ ...formData, service_status: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
          >
          <option value="WARRANTY">WARRANTY</option>
          <option value="CAMC">CAMC</option>
          <option value="AMC">AMC</option>
          <option value="CALIBRATION">CALIBRATION</option>
          <option value="ONCALL SERVICE">ONCALL SERVICE</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Service Start Date</label>
        <input
          type="date"
          value={(formData as MaintenanceRecord)?.service_start_date?.split('T')[0] || ''}
          onChange={(e) => setFormData({ ...formData, service_start_date: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Service End Date</label>
        <input
          type="date"
          value={(formData as MaintenanceRecord)?.service_end_date?.split('T')[0] || ''}
          onChange={(e) => setFormData({ ...formData, service_end_date: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          value={(formData as MaintenanceRecord)?.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          rows={3}
        />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
        <h2 className="text-xl font-semibold mb-4">
          Edit {type.charAt(0).toUpperCase() + type.slice(1)}
        </h2>
        <form onSubmit={handleSubmit}>
          {type === 'customer' && renderCustomerForm()}
          {type === 'equipment' && renderEquipmentForm()}
          {type === 'maintenance' && renderMaintenanceForm()}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}