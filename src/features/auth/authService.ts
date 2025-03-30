import { supabase, isAuthenticated as checkAuth, ADMIN_EMAIL, ADMIN_PASSWORD } from '../../lib/supabase';
import { fetchEquipment } from '../equipment/equipmentService';
import { fetchCustomers } from '../customers/customerService';
import { fetchMaintenanceRecords } from '../maintenance/maintenanceService';
import toast from 'react-hot-toast';

export interface AuthState {
  equipment: any[];
  customers: any[];
  maintenanceRecords: any[];
  equipmentPagination: { total: number };
  customersPagination: { total: number };
  maintenancePagination: { total: number };
}

export async function handleLogin(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    toast.error('Invalid credentials. Please use admin credentials.');
    return { success: false, error: 'Invalid credentials' };
  }
  
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    toast.success('Logged in successfully');
    return { success: true };
  } catch (error) {
    console.error('Error logging in:', error);
    toast.error('Failed to log in. Please try again.');
    return { success: false, error: error.message };
  }
}

export async function handleLogout(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error logging out:', error);
    toast.error('Failed to log out');
    return { success: false, error: error.message };
  }
}

export async function fetchData(): Promise<AuthState | null> {
  try {
    const [equipmentData, customersData, maintenanceData] = await Promise.all([
      fetchEquipment(),
      fetchCustomers(),
      fetchMaintenanceRecords()
    ]);

    return {
      equipment: equipmentData,
      customers: customersData,
      maintenanceRecords: maintenanceData,
      equipmentPagination: { total: equipmentData.length },
      customersPagination: { total: customersData.length },
      maintenancePagination: { total: maintenanceData.length }
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    if (error.message?.includes('JWT expired') || error.message?.includes('invalid token')) {
      toast.error('Session expired. Please log in again.');
    } else {
      toast.error('Failed to load data');
    }
    return null;
  }
}

export async function checkAuthentication(): Promise<boolean> {
  return await checkAuth();
}