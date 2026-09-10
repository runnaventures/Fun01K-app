export interface Employee {
  id: string;
  profile_id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  job_title?: string;
  department_id?: string;
  team_id?: string;
  roles: string[];
  status: 'active' | 'invited' | 'pending' | 'inactive';
  avatar_url?: string;
  points_balance?: number;
  created_at: string;
  updated_at: string;
}

export interface BulkEmployeeImport {
  first_name: string;
  last_name: string;
  email: string;
  job_title?: string;
  department_name?: string;
  team_name?: string;
  role?: string;
}

export interface EmployeeInvite {
  email: string;
  role?: string;
  department_id?: string;
  team_id?: string;
}