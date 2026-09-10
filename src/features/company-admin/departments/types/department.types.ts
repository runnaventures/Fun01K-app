export interface Department {
  id: string;
  organization_id: string;
  name: string;
  description?: string | null;
  manager_id?: string | null;
  parent_department_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDepartmentData {
  organization_id: string;
  name: string;
  description?: string;
  manager_id?: string;
  parent_department_id?: string;
}

export interface UpdateDepartmentData {
  name?: string;
  description?: string | null;
  manager_id?: string | null;
  parent_department_id?: string | null;
}