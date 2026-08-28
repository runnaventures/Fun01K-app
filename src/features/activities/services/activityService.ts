import { supabase } from '@/lib/supabase';
import type { 
  Activity, 
  ActivityCategory, 
  CreateActivityData, 
  UpdateActivityData,
  ActivityParticipation 
} from '../types/activity.types';

export const activityService = {
  // Categories
  async getCategories(organizationId: string): Promise<ActivityCategory[]> {
    const { data, error } = await supabase
      .from('activity_categories')
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
    const { data, error } = await supabase
      .from('activity_categories')
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

  // Activities
  async getActivities(organizationId: string, filters?: { status?: string; category_id?: string }): Promise<Activity[]> {
    let query = supabase
      .from('activities')
      .select('*, activity_categories(name), activity_types(name, color)')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching activities:', error);
      return [];
    }

    return data as unknown as Activity[];
  },

  async getActivity(id: string): Promise<Activity | null> {
    const { data, error } = await supabase
      .from('activities')
      .select('*, activity_categories(name), activity_types(name, color)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching activity:', error);
      return null;
    }

    return data as unknown as Activity;
  },

  async createActivity(data: CreateActivityData): Promise<Activity | null> {
    const insertData: any = {
      organization_id: data.organization_id,
      title: data.title,
      description: data.description,
      image_url: data.image_url || null,
      category_id: data.category_id || null,
      type_id: data.type_id || null,
      points: data.points,
      difficulty: data.difficulty,
      duration: data.duration,
      start_at: data.start_at || null,
      end_at: data.end_at || null,
      status: data.status || 'draft',
      visibility: data.visibility || 'public',
      verification_method: data.verification_method,
      requires_location: data.requires_location || false,
      requires_evidence: data.requires_evidence || false,
      requires_host_approval: data.requires_host_approval || false,
      completion_limit: data.completion_limit || null,
      created_by: data.created_by,
    };

    const { data: activity, error } = await supabase
      .from('activities')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating activity:', error);
      return null;
    }

    return activity as unknown as Activity;
  },

  async updateActivity(id: string, data: UpdateActivityData): Promise<Activity | null> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.image_url !== undefined) updateData.image_url = data.image_url;
    if (data.category_id !== undefined) updateData.category_id = data.category_id;
    if (data.type_id !== undefined) updateData.type_id = data.type_id;
    if (data.points !== undefined) updateData.points = data.points;
    if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.start_at !== undefined) updateData.start_at = data.start_at;
    if (data.end_at !== undefined) updateData.end_at = data.end_at;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.visibility !== undefined) updateData.visibility = data.visibility;
    if (data.verification_method !== undefined) updateData.verification_method = data.verification_method;
    if (data.requires_location !== undefined) updateData.requires_location = data.requires_location;
    if (data.requires_evidence !== undefined) updateData.requires_evidence = data.requires_evidence;
    if (data.requires_host_approval !== undefined) updateData.requires_host_approval = data.requires_host_approval;
    if (data.completion_limit !== undefined) updateData.completion_limit = data.completion_limit;

    const { data: updated, error } = await supabase
      .from('activities')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating activity:', error);
      return null;
    }

    return updated as unknown as Activity;
  },

  async deleteActivity(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting activity:', error);
      return false;
    }

    return true;
  },

  async changeActivityStatus(id: string, status: string): Promise<Activity | null> {
    const { data, error } = await supabase
      .from('activities')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error changing activity status:', error);
      return null;
    }

    return data as unknown as Activity;
  },

  // Participation
  async joinActivity(activityId: string, profileId: string): Promise<ActivityParticipation | null> {
    // Check if already joined
    const { data: existing } = await supabase
      .from('activity_participations')
      .select('*')
      .eq('activity_id', activityId)
      .eq('profile_id', profileId)
      .maybeSingle();

    if (existing) {
      return existing as unknown as ActivityParticipation;
    }

    const { data, error } = await supabase
      .from('activity_participations')
      .insert({
        activity_id: activityId,
        profile_id: profileId,
        status: 'joined',
      })
      .select()
      .single();

    if (error) {
      console.error('Error joining activity:', error);
      return null;
    }

    return data as unknown as ActivityParticipation;
  },

  async getActivityParticipation(activityId: string, profileId: string): Promise<ActivityParticipation | null> {
    const { data, error } = await supabase
      .from('activity_participations')
      .select('*')
      .eq('activity_id', activityId)
      .eq('profile_id', profileId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching participation:', error);
    }

    return data as unknown as ActivityParticipation | null;
  },

  async getParticipations(profileId: string): Promise<ActivityParticipation[]> {
    const { data, error } = await supabase
      .from('activity_participations')
      .select('*, activities(title, points)')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching participations:', error);
      return [];
    }

    return data as unknown as ActivityParticipation[];
  },
};