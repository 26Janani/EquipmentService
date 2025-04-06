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

export interface MaintenanceVisit {
  id: string;
  maintenance_record_id: string;
  visit_date: string;
  visit_status: string;
  equipment_status: string;
  work_done: string;
  attended_by: string;
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
  service_status: string;
  service_start_date: string;
  service_end_date: string;
  amount: number;
  notes?: string;
  equipment: Equipment;
  customer: Customer;
  visits?: MaintenanceVisit[];
  created_at?: string;
  updated_at?: string;
}

export interface MaintenanceFilters {
  customer_ids?: string[];
  equipment_ids?: string[];
  model_number?: string;
  serial_no?: string;
  installation_date_range?: [Date | null, Date | null];
  warranty_end_date_range?: [Date | null, Date | null];
  service_date_range?: [Date | null, Date | null];
  service_statuses?: string[];
  record_statuses?: ('active' | 'expired')[];
  age_range?: {
    years: { min: number | null; max: number | null };
  };
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}