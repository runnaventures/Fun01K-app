export interface Location {
  id: string;
  organization_id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  radius?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateLocationData {
  organization_id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  is_active?: boolean;
}

export interface UpdateLocationData {
  name?: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  radius?: number | null;
  is_active?: boolean;
}