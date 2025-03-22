import React, { useState } from 'react';
import { Customer, Equipments, MaintenanceRecord } from '../types';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import Select from 'react-select';

interface AddModalProps {
  type: 'customer' | 'equipment' | 'maintenance';
  onClose: () => void;
  onSuccess: () => void;
  customers?: Customer[];
  equipment?: Equipments[];
}

export function AddModal({ type, onClose, onSuccess, customers, equipment }: AddModalProps) {
  const [formData, setFormData] = useState<any>({});

  const SERVICE_STATUS_OPTIONS = [
    { value: 'WARRANTY', label: 'WARRANTY' },
    { value: 'CAMC', label: 'CAMC' },
    { value: 'AMC', label: 'AMC' },
    { value: 'CALIBRATION', label: 'CALIBRATION' },
    { value: 'ONCALL SERVICE', label: 'ONCALL SERVICE' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from(type === 'maintenance' ? 'maintenance_records' : `${type}s`)
        .insert([formData]);

      if (error) throw error;

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} added successfully`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding record:', error);
      toast.error(`Failed to add ${type}`);
    }
  };

  const renderCustomerForm = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Customer Name</label>
        <input
          type="text"
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Bio Medical Email</label>
        <input
          type="email"
          onChange={(e) => setFormData({ ...formData, bio_medical_email: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Bio Medical Contact</label>
        <input
          type="text"
          onChange={(e) => setFormData({ ...formData, bio_medical_contact: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Bio Medical HOD Name</label>
        <input
          type="text"
          onChange={(e) => setFormData({ ...formData, bio_medical_hod_name: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
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
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Model Number</label>
        <input
          type="text"
          onChange={(e) => setFormData({ ...formData, model_number: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
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
        <Select
          options={customers?.map(c => ({ value: c.id, label: c.name }))}
          onChange={(selected) => setFormData({ ...formData, customer_id: selected?.value })}
          className="mt-1"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Equipment</label>
        <Select
          options={equipment?.map(e => ({ value: e.id, label: `${e.name} - ${e.model_number}` }))}
          onChange={(selected) => setFormData({ ...formData, equipment_id: selected?.value })}
          className="mt-1"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Serial Number</label>
        <input
          type="text"
          onChange={(e) => setFormData({ ...formData, serial_no: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Installation Date</label>
        <input
          type="date"
          onChange={(e) => setFormData({ ...formData, installation_date: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Warranty End Date</label>
        <input
          type="date"
          onChange={(e) => setFormData({ ...formData, warranty_end_date: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Service Status</label>
        <Select
          options={SERVICE_STATUS_OPTIONS}
          onChange={(selected) => setFormData({ ...formData, service_status: selected?.value })}
          className="mt-1"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Service Start Date</label>
        <input
          type="date"
          onChange={(e) => setFormData({ ...formData, service_start_date: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Service End Date</label>
        <input
          type="date"
          onChange={(e) => setFormData({ ...formData, service_end_date: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Amount</label>
        <input
          type="number"
          step="0.01"
          min="0"
          onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="Enter amount"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          rows={3}
        />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
        <h2 className="text-xl font-semibold mb-4">
          Add {type.charAt(0).toUpperCase() + type.slice(1)}
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
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}