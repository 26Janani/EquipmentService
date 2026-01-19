import { supabase, isAuthenticated as checkAuth, ADMIN_EMAIL, ADMIN_PASSWORD, getCurrentUserRole } from '../../lib/supabase';
import { fetchEquipment } from '../equipment/equipmentService';
import { fetchCustomers } from '../customers/customerService';
import { fetchMaintenanceRecords } from '../maintenance/maintenanceService';
import toast from 'react-hot-toast';

export interface AuthState {
  equipments: any[];
  customers: any[];
  maintenanceRecords: any[];
  equipmentsPagination: { total: number };
  customersPagination: { total: number };
  maintenancePagination: { total: number };
}

export async function handleLogin(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message || 'Invalid credentials. Please use valid credentials.');
      return { success: false, error: error.message };
    }

    // Set admin role in user metadata if admin credentials
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      await supabase.auth.updateUser({
        data: { role: 'admin' }
      });
    } else {
      await supabase.auth.updateUser({
        data: { role: 'user' }
      });
    }

    toast.success('Logged in successfully');
    return { success: true };
  } catch (error: any) {
    // Always show a toast for any error
    toast.error(error?.message || 'Failed to log in. Please try again.');
    console.error('Error logging in:', error);
    return { success: false, error: error?.message || 'Unknown error' };
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
    const [equipmentsData, customersData, maintenanceData] = await Promise.all([
      fetchEquipment(),
      fetchCustomers(),
      fetchMaintenanceRecords()
    ]);

    return {
      equipments: equipmentsData,
      customers: customersData,
      maintenanceRecords: maintenanceData,
      equipmentsPagination: { total: equipmentsData.length },
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

// Helper to get current user role
export async function getUserRole(): Promise<string> {
  return await getCurrentUserRole();
}