import { Json } from '@/types/supabase';

export interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string | null;
  phone?: string | null;
  job_title?: string | null;
  department_id?: string | null;
  team_id?: string | null;
  location_id?: string | null;
  timezone: string;
  privacy_settings: Json;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  phone?: string | null;
  job_title?: string | null;
  department_id?: string | null;
  team_id?: string | null;
  location_id?: string | null;
  timezone?: string;
  privacy_settings?: Json;
}

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

export interface Team {
  id: string;
  organization_id: string;
  department_id?: string | null;
  name: string;
  description?: string | null;
  team_lead_id?: string | null;
  created_at: string;
  updated_at: string;
}