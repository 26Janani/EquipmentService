import React, { useState, useEffect } from 'react';
import { 
  Users, Wrench, Calendar, Download, Pencil, Trash2, Eye, 
  Menu, X, LogOut, ChevronDown, ChevronUp, Filter, ChevronLeft
} from 'lucide-react';
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

const calculateAgeInMonths = (date: string) => {
  const installDate = new Date(date);
  const now = new Date();
  return (now.getFullYear() - installDate.getFullYear()) * 12 + 
         (now.getMonth() - installDate.getMonth());
};

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

  const [equipmentPagination, setEquipmentPagination] = useState<PaginationState>({
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

  const handleExport = () => {
    try {
      if (activeTab === 'maintenance' && Object.keys(filters).length > 0) {
        exportFilteredMaintenanceRecords(filteredMaintenanceRecords, filters, customers, equipment);
      } else {
        exportAllData(customers, equipment, maintenanceRecords);
      }
      toast.success('Export successful');
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Failed to export');
    }
  };

  const isRecordExpired = (record: MaintenanceRecord) => {
    const serviceEndDate = new Date(record.service_end_date);
    const currentDate = new Date();
    
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

        // Model number filter
        if (filters.model_number) {
          const modelNumbers = filters.model_number.split(',');
          if (!modelNumbers.includes(record.equipments.model_number)) return false;
        }
    
        // Serial number filter
        if (filters.serial_no) {
          const serialNumbers = filters.serial_no.split(',');
          if (!serialNumbers.includes(record.serial_no)) return false;
        }
    
    // Installation date filter
    if (filters.installation_date_range?.[0] || filters.installation_date_range?.[1]) {
      const installationDate = new Date(record.installation_date);
      installationDate.setHours(0, 0, 0, 0);

      if (filters.installation_date_range[0]) {
        const startDate = new Date(filters.installation_date_range[0]);
        startDate.setHours(0, 0, 0, 0);
        if (installationDate < startDate) return false;
      }

      if (filters.installation_date_range[1]) {
        const endDate = new Date(filters.installation_date_range[1]);
        endDate.setHours(23, 59, 59, 999);
        if (installationDate > endDate) return false;
      }
    }

    // Warranty end date filter
    if (filters.warranty_end_date_range?.[0] || filters.warranty_end_date_range?.[1]) {
      const warrantyEndDate = new Date(record.warranty_end_date);
      warrantyEndDate.setHours(0, 0, 0, 0);

      if (filters.warranty_end_date_range[0]) {
        const startDate = new Date(filters.warranty_end_date_range[0]);
        startDate.setHours(0, 0, 0, 0);
        if (warrantyEndDate < startDate) return false;
      }

      if (filters.warranty_end_date_range[1]) {
        const endDate = new Date(filters.warranty_end_date_range[1]);
        endDate.setHours(23, 59, 59, 999);
        if (warrantyEndDate > endDate) return false;
      }
    }

    // Service start date filter
    if (filters.service_start_date_range?.[0] || filters.service_start_date_range?.[1]) {
      const serviceStartDate = new Date(record.service_start_date);
      serviceStartDate.setHours(0, 0, 0, 0);

      if (filters.service_start_date_range[0]) {
        const startDate = new Date(filters.service_start_date_range[0]);
        startDate.setHours(0, 0, 0, 0);
        if (serviceStartDate < startDate) return false;
      }

      if (filters.service_start_date_range[1]) {
        const endDate = new Date(filters.service_start_date_range[1]);
        endDate.setHours(23, 59, 59, 999);
        if (serviceStartDate > endDate) return false;
      }
    }

    // Service end date filter
    if (filters.service_end_date_range?.[0] || filters.service_end_date_range?.[1]) {
      const serviceEndDate = new Date(record.service_end_date);
      serviceEndDate.setHours(0, 0, 0, 0);

      if (filters.service_end_date_range[0]) {
        const startDate = new Date(filters.service_end_date_range[0]);
        startDate.setHours(0, 0, 0, 0);
        if (serviceEndDate < startDate) return false;
      }

      if (filters.service_end_date_range[1]) {
        const endDate = new Date(filters.service_end_date_range[1]);
        endDate.setHours(23, 59, 59, 999);
        if (serviceEndDate > endDate) return false;
      }
    }


    if (filters.service_statuses?.length && !filters.service_statuses.includes(record.service_status)) return false;

    if (filters.record_statuses?.length) {
      const isExpired = isRecordExpired(record);
      const status = isExpired ? 'expired' : 'active';
      if (!filters.record_statuses.includes(status)) return false;
    }

    if (filters.age_range?.years) {
      const ageInMonths = calculateAgeInMonths(record.installation_date);
      const ageInYears = ageInMonths / 12;

      const { min, max } = filters.age_range.years;

      if (min !== null && ageInYears < min) return false;

      if (max !== null) {
        if (min === 0) {
          if (ageInYears >= max) return false;
        } else {
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

  const renderSidebar = () => (
    <div 
      className={`
        fixed inset-y-0 left-0 z-40 bg-gray-900 text-white transform transition-all duration-300 ease-in-out
        ${isSidebarOpen || isHoveringNav ? 'w-64' : 'w-16'}
        ${isHoveringNav ? 'translate-x-0' : ''}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center justify-between h-16 px-4 bg-gray-800">
        <div className="flex items-center space-x-2">
          <Wrench className="h-8 w-8 text-blue-400" />
          {(isSidebarOpen || isHoveringNav) && (
            <span className="text-lg font-semibold">Equipment Manager</span>
          )}
        </div>
        {(isSidebarOpen || isHoveringNav) && (
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 rounded-md hover:bg-gray-700"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
      </div>

      <nav className="flex flex-col h-[calc(100vh-4rem)] px-2 no-scrollbar">
        <div className="flex-1 space-y-2 py-4">
          <button
            onClick={() => setActiveTab('customers')}
            className={`w-full flex items-center space-x-2 px-4 py-2 rounded-md transition-colors duration-200
              ${activeTab === 'customers' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'}`}
          >
            <Users className="h-5 w-5" />
            {(isSidebarOpen || isHoveringNav) && <span>Customers</span>}
          </button>

          <button
            onClick={() => setActiveTab('equipment')}
            className={`w-full flex items-center space-x-2 px-4 py-2 rounded-md transition-colors duration-200
              ${activeTab === 'equipment' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'}`}
          >
            <Wrench className="h-5 w-5" />
            {(isSidebarOpen || isHoveringNav) && <span>Equipments</span>}
          </button>
          
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`w-full flex items-center space-x-2 px-4 py-2 rounded-md transition-colors duration-200
              ${activeTab === 'maintenance' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'}`}
          >
            <Calendar className="h-5 w-5" />
            {(isSidebarOpen || isHoveringNav) && <span>Maintenance</span>}
          </button>

          <button
            onClick={handleExport}
            className="w-full flex items-center space-x-2 px-4 py-2 rounded-md transition-colors duration-200 hover:bg-gray-800"
          >
            <Download className="h-5 w-5" />
            {(isSidebarOpen || isHoveringNav) && <span>Export Data</span>}
          </button>
        </div>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
          >
            <LogOut className="h-5 w-5" />
            {(isSidebarOpen || isHoveringNav) && <span>Logout</span>}
          </button>
        </div>
      </nav>
    </div>
  );

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-center mb-8">
            <Wrench className="h-12 w-12 text-blue-400" />
            <h1 className="ml-3 text-2xl font-bold text-white">Medical Equipment Maintenance</h1>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
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
        {renderSidebar()}

        <div className={`flex-1 min-h-screen overflow-hidden transition-all duration-300 ${
          isSidebarOpen || isHoveringNav ? 'ml-64' : 'ml-16'
        }`}>
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">
                {activeTab === 'maintenance' && 'Maintenance Records'}
                {activeTab === 'equipment' && 'Equipment Management'}
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
                      onClick={() => exportFilteredMaintenanceRecords(filteredMaintenanceRecords, filters, customers, equipment)}
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
                    equipment={equipment}
                    maintenanceRecords={maintenanceRecords}
                  />
                </div>
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Maintenance Records</h3>
                      <button
                        onClick={() => setAddingType('maintenance')}
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model Number</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial No</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Installation Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment Age</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warranty End Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Period</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Amount</th>
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
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {record.customer.name}
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
                      <Wrench className="h-5 w-5 mr-2" />
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
              let updateData = { ...data };

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
    </div>
  );
}

export default App;