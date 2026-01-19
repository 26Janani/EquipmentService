import React, { useState } from 'react';
import { Customer, Equipment } from '../types';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import Select from 'react-select';
import { X } from 'lucide-react';

interface AddModalProps {
  type: 'customer' | 'equipment' | 'maintenance';
  onClose: () => void;
  onSuccess: () => void;
  customers?: Customer[];
  equipments?: Equipment[];
  currentUserRole?: string; // 'admin' or 'user'
}

export function AddModal({ type, onClose, onSuccess, customers, equipments, currentUserRole, renewData, history }: AddModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [selectedServiceStatus, setSelectedServiceStatus] = useState<string>('');

  const SERVICE_STATUS_OPTIONS = [
    { value: 'WARRANTY', label: 'WARRANTY' },
    { value: 'CAMC', label: 'CAMC' },
    { value: 'AMC', label: 'AMC' },
    { value: 'CALIBRATION', label: 'CALIBRATION' },
    { value: 'ONCALL SERVICE', label: 'ONCALL SERVICE' },
    { value: 'END OF LIFE', label: 'END OF LIFE' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (type === 'maintenance') {
        let maintenanceData = { ...formData };

        if (selectedServiceStatus === 'ONCALL SERVICE' || selectedServiceStatus === 'END OF LIFE' || selectedServiceStatus === 'CALIBRATION') {
          maintenanceData = {
            ...maintenanceData,
            service_start_date: null,
            service_end_date: null,
            invoice_number: null,
            invoice_date: null,
            amount: 0
          };
        } else {
          // Validate service end date for non-ONCALL SERVICE records
          const serviceEndDate = new Date(formData.service_end_date);
          const currentDate = new Date();
          currentDate.setDate(currentDate.getDate() - 1);
          
          serviceEndDate.setHours(0, 0, 0, 0);
          currentDate.setHours(0, 0, 0, 0);

          if (serviceEndDate < currentDate) {
            toast.error('Service end date must be greater than or equal to current date');
            return;
          }

          if (!formData.service_start_date || !formData.service_end_date) {
            toast.error('Please fill in all required fields');
            return;
          }
        }

        if (!maintenanceData.customer_id || !maintenanceData.equipment_id || !maintenanceData.serial_no || !maintenanceData.installation_date || !maintenanceData.warranty_end_date || !maintenanceData.service_status) {
          toast.error('Please fill in all required fields');
          return;
        }

        const { data, error } = await supabase
          .from(type === 'maintenance' ? 'maintenance_records' : `${type}s`)
          .insert([maintenanceData])
          .select();

        if (error) throw error;
      } else {
        if (!formData.name || (type === 'equipment' && !formData.model_number) || 
            (type === 'customer' && (!formData.bio_medical_email || !formData.bio_medical_contact || !formData.bio_medical_hod_name))) {
          toast.error('Please fill in all required fields');
          return;
        }

        const { data, error } = await supabase
          .from(`${type}s`)
          .insert([formData])
          .select();

        if (error) throw error;
      }

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
        <label className="block text-sm font-medium text-gray-700">Product Code</label>
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
          options={equipments?.map(e => ({ value: e.id, label: `${e.name}` }))}
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
        <label className="block text-sm font-medium text-gray-700">Equipment Purchase Value</label>
        <input
          type="number"
          min="0"
          onChange={(e) => setFormData({ ...formData, equipment_purchase_value: parseFloat(e.target.value) })}
          onWheel={e => e.currentTarget.blur()}
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
          onChange={(selected) => {
            setSelectedServiceStatus(selected?.value || '');
            setFormData({ ...formData, service_status: selected?.value });
          }}
          className="mt-1"
          required
        />
      </div>

      { (selectedServiceStatus === 'WARRANTY' || selectedServiceStatus === 'AMC' || selectedServiceStatus === 'CAMC') && (
        <>
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
            <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
            <input
              type="text"
              onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Invoice Date</label>
            <input
              type="date"
              onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Invoice Amount</label>
            <input
              type="number"
              min="0"
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              onWheel={e => e.currentTarget.blur()}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>
        </>
      )}
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
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-start justify-center z-50 overflow-y-auto pt-4 pb-20">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Add {type.charAt(0).toUpperCase() + type.slice(1)}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            {type === 'customer' && renderCustomerForm()}
            {type === 'equipment' && renderEquipmentForm()}
            {type === 'maintenance' && renderMaintenanceForm()}
          </div>
          
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
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