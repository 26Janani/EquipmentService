export interface Equipment {
  id: string;
  name: string;
  model_number: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  bio_medical_email: string;
  bio_medical_contact: string;
  bio_medical_hod_name: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MaintenanceRecord {
  id: string;
  equipment_id: string;
  customer_id: string;
  serial_no: string;
  installation_date: string;
  warranty_end_date: string;
  service_status: 'pending' | 'in_progress' | 'completed';
  service_start_date: string;
  service_end_date: string;
  notes?: string;
  equipment: Equipment;
  customer: Customer;
  created_at?: string;
  updated_at?: string;
}

export interface MaintenanceFilters {
  customer_id?: string;
  equipment_id?: string;
  model_number?: string;
  installation_date_range?: [Date | null, Date | null];
  warranty_end_date_range?: [Date | null, Date | null];
  service_date_range?: [Date | null, Date | null];
}