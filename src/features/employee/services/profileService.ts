// src/features/employee/services/profileService.ts

import { supabase } from '@/lib/supabase';

export interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  job_title: string | null;
  department_id: string | null;
  team_id: string | null;
  location_id: string | null;
  timezone: string | null;
  privacy_settings: any;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileData {
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  job_title?: string | null;
  department_id?: string | null;
  team_id?: string | null;
  location_id?: string | null;
  timezone?: string | null;
  privacy_settings?: any;
}

export const profileService = {
  async getProfile(userId: string): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data as Profile;
  },

  async updateProfile(userId: string, data: UpdateProfileData): Promise<Profile> {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (data.first_name !== undefined) updateData.first_name = data.first_name;
    if (data.last_name !== undefined) updateData.last_name = data.last_name;
    if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.job_title !== undefined) updateData.job_title = data.job_title;
    if (data.department_id !== undefined) updateData.department_id = data.department_id;
    if (data.team_id !== undefined) updateData.team_id = data.team_id;
    if (data.location_id !== undefined) updateData.location_id = data.location_id;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.privacy_settings !== undefined) updateData.privacy_settings = data.privacy_settings;

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return profile as Profile;
  },

  async uploadAvatar(userId: string, file: File): Promise<Profile> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('profiles')
      .getPublicUrl(filePath);
    const avatarUrl = urlData.publicUrl;

    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    if (updateError) throw updateError;
    return profile as Profile;
  },

  async getDepartments(organizationId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async getTeams(organizationId: string, departmentId?: string): Promise<any[]> {
    let query = supabase
      .from('teams')
      .select('*')
      .eq('organization_id', organizationId);

    if (departmentId) {
      query = query.eq('department_id', departmentId);
    }

    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
};