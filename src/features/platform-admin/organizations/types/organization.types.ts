export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  website?: string | null;
  industry?: string | null;
  size?: number | null;
  timezone: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
  company_code?: string | null;
  subscription_plan?: 'starter' | 'growth' | 'enterprise' | null;
  monthly_points_allowance?: number | null;
  contact_email?: string | null;
  /** Computed at fetch time by the service */
  members_count?: number;
}

export interface CreateOrganizationData {
  name: string;
  slug: string;
  website?: string;
  industry?: string;
  size?: number;
  timezone?: string;
  subscription_plan?: 'starter' | 'growth' | 'enterprise';
  monthly_points_allowance?: number;
  contact_email?: string;
}

export interface UpdateOrganizationData {
  name?: string;
  industry?: string | null;
  size?: number | null;
  website?: string | null;
  timezone?: string;
  status?: 'active' | 'inactive' | 'suspended';
  subscription_plan?: 'starter' | 'growth' | 'enterprise';
  monthly_points_allowance?: number;
  contact_email?: string | null;
}// src/features/platform-admin/organizations/types/organization.types.ts

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  website?: string | null;
  industry?: string | null;
  size?: number | null;
  timezone: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
  company_code?: string | null;
  subscription_plan?: 'starter' | 'growth' | 'enterprise' | null;
  monthly_points_allowance?: number | null;
  contact_email?: string | null;
  /** Computed at fetch time by the service */
  members_count?: number;
}

export interface CreateOrganizationData {
  name: string;
  slug: string;
  website?: string;
  industry?: string;
  size?: number;
  timezone?: string;
  subscription_plan?: 'starter' | 'growth' | 'enterprise';
  monthly_points_allowance?: number;
  contact_email?: string;
}

export interface UpdateOrganizationData {
  name?: string;
  industry?: string | null;
  size?: number | null;
  website?: string | null;
  timezone?: string;
  status?: 'active' | 'inactive' | 'suspended';
  subscription_plan?: 'starter' | 'growth' | 'enterprise';
  monthly_points_allowance?: number;
  contact_email?: string | null;
}

/**
 * Organization member record as returned by:
 *   supabase.from('organization_members')
 *     .select('*, profiles(first_name, last_name, email, avatar_url)')
 */
export interface OrganizationMember {
  id: string;
  organization_id: string;
  profile_id: string;
  roles: string[];
  status: 'active' | 'invited' | 'pending' | 'inactive';
  created_at: string;
  updated_at?: string;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}