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
}

export interface CreateOrganizationData {
  name: string;
  slug: string;
  website?: string;
  industry?: string;
  size?: number;
  timezone?: string;
}

export interface UpdateOrganizationData {
  name?: string;
  slug?: string;
  website?: string | null;
  industry?: string | null;
  size?: number | null;
  timezone?: string;
  status?: 'active' | 'inactive' | 'suspended';
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  profile_id: string;
  roles: string[];
  department_id?: string | null;
  team_id?: string | null;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}