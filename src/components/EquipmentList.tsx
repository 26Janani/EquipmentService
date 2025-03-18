import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Equipment {
  id: string;
  name: string;
  model: string;
  manufacturer: string;
  purchase_date: string;
  last_maintenance: string;
  next_maintenance: string;
  status: string;
  location: string;
  serial_number: string;
}

interface EquipmentListProps {
  refreshTrigger: number;
}

export function EquipmentList({ refreshTrigger }: EquipmentListProps) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEquipment();
  }, [refreshTrigger]);

  const fetchEquipment = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_equipment')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEquipment(data || []);
    } catch (error) {
      console.error('Error fetching equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'Maintenance':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'Retired':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {equipment.map((item) => (
        <div key={item.id} className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
            {getStatusIcon(item.status)}
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Model:</span> {item.model}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Manufacturer:</span> {item.manufacturer}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Location:</span> {item.location}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Serial Number:</span> {item.serial_number}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Purchase Date:</span>{' '}
              {new Date(item.purchase_date).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Next Maintenance:</span>{' '}
              {new Date(item.next_maintenance).toLocaleDateString()}
            </p>
          </div>
          <div className="mt-4">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                item.status === 'Active'
                  ? 'bg-green-100 text-green-800'
                  : item.status === 'Maintenance'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {item.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}