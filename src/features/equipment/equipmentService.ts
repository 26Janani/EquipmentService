import { supabase } from '../../lib/supabase';
import { Equipment } from '../../types';
import toast from 'react-hot-toast';

export async function addEquipment(equipmentData: Partial<Equipment>) {
  try {
    const { data, error } = await supabase
      .from('equipments')
      .insert([equipmentData])
      .select()
      .single();

    if (error) throw error;
    toast.success('Equipment added successfully');
    return data;
  } catch (error) {
    console.error('Error adding equipment:', error);
    toast.error('Failed to add equipment');
    throw error;
  }
}

export async function updateEquipment(equipment: Equipment) {
  try {
    const { error } = await supabase
      .from('equipments')
      .update(equipment)
      .eq('id', equipment.id);

    if (error) throw error;
    toast.success('Equipment updated successfully');
  } catch (error) {
    console.error('Error updating equipment:', error);
    toast.error('Failed to update equipment');
    throw error;
  }
}

export async function deleteEquipment(id: string, currentUserRole: string) {
  try {
    if (currentUserRole !== 'admin') {
      toast.error('You do not have permission to delete equipment.');
      return false;
    }
    // Check for related maintenance records
    const { data: relatedRecords } = await supabase
      .from('maintenance_records')
      .select('id')
      .eq('equipment_id', id);

    if (relatedRecords && relatedRecords.length > 0) {
      toast.error('Cannot delete this equipment. It has associated maintenance records.');
      return false;
    }

    if (!window.confirm('Are you sure you want to delete this equipment?')) {
      return false;
    }

    const { error } = await supabase
      .from('equipments')
      .delete()
      .eq('id', id);

    if (error) throw error;
    toast.success('Equipment deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting equipment:', error);
    toast.error('Failed to delete equipment');
    throw error;
  }
}

export async function fetchEquipment() {
  try {
    const { data, error } = await supabase
      .from('equipments')
      .select('*')
      .order('created_at');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching equipment:', error);
    toast.error('Failed to fetch equipment');
    throw error;
  }
}