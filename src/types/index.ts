// Base types used across the application
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface Organization extends BaseEntity {
  name: string;
  slug: string;
  logo_url?: string;
  website?: string;
  industry?: string;
  size?: number;
  timezone: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface Profile extends BaseEntity {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  phone?: string;
  job_title?: string;
  department_id?: string;
  team_id?: string;
  location_id?: string;
  timezone: string;
  privacy_settings: Record<string, any>; // Changed from Json to Record
}

export interface OrganizationMember extends BaseEntity {
  organization_id: string;
  profile_id: string;
  roles: string[];
  department_id?: string;
  team_id?: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface Role extends BaseEntity {
  name: string;
  description?: string;
  permissions: string[];
}