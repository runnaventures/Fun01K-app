import { supabase } from '@/lib/supabase';
import type { ActivityCategory, ActivityType } from '../types/activity.types';

export const categoryTypeService = {
  // Categories
  async getCategories(organizationId: string): Promise<ActivityCategory[]> {
    const { data, error } = await (supabase
      .from('activity_categories') as any)
      .select('*')
      .eq('organization_id', organizationId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    return data as ActivityCategory[];
  },

  async createCategory(organizationId: string, name: string, description?: string, icon?: string, color?: string): Promise<ActivityCategory | null> {
    const { data, error } = await (supabase
      .from('activity_categories') as any)
      .insert({
        organization_id: organizationId,
        name,
        description: description || null,
        icon: icon || null,
        color: color || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      return null;
    }

    return data as ActivityCategory;
  },

  async updateCategory(id: string, data: Partial<ActivityCategory>): Promise<ActivityCategory | null> {
    const { data: updated, error } = await (supabase
      .from('activity_categories') as any)
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      return null;
    }

    return updated as ActivityCategory;
  },

  async deleteCategory(id: string): Promise<boolean> {
    const { error } = await (supabase
      .from('activity_categories') as any)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      return false;
    }

    return true;
  },

  // Types (sub-categories)
  async getTypes(organizationId: string, categoryId?: string): Promise<ActivityType[]> {
    let query = (supabase
      .from('activity_types') as any)
      .select('*, activity_categories(name, color)')
      .eq('organization_id', organizationId)
      .order('sort_order', { ascending: true });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching types:', error);
      return [];
    }

    return data as ActivityType[];
  },

  async createType(organizationId: string, categoryId: string, name: string, description?: string, icon?: string, color?: string): Promise<ActivityType | null> {
    const { data, error } = await (supabase
      .from('activity_types') as any)
      .insert({
        organization_id: organizationId,
        category_id: categoryId,
        name,
        description: description || null,
        icon: icon || null,
        color: color || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating type:', error);
      return null;
    }

    return data as ActivityType;
  },

  async updateType(id: string, data: Partial<ActivityType>): Promise<ActivityType | null> {
    const { data: updated, error } = await (supabase
      .from('activity_types') as any)
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating type:', error);
      return null;
    }

    return updated as ActivityType;
  },

  async deleteType(id: string): Promise<boolean> {
    const { error } = await (supabase
      .from('activity_types') as any)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting type:', error);
      return false;
    }

    return true;
  },
};