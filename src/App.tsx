import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Wrench, Calendar, Download, Filter, ChevronDown, ChevronUp, Menu
} from 'lucide-react';
import { isSessionExpired } from './lib/supabase';
import toast, { Toaster } from 'react-hot-toast';
import { Customer, Equipment, MaintenanceRecord, MaintenanceFilters, PaginationState, MaintenanceVisit } from './types';
import { MaintenanceFilters as MaintenanceFiltersComponent } from './components/MaintenanceFilters';
import { EditModal } from './components/EditModal';
import { AddModal } from './components/AddModal';
import { VisitModal } from './components/VisitModal';
import { Sidebar } from './components/Sidebar';
import { CustomerList } from './features/customers/CustomerList';
import { updateCustomer, deleteCustomer } from './features/customers/customerService';
import { EquipmentList } from './features/equipment/EquipmentList';
import { updateEquipment, deleteEquipment } from './features/equipment/equipmentService';
import { MaintenanceList } from './features/maintenance/MaintenanceList';
import { 
  updateMaintenance, 
  deleteMaintenance
} from './features/maintenance/maintenanceService';
import { filterMaintenanceRecords, isRecordExpired } from './features/maintenance/maintenanceFilters';
import { exportAllData, exportFilteredMaintenanceRecords } from './utils/export';
import { handleLogin, handleLogout, fetchData, checkAuthentication } from './features/auth/authService';

function App() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [filters, setFilters] = useState<MaintenanceFilters>({});
  const [editingItem, setEditingItem] = useState<{
    type: 'customer' | 'equipment' | 'maintenance';
    data: Customer | Equipment | MaintenanceRecord;
  } | null>(null);
  const [addingType, setAddingType] = useState<'customer' | 'equipment' | 'maintenance' | null>(null);
  const [activeTab, setActiveTab] = useState<'maintenance' | 'equipments' | 'customers'>('maintenance');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFiltersVisible, setIsFiltersVisible] = useState(true);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    total: 0
  });
  const [editingVisits, setEditingVisits] = useState<MaintenanceRecord | null>(null);
  const [isHoveringNav, setIsHoveringNav] = useState(false);

  const [customersPagination, setCustomersPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    total: 0
  });

  const [equipmentsPagination, setEquipmentsPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    total: 0
  });

  const handleMouseEnter = () => {
    if (!isSidebarOpen) {
      setIsHoveringNav(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isSidebarOpen) {
      setIsHoveringNav(false);
    }
  };

  // Add session monitoring effect
  const [isCheckingSession, setIsCheckingSession] = useState(false);

  // Add session expiry handler
  const handleSessionExpiry = useCallback(async () => {
    const expired = await isSessionExpired();
    if (expired && isLoggedIn) {
      setIsLoggedIn(false);
      setEquipments([]);
      setCustomers([]);
      setMaintenanceRecords([]);
      toast.error('Session expired. Please log in again.');
    }
  }, [isLoggedIn]);

  // Add session monitoring effect
  useEffect(() => {
    const checkSession = async () => {
      if (isCheckingSession) return;
      setIsCheckingSession(true);
      try {
        await handleSessionExpiry();
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
    const intervalId = setInterval(checkSession, 60000);
    return () => clearInterval(intervalId);
  }, [handleSessionExpiry, isCheckingSession]);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const authenticated = await checkAuthentication();
    setIsLoggedIn(authenticated);
    if (authenticated) {
      loadData();
    }
  }

  async function loadData() {
    const data = await fetchData();
    if (data) {
      setEquipments(data.equipments);
      setCustomers(data.customers);
      setMaintenanceRecords(data.maintenanceRecords);
      setEquipmentsPagination(prev => ({ ...prev, total: data.equipmentsPagination.total }));
      setCustomersPagination(prev => ({ ...prev, total: data.customersPagination.total }));
      setPagination(prev => ({ ...prev, total: data.maintenancePagination.total }));
    }
  }

  const onLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = await handleLogin(formData);
    if (result.success) {
      setIsLoggedIn(true);
      loadData();
    }
  };

  const onLogout = async () => {
    const result = await handleLogout();
    if (result.success) {
      setIsLoggedIn(false);
      setEquipments([]);
      setCustomers([]);
      setMaintenanceRecords([]);
    }
  };

  const handleVisitChange = (maintenanceId: string, updatedVisits: MaintenanceVisit[]) => {
    setMaintenanceRecords(records =>
      records.map(record =>
        record.id === maintenanceId
          ? { ...record, visits: updatedVisits }
          : record
      )
    );
  };

  const handleExport = () => {
    try {
      exportAllData(customers, equipments, maintenanceRecords);
      toast.success('Export successful');
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Failed to export');
    }
  };

  const paginatedCustomers = customers.slice(
    (customersPagination.page - 1) * customersPagination.pageSize,
    customersPagination.page * customersPagination.pageSize
  );

  const paginatedEquipment = equipments.slice(
    (equipmentsPagination.page - 1) * equipmentsPagination.pageSize,
    equipmentsPagination.page * equipmentsPagination.pageSize
  );

  const filteredMaintenanceRecords = filterMaintenanceRecords(maintenanceRecords, filters);

  useEffect(() => {
    setPagination(prev => ({ ...prev, total: filteredMaintenanceRecords.length, page: 1 }));
  }, [filters]);

  const paginatedRecords = filteredMaintenanceRecords.slice(
    (pagination.page - 1) * pagination.pageSize,
    pagination.page * pagination.pageSize
  );

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-center mb-8">
            <Wrench className="h-12 w-12 text-blue-400" />
            <h1 className="ml-3 text-2xl font-bold text-white">Medical Equipment Maintenance</h1>
          </div>
          
          <form onSubmit={onLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-200">Email</label>
              <input
                type="email"
                name="email"
                required
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200">Password</label>
              <input
                type="password"
                name="password"
                required
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter your password"
              />
            </div>
            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" />
      
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 rounded-md bg-gray-900 text-white"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      <div className="flex">
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          isHoveringNav={isHoveringNav}
          activeTab={activeTab}
          handleMouseEnter={handleMouseEnter}
          handleMouseLeave={handleMouseLeave}
          setIsSidebarOpen={setIsSidebarOpen}
          setActiveTab={setActiveTab}
          handleExport={handleExport}
          handleLogout={onLogout}
        />

        <div className={`flex-1 min-h-screen overflow-hidden transition-all duration-300 ${
          isSidebarOpen || isHoveringNav ? 'ml-64' : 'ml-16'
        }`}>
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">
                {activeTab === 'maintenance' && 'Maintenance Records'}
                {activeTab === 'equipments' && 'Equipment Management'}
                {activeTab === 'customers' && 'Customer Management'}
              </h1>
              {activeTab === 'maintenance' && (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setIsFiltersVisible(!isFiltersVisible)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Filter className="h-5 w-5 mr-2" />
                    {isFiltersVisible ? 'Hide Filters' : 'Show Filters'}
                    {isFiltersVisible ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => exportFilteredMaintenanceRecords(filteredMaintenanceRecords, filters, customers, equipments)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Export Filtered Records
                  </button>
                </div>
              )}
            </div>

            {activeTab === 'maintenance' && (
              <>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isFiltersVisible ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <MaintenanceFiltersComponent
                    filters={filters}
                    onFiltersChange={setFilters}
                    customers={customers}
                    equipments={equipments}
                    maintenanceRecords={maintenanceRecords}
                  />
                </div>
                <MaintenanceList
                  records={paginatedRecords}
                  pagination={pagination}
                  onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
                  onPageSizeChange={(pageSize) => setPagination(prev => ({ ...prev, pageSize, page: 1 }))}
                  onEdit={(record) => setEditingItem({ type: 'maintenance', data: record })}
                  onDelete={async (id) => {
                    try {
                      const deleted = await deleteMaintenance(id);
                      if (deleted) {
                        loadData();
                      }
                    } catch (error) {
                      // Error is already handled in the service
                    }
                  }}
                  onAdd={() => setAddingType('maintenance')}
                  onViewVisits={(record) => setEditingVisits(record)}
                  isRecordExpired={isRecordExpired}
                />
              </>
            )}

            {activeTab === 'equipments' && (
              <EquipmentList
                equipment={paginatedEquipment}
                pagination={equipmentsPagination}
                onPageChange={(page) => setEquipmentsPagination(prev => ({ ...prev, page }))}
                onPageSizeChange={(pageSize) => setEquipmentsPagination(prev => ({ ...prev, pageSize, page: 1 }))}
                onEdit={(equipment) => setEditingItem({ type: 'equipment', data: equipment })}
                onDelete={async (id) => {
                  try {
                    const deleted = await deleteEquipment(id);
                    if (deleted) {
                      loadData();
                    }
                  } catch (error) {
                    // Error is already handled in the service
                  }
                }}
                onAdd={() => setAddingType('equipment')}
              />
            )}

            {activeTab === 'customers' && (
              <CustomerList
                customers={paginatedCustomers}
                pagination={customersPagination}
                onPageChange={(page) => setCustomersPagination(prev => ({ ...prev, page }))}
                onPageSizeChange={(pageSize) => setCustomersPagination(prev => ({ ...prev, pageSize, page: 1 }))}
                onEdit={(customer) => setEditingItem({ type: 'customer', data: customer })}
                onDelete={async (id) => {
                  try {
                    const deleted = await deleteCustomer(id);
                    if (deleted) {
                      loadData();
                    }
                  } catch (error) {
                    // Error is already handled in the service
                  }
                }}
                onAdd={() => setAddingType('customer')}
              />
            )}
          </div>
        </div>
      </div>

      {editingItem && (
        <EditModal
          type={editingItem.type}
          data={editingItem.data}
          onClose={() => setEditingItem(null)}
          onSave={async (data) => {
            try {
              if (editingItem.type === 'maintenance') {
                await updateMaintenance(data as MaintenanceRecord);
              } else if (editingItem.type === 'equipment') {
                await updateEquipment(data as Equipment);
              } else {
                await updateCustomer(data as Customer);
              }
              loadData();
              setEditingItem(null);
            } catch (error) {
              // Error is already handled in the service
            }
          }}
          customers={customers}
          equipments={equipments}
        />
      )}

      {addingType && (
        <AddModal
          type={addingType}
          onClose={() => setAddingType(null)}
          onSuccess={loadData}
          customers={customers}
          equipments={equipments}
        />
      )}

      {editingVisits && (
        <VisitModal
          maintenanceId={editingVisits.id}
          visits={editingVisits.visits || []}
          onClose={() => setEditingVisits(null)}
          onVisitChange={handleVisitChange}
          isExpired={isRecordExpired(editingVisits)}
        />
      )}
    </div>
  );
}

export default App;