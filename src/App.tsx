import React, { useState, useEffect } from 'react';
import { Plus, Wrench, Bell, Calendar, Settings, Download, Pencil, Trash2, Eye } from 'lucide-react';
import { supabase, isAuthenticated, ADMIN_EMAIL, ADMIN_PASSWORD } from './lib/supabase';
import { format } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';
import { Customer, Equipments, MaintenanceRecord, MaintenanceFilters, PaginationState, MaintenanceVisit } from './types';
import { MaintenanceFilters as MaintenanceFiltersComponent } from './components/MaintenanceFilters';
import { EditModal } from './components/EditModal';
import { AddModal } from './components/AddModal';
import { Pagination } from './components/Pagination';
import { calculateAge } from './utils/age';
import { exportAllData, exportFilteredMaintenanceRecords } from './utils/export';
import { VisitModal } from './components/VisitModal';

function App() {
  const [equipment, setEquipment] = useState<Equipments[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [filters, setFilters] = useState<MaintenanceFilters>({});
  const [editingItem, setEditingItem] = useState<{
    type: 'customer' | 'equipment' | 'maintenance';
    data: Customer | Equipments | MaintenanceRecord;
  } | null>(null);
  const [addingType, setAddingType] = useState<'customer' | 'equipment' | 'maintenance' | null>(null);
  const [activeTab, setActiveTab] = useState<'maintenance' | 'equipment' | 'customers'>('maintenance');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    total: 0
  });
  const [editingVisits, setEditingVisits] = useState<MaintenanceRecord | null>(null);

  const [customersPagination, setCustomersPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    total: 0
  });

  const [equipmentPagination, setEquipmentPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    total: 0
  });

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const authenticated = await isAuthenticated();
    setIsLoggedIn(authenticated);
    if (authenticated) {
      fetchData();
    }
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      toast.error('Invalid credentials. Please use admin credentials.');
      return;
    }
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setIsLoggedIn(true);
      fetchData();
      toast.success('Logged in successfully');
    } catch (error) {
      console.error('Error logging in:', error);
      toast.error('Failed to log in. Please try again.');
    }
  }

  async function handleLogout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setIsLoggedIn(false);
      setEquipment([]);
      setCustomers([]);
      setMaintenanceRecords([]);
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  }

  async function fetchData() {
    try {
      const [equipmentRes, customersRes, maintenanceRes] = await Promise.all([
        supabase.from('equipments').select('*').order('created_at'),
        supabase.from('customers').select('*').order('created_at'),
        supabase.from('maintenance_records').select(`
          *,
          equipments(*),
          customer:customer_id(*),
          visits:maintenance_visits(*)
        `).order('created_at'),
      ]);

      if (equipmentRes.error) throw equipmentRes.error;
      if (customersRes.error) throw customersRes.error;
      if (maintenanceRes.error) throw maintenanceRes.error;

      if (equipmentRes.data) {
        setEquipment(equipmentRes.data);
        setEquipmentPagination(prev => ({ ...prev, total: equipmentRes.data.length }));
      }
      
      if (customersRes.data) {
        setCustomers(customersRes.data);
        setCustomersPagination(prev => ({ ...prev, total: customersRes.data.length }));
      }
      
      if (maintenanceRes.data) {
        setMaintenanceRecords(maintenanceRes.data);
        setPagination(prev => ({ ...prev, total: maintenanceRes.data.length }));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    }
  }

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
      exportAllData(customers, equipment, maintenanceRecords);
      toast.success('Export successful');
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Failed to export');
    }
  };

  const handleExportFiltered = () => {
    try {
      exportFilteredMaintenanceRecords(filteredMaintenanceRecords, filters, customers, equipment);
      toast.success('Export successful');
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Failed to export');
    }
  };

  async function handleDelete(type: string, id: string) {
    if (type === 'equipment' || type === 'customer') {
      const { data: relatedRecords } = await supabase
        .from('maintenance_records')
        .select('id')
        .eq(type === 'equipment' ? 'equipment_id' : 'customer_id', id);

      if (relatedRecords && relatedRecords.length > 0) {
        toast.error(`Cannot delete this ${type}. It has associated maintenance records.`);
        return;
      }
    }

    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from(type === 'maintenance' ? 'maintenance_records' : `${type}s`)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete');
    }
  }

  const isRecordExpired = (record: MaintenanceRecord) => {
    const serviceEndDate = new Date(record.service_end_date);
    const currentDate = new Date();
    
    // Reset time parts to midnight for accurate date comparison
    serviceEndDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);
    
    return serviceEndDate < currentDate;
  };

  const paginatedCustomers = customers.slice(
    (customersPagination.page - 1) * customersPagination.pageSize,
    customersPagination.page * customersPagination.pageSize
  );

  const paginatedEquipment = equipment.slice(
    (equipmentPagination.page - 1) * equipmentPagination.pageSize,
    equipmentPagination.page * equipmentPagination.pageSize
  );

  const filteredMaintenanceRecords = maintenanceRecords.filter(record => {
    if (filters.customer_ids?.length && !filters.customer_ids.includes(record.customer_id)) return false;
    if (filters.equipment_ids?.length && !filters.equipment_ids.includes(record.equipment_id)) return false;
    if (filters.model_number && !record.equipment.model_number.includes(filters.model_number)) return false;
    
    const installationDate = new Date(record.installation_date);
    if (filters.installation_date_range?.[0] && installationDate < filters.installation_date_range[0]) return false;
    if (filters.installation_date_range?.[1] && installationDate > filters.installation_date_range[1]) return false;

    const warrantyEndDate = new Date(record.warranty_end_date);
    if (filters.warranty_end_date_range?.[0] && warrantyEndDate < filters.warranty_end_date_range[0]) return false;
    if (filters.warranty_end_date_range?.[1] && warrantyEndDate > filters.warranty_end_date_range[1]) return false;

    const serviceStartDate = new Date(record.service_start_date);
    if (filters.service_start_date_range?.[0] && serviceStartDate < filters.service_start_date_range[0]) return false;
    if (filters.service_start_date_range?.[1] && serviceStartDate > filters.service_start_date_range[1]) return false;

    const serviceEndDate = new Date(record.service_end_date);
    if (filters.service_end_date_range?.[0] && serviceEndDate < filters.service_end_date_range[0]) return false;
    if (filters.service_end_date_range?.[1] && serviceEndDate > filters.service_end_date_range[1]) return false;

    // Service Status filter
    if (filters.service_statuses?.length && !filters.service_statuses.includes(record.service_status)) return false;

    // Record Status filter
    if (filters.record_statuses?.length) {
      const isExpired = isRecordExpired(record);
      const status = isExpired ? 'expired' : 'active';
      if (!filters.record_statuses.includes(status)) return false;
    }

    // Age filter with exact year boundaries
    if (filters.age_range?.years) {
      const ageInMonths = calculateAgeInMonths(record.installation_date);
      const ageInYears = ageInMonths / 12;

      const { min, max } = filters.age_range.years;

      // When min is set (e.g., min = 1), include all records >= min years
      if (min !== null && ageInYears < min) return false;

      // When max is set:
      // For min = 0, max = 1: exclude records >= 1 year (12 months)
      // For min = 1, max = 3: exclude records > 3 years (36 months)
      if (max !== null) {
        if (min === 0) {
          // When min = 0, strictly exclude anything >= max years
          if (ageInYears >= max) return false;
        } else {
          // When min > 0, exclude anything > max years
          if (ageInYears > max) return false;
        }
      }
    }

    return true;
  });

  useEffect(() => {
    setPagination(prev => ({ ...prev, total: filteredMaintenanceRecords.length, page: 1 }));
  }, [filters]);

  const paginatedRecords = filteredMaintenanceRecords.slice(
    (pagination.page - 1) * pagination.pageSize,
    pagination.page * pagination.pageSize
  );

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-center mb-8">
            <Wrench className="h-10 w-10 text-blue-600" />
            <h1 className="ml-3 text-2xl font-bold text-gray-900">Medical Equipment Maintenance</h1>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                name="password"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
      
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Wrench className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-semibold">Medical Equipment Maintenance</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Download className="h-5 w-5 mr-2" />
                Export All
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('customers')}
                className={`${
                  activeTab === 'customers'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Customers
              </button>
              <button
                onClick={() => setActiveTab('equipment')}
                className={`${
                  activeTab === 'equipment'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Equipments
              </button>
              <button
                onClick={() => setActiveTab('maintenance')}
                className={`${
                  activeTab === 'maintenance'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Maintenance Records
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'maintenance' && (
          <>
            <MaintenanceFiltersComponent
              filters={filters}
              onFiltersChange={setFilters}
              customers={customers}
              equipment={equipment}
            />
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Maintenance Records</h3>
                  <div className="flex space-x-4">
                    <button
                      onClick={handleExportFiltered}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Export Filtered Records
                    </button>
                    <button
                      onClick={() => setAddingType('maintenance')}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Calendar className="h-5 w-5 mr-2" />
                      Add Maintenance
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model Number</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Installation Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warranty End</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Period</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visits</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Record Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedRecords.map((record) => {
                        const expired = isRecordExpired(record);
                        return (
                          <tr key={record.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{record.customer.name}</div>
                              <div className="text-sm text-gray-500">{record.customer.bio_medical_email}</div>
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
                              {format(new Date(record.service_start_date), 'PP')} - {format(new Date(record.service_end_date), 'PP')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {record.amount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button
                                onClick={() => setEditingVisits(record)}
                                className="inline-flex items-center text-blue-600 hover:text-blue-900"
                                title="View visits"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                <span>{record.visits?.length || 0} visits</span>
                              </button>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {record.notes}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                expired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {expired ? 'Expired' : 'Active'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                              <button
                                onClick={() => !expired && setEditingItem({ type: 'maintenance', data: record })}
                                className={`inline-flex items-center ${expired ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-indigo-600 hover:text-indigo-900'}`}
                                title={expired ? 'Cannot edit expired records' : 'Edit record'}
                                disabled={expired}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => !expired && handleDelete('maintenance', record.id)}
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
                    onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
                    onPageSizeChange={(pageSize) => setPagination(prev => ({ ...prev, pageSize, page: 1 }))}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'equipment' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Equipment List</h3>
                <button
                  onClick={() => setAddingType('equipment')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Settings className="h-5 w-5 mr-2" />
                  Add Equipment
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model Number</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedEquipment.map((eq) => (
                      <tr key={eq.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {eq.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {eq.model_number}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {eq.notes}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                          <button
                            onClick={() => setEditingItem({ type: 'equipment', data: eq })}
                            className="inline-flex items-center text-indigo-600 hover:text-indigo-900"
                            title="Edit equipment"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete('equipment', eq.id)}
                            className="inline-flex items-center text-red-600 hover:text-red-900"
                            title="Delete equipment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pagination
                  pagination={equipmentPagination}
                  onPageChange={(page) => setEquipmentPagination(prev => ({ ...prev, page }))}
                  onPageSizeChange={(pageSize) => setEquipmentPagination(prev => ({ ...prev, pageSize, page: 1 }))}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Customers</h3>
                <button
                  onClick={() => setAddingType('customer')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-5 w-5 mr-2" />
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
                    {paginatedCustomers.map((customer) => (
                      <tr key={customer.id}>
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
                            onClick={() => setEditingItem({ type: 'customer', data: customer })}
                            className="inline-flex items-center text-indigo-600 hover:text-indigo-900"
                            title="Edit customer"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete('customer', customer.id)}
                            className="inline-flex items-center text-red-600 hover:text-red-900"
                            title="Delete customer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Pagination
                  pagination={customersPagination}
                  onPageChange={(page) => setCustomersPagination(prev => ({ ...prev, page }))}
                  onPageSizeChange={(pageSize) => setCustomersPagination(prev => ({ ...prev, pageSize, page: 1 }))}
                />
              </div>
            </div>
          </div>
        )}

        {editingItem && (
          <EditModal
            type={editingItem.type}
            data={editingItem.data}
            onClose={() => setEditingItem(null)}
            onSave={async (data) => {
              try {
                let updateData = { ...data };

                // Exclude `customer` and `equipment` if updating a maintenance record
                if (editingItem.type === 'maintenance') {
                  const { customer, equipments, visits, ...filteredData } = data;
                  updateData = filteredData;
                }

                const { error } = await supabase
                  .from(editingItem.type === 'maintenance' ? 'maintenance_records' : `${editingItem.type}s`)
                  .update(updateData)
                  .eq('id', updateData.id);

                if (error) throw error;

                toast.success('Updated successfully');
                fetchData();
                setEditingItem(null);
              } catch (error) {
                console.error('Error updating:', error);
                toast.error('Failed to update');
              }
            }}
            customers={customers}
            equipment={equipment}
          />
        )}

        {addingType && (
          <AddModal
            type={addingType}
            onClose={() => setAddingType(null)}
            onSuccess={fetchData}
            customers={customers}
            equipment={equipment}
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
      </main>
    </div>
  );
}

export default App;