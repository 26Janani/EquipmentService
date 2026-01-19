import { supabase } from '../../lib/supabase';
import { Customer } from '../../types';
import toast from 'react-hot-toast';

export async function addCustomer(customerData: Partial<Customer>) {
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert([customerData])
      .select()
      .single();

    if (error) throw error;
    toast.success('Customer added successfully');
    return data;
  } catch (error) {
    console.error('Error adding customer:', error);
    toast.error('Failed to add customer');
    throw error;
  }
}

export async function updateCustomer(customer: Customer) {
  try {
    const { error } = await supabase
      .from('customers')
      .update(customer)
      .eq('id', customer.id);

    if (error) throw error;
    toast.success('Customer updated successfully');
  } catch (error) {
    console.error('Error updating customer:', error);
    toast.error('Failed to update customer');
    throw error;
  }
}

export async function deleteCustomer(id: string, currentUserRole: string) {
  try {
    if (currentUserRole !== 'admin') {
      toast.error('You do not have permission to delete customers.');
      return false;
    }

    // Check for related maintenance records
    const { data: relatedRecords } = await supabase
      .from('maintenance_records')
      .select('id')
      .eq('customer_id', id);

    if (relatedRecords && relatedRecords.length > 0) {
      toast.error('Cannot delete this customer. It has associated maintenance records.');
      return false;
    }

    if (!window.confirm('Are you sure you want to delete this customer?')) {
      return false;
    }

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) throw error;
    toast.success('Customer deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting customer:', error);
    toast.error('Failed to delete customer');
    throw error;
  }
}

export async function fetchCustomers() {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching customers:', error);
    toast.error('Failed to fetch customers');
    throw error;
  }
}