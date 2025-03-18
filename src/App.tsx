import React, { useState } from 'react';
import { Stethoscope } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { EquipmentForm } from './components/EquipmentForm';
import { EquipmentList } from './components/EquipmentList';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleEquipmentAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Stethoscope className="h-8 w-8 text-blue-600" />
            <h1 className="ml-3 text-2xl font-bold text-gray-900">Medical Equipment Management</h1>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Equipment</h2>
            <EquipmentForm onEquipmentAdded={handleEquipmentAdded} />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Equipment Inventory</h2>
            <EquipmentList refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;