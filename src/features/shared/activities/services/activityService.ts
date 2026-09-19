// src/features/activities/services/activityService.ts

import { supabase } from '@/lib/supabase';
import type {
  Activity,
  ActivityCategory,
  ActivityType,
  CreateActivityData,
  UpdateActivityData,
  ActivityParticipation,
} from '../types/activity.types';

export class ActivityService {
  /**
   * Get activities for an organization (or global)
   */
  async getActivities(organizationId?: string): Promise<Activity[]> {
    try {
      let query = supabase
        .from('activities')
        .select(`
          *,
          organization:organization_id(name),
          category:category_id(name),
          type:type_id(name),
          interest:interest_id(id, name, icon, color),
          sub_interest:sub_interest_id(id, name, slug)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      } else {
        query = query.is('organization_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  }

  /**
   * Get featured activities
   */
  async getFeaturedActivities(organizationId?: string): Promise<Activity[]> {
    try {
      let query = supabase
        .from('activities')
        .select(`
          *,
          organization:organization_id(name),
          category:category_id(name),
          type:type_id(name),
          interest:interest_id(id, name, icon, color),
          sub_interest:sub_interest_id(id, name, slug)
        `)
        .eq('is_featured', true)
        .eq('status', 'active')
        .order('featured_at', { ascending: false })
        .limit(20);

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching featured activities:', error);
      return [];
    }
  }

  /**
   * Get a single activity by ID
   */
  async getActivity(id: string): Promise<Activity | null> {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          organization:organization_id(name),
          category:category_id(name),
          type:type_id(name),
          interest:interest_id(id, name, icon, color),
          sub_interest:sub_interest_id(id, name, slug)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching activity:', error);
      return null;
    }
  }

  /**
   * Get activity categories
   */
  async getCategories(organizationId?: string): Promise<ActivityCategory[]> {
    try {
      let query = supabase
        .from('activity_categories')
        .select('*')
        .order('name', { ascending: true });

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  /**
   * Get activity types by category
   */
  async getTypes(categoryId?: string): Promise<ActivityType[]> {
    try {
      let query = supabase
        .from('activity_types')
        .select('*')
        .order('name', { ascending: true });

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching types:', error);
      return [];
    }
  }

  /**
   * Create a new activity
   */
  async createActivity(data: CreateActivityData): Promise<Activity | null> {
    try {
      const { data: activity, error } = await supabase
        .from('activities')
        .insert({
          title: data.title,
          description: data.description || null,
          category_id: data.category_id || null,
          interest_id: data.interest_id || null,
          sub_interest_id: data.sub_interest_id || null,
          type_id: data.type_id || null,
          organization_id: data.organization_id || null,
          points: data.points,
          difficulty: data.difficulty || 'easy',
          duration: data.duration || null,
          start_at: data.start_at || null,
          end_at: data.end_at || null,
          visibility: data.visibility || 'public',
          verification_method: data.verification_method || 'manual',
          requires_location: data.requires_location || false,
          requires_evidence: data.requires_evidence || false,
          requires_host_approval: data.requires_host_approval || false,
          completion_limit: data.completion_limit || null,
          status: data.status || 'draft',
          created_by: data.created_by,
          image_url: data.image_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return activity;
    } catch (error) {
      console.error('Error creating activity:', error);
      return null;
    }
  }

  /**
   * Update an existing activity
   */
  async updateActivity(id: string, data: UpdateActivityData): Promise<Activity | null> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.category_id !== undefined) updateData.category_id = data.category_id;
      if (data.interest_id !== undefined) updateData.interest_id = data.interest_id;
      if (data.sub_interest_id !== undefined) updateData.sub_interest_id = data.sub_interest_id;
      if (data.type_id !== undefined) updateData.type_id = data.type_id;
      if (data.points !== undefined) updateData.points = data.points;
      if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;
      if (data.duration !== undefined) updateData.duration = data.duration;
      if (data.start_at !== undefined) updateData.start_at = data.start_at;
      if (data.end_at !== undefined) updateData.end_at = data.end_at;
      if (data.visibility !== undefined) updateData.visibility = data.visibility;
      if (data.verification_method !== undefined) updateData.verification_method = data.verification_method;
      if (data.requires_location !== undefined) updateData.requires_location = data.requires_location;
      if (data.requires_evidence !== undefined) updateData.requires_evidence = data.requires_evidence;
      if (data.requires_host_approval !== undefined) updateData.requires_host_approval = data.requires_host_approval;
      if (data.completion_limit !== undefined) updateData.completion_limit = data.completion_limit;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.image_url !== undefined) updateData.image_url = data.image_url;

      const { data: activity, error } = await supabase
        .from('activities')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return activity;
    } catch (error) {
      console.error('Error updating activity:', error);
      return null;
    }
  }

  /**
   * Delete an activity
   */
  async deleteActivity(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting activity:', error);
      return false;
    }
  }

  /**
   * Feature an activity
   */
  async featureActivity(id: string): Promise<Activity | null> {
    try {
      const { data: activity, error } = await supabase
        .from('activities')
        .update({
          is_featured: true,
          featured_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return activity;
    } catch (error) {
      console.error('Error featuring activity:', error);
      return null;
    }
  }

  /**
   * Unfeature an activity
   */
  async unfeatureActivity(id: string): Promise<Activity | null> {
    try {
      const { data: activity, error } = await supabase
        .from('activities')
        .update({
          is_featured: false,
          featured_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return activity;
    } catch (error) {
      console.error('Error unfeaturing activity:', error);
      return null;
    }
  }

  /**
   * Change activity status
   */
  async changeStatus(id: string, status: string): Promise<Activity | null> {
    try {
      const { data: activity, error } = await supabase
        .from('activities')
        .update({
          status: status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return activity;
    } catch (error) {
      console.error('Error changing activity status:', error);
      return null;
    }
  }

  /**
   * Join an activity (employee)
   */
  async joinActivity(activityId: string, profileId: string): Promise<ActivityParticipation | null> {
    try {
      const { data, error } = await supabase
        .from('activity_participations')
        .insert({
          activity_id: activityId,
          profile_id: profileId,
          status: 'joined',
          joined_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error joining activity:', error);
      return null;
    }
  }

  /**
   * Leave an activity (employee)
   */
  async leaveActivity(activityId: string, profileId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('activity_participations')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('activity_id', activityId)
        .eq('profile_id', profileId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error leaving activity:', error);
      return false;
    }
  }

  /**
   * Get activity participants
   */
  async getParticipants(activityId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('activity_participations')
        .select(`
          *,
          profile:profile_id(id, email, first_name, last_name, avatar_url)
        `)
        .eq('activity_id', activityId)
        .eq('status', 'joined');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching participants:', error);
      return [];
    }
  }

  /**
   * Get activities for a user (employee view)
   */
  async getUserActivities(profileId: string): Promise<Activity[]> {
    try {
      const { data, error } = await supabase
        .from('activity_participations')
        .select(`
          activity:activity_id(
            *,
            organization:organization_id(name),
            category:category_id(name),
            type:type_id(name),
            interest:interest_id(id, name, icon, color),
            sub_interest:sub_interest_id(id, name, slug)
          )
        `)
        .eq('profile_id', profileId)
        .eq('status', 'joined');

      if (error) throw error;
      return data?.map((item: any) => item.activity) || [];
    } catch (error) {
      console.error('Error fetching user activities:', error);
      return [];
    }
  }
}

// Export a singleton instance
export const activityService = new ActivityService();