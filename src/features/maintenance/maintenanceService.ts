import { supabase } from '../../lib/supabase';
import { MaintenanceRecord, MaintenanceVisit } from '../../types';
import toast from 'react-hot-toast';
import { isSessionExpired } from '../../lib/supabase';

export async function addMaintenance(maintenanceData: Partial<MaintenanceRecord>) {
  try {
    const { data, error } = await supabase
      .from('maintenance_records')
      .insert([maintenanceData])
      .select()
      .single();

    if (error) throw error;
    toast.success('Maintenance record added successfully');
    return data;
  } catch (error) {
    console.error('Error adding maintenance record:', error);
    toast.error('Failed to add maintenance record');
    throw error;
  }
}

export async function updateMaintenance(maintenance: MaintenanceRecord) {
  try {
    const { customer, equipment, visits, ...filteredData } = maintenance;
    
    // Reset fields for specific service statuses
    if (['CALIBRATION', 'ONCALL SERVICE', 'END OF LIFE'].includes(maintenance.service_status)) {
      filteredData.service_start_date = null;
      filteredData.service_end_date = null;
      filteredData.invoice_number = null;
      filteredData.invoice_date = null;
      filteredData.amount = 0;
    }

    const { error } = await supabase
      .from('maintenance_records')
      .update(filteredData)
      .eq('id', maintenance.id);

    if (error) throw error;
    toast.success('Maintenance record updated successfully');
  } catch (error) {
    console.error('Error updating maintenance record:', error);
    toast.error('Failed to update maintenance record');
    throw error;
  }
}

export async function deleteMaintenance(id: string, currentUserRole: string) {
  try {
    if (currentUserRole !== 'admin') {
      toast.error('You do not have permission to delete maintenance records.');
      return false;
    }

    const expired = await isSessionExpired();
    if (expired) {
      toast.error('Session expired. Please log in again.');
      return false;
    }

    if (!window.confirm('Are you sure you want to delete this maintenance record?')) {
      return false;
    }

    const { error } = await supabase
      .from('maintenance_records')
      .delete()
      .eq('id', id);

    if (error) throw error;
    toast.success('Maintenance record deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting maintenance record:', error);
    toast.error('Failed to delete maintenance record');
    throw error;
  }
}

export async function fetchMaintenanceRecords() {
  try {
    const { data, error } = await supabase
      .from('maintenance_records')
      .select(`
        *,
        equipment:equipment_id(*),
        customer:customer_id(*),
        visits:maintenance_visits(*)
      `)
      .order('created_at');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching maintenance records:', error);
    toast.error('Failed to fetch maintenance records');
    throw error;
  }
}

export async function updateMaintenanceVisit(visit: MaintenanceVisit) {
  try {
    const { error } = await supabase
      .from('maintenance_visits')
      .update({
        visit_date: visit.visit_date,
        work_done: visit.work_done,
        attended_by: visit.attended_by
      })
      .eq('id', visit.id);

    if (error) throw error;
    toast.success('Visit updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating visit:', error);
    toast.error('Failed to update visit');
    throw error;
  }
}

export async function addMaintenanceVisit(visit: Partial<MaintenanceVisit>) {
  try {
    const { data, error } = await supabase
      .from('maintenance_visits')
      .insert([visit])
      .select()
      .single();

    if (error) throw error;
    toast.success('Visit added successfully');
    return data;
  } catch (error) {
    console.error('Error adding visit:', error);
    toast.error('Failed to add visit');
    throw error;
  }
}

export async function deleteMaintenanceVisit(visitId: string) {
  try {
    const { error } = await supabase
      .from('maintenance_visits')
      .delete()
      .eq('id', visitId);

    if (error) throw error;
    toast.success('Visit deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting visit:', error);
    toast.error('Failed to delete visit');
    throw error;
  }
}