import { supabase } from '@/lib/supabase';
import type { Department, CreateDepartmentData, UpdateDepartmentData } from '../types/department.types';

export const departmentService = {
  async getDepartments(organizationId: string): Promise<Department[]> {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name');

    if (error) {
      console.error('Error fetching departments:', error);
      return [];
    }

    return data as Department[];
  },

  async getDepartment(id: string): Promise<Department | null> {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching department:', error);
      return null;
    }

    return data as Department;
  },

  async createDepartment(data: CreateDepartmentData): Promise<Department | null> {
    const { data: department, error } = await supabase
      .from('departments')
      .insert({
        organization_id: data.organization_id,
        name: data.name,
        description: data.description || null,
        manager_id: data.manager_id || null,
        parent_department_id: data.parent_department_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating department:', error);
      return null;
    }

    return department as Department;
  },

  async updateDepartment(id: string, data: UpdateDepartmentData): Promise<Department | null> {
    const updateData: {
      name?: string;
      description?: string | null;
      manager_id?: string | null;
      parent_department_id?: string | null;
      updated_at: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.manager_id !== undefined) updateData.manager_id = data.manager_id;
    if (data.parent_department_id !== undefined) updateData.parent_department_id = data.parent_department_id;

    const { data: updated, error } = await supabase
      .from('departments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating department:', error);
      return null;
    }

    return updated as Department;
  },

  async deleteDepartment(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting department:', error);
      return false;
    }

    return true;
  },
};