import { supabase } from '@/lib/supabase';
import type { Profile, UpdateProfileData, Department, Team } from '../types/profile.types';

export const profileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data as Profile;
  },

  async updateProfile(userId: string, data: UpdateProfileData): Promise<Profile | null> {
    console.log('Updating profile for user:', userId);
    console.log('Update data:', data);

    // Create a properly typed object
    const cleanData: {
      first_name?: string;
      last_name?: string;
      phone?: string | null;
      job_title?: string | null;
      department_id?: string | null;
      team_id?: string | null;
      location_id?: string | null;
      timezone?: string;
      privacy_settings?: any;
      updated_at: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    // Add only defined values
    if (data.first_name !== undefined) cleanData.first_name = data.first_name;
    if (data.last_name !== undefined) cleanData.last_name = data.last_name;
    if (data.phone !== undefined) cleanData.phone = data.phone;
    if (data.job_title !== undefined) cleanData.job_title = data.job_title;
    if (data.department_id !== undefined) cleanData.department_id = data.department_id;
    if (data.team_id !== undefined) cleanData.team_id = data.team_id;
    if (data.location_id !== undefined) cleanData.location_id = data.location_id;
    if (data.timezone !== undefined) cleanData.timezone = data.timezone;
    if (data.privacy_settings !== undefined) cleanData.privacy_settings = data.privacy_settings;

    console.log('Clean data:', cleanData);

    const { data: updated, error } = await supabase
      .from('profiles')
      .update(cleanData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return null;
    }

    console.log('Updated profile:', updated);
    return updated as Profile;
  },

  async uploadAvatar(userId: string, file: File): Promise<string | null> {
    // Create the bucket if it doesn't exist
    try {
      const { error: bucketError } = await supabase.storage.createBucket('avatars', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      });
      if (bucketError && bucketError.message !== 'Bucket already exists') {
        console.error('Error creating bucket:', bucketError);
      }
    } catch (e) {
      // Bucket might already exist
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Update profile with avatar URL
    await supabase
      .from('profiles')
      .update({ avatar_url: data.publicUrl })
      .eq('id', userId);

    return data.publicUrl;
  },

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

  async getTeams(organizationId: string, departmentId?: string): Promise<Team[]> {
    let query = supabase
      .from('teams')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name');

    if (departmentId) {
      query = query.eq('department_id', departmentId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching teams:', error);
      return [];
    }

    return data as Team[];
  },
};