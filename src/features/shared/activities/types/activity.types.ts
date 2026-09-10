// src/features/activities/types/activity.types.ts

export interface Activity {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  type_id: string | null;
  points: number;
  duration: number | null;
  status: 'draft' | 'published' | 'active' | 'paused' | 'completed' | 'archived';
  visibility: 'public' | 'private' | 'team_only';
  verification_method?: string;
  start_at: string | null;
  end_at: string | null;
  organization_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  image_url?: string | null;
  is_featured?: boolean;
  featured_at?: string | null;
  source?: 'manual' | 'meetup' | 'google_places' | 'employee_suggestion';
  source_id?: string;
  external_url?: string;
  interest_tags?: string[];
  location_lat?: number | null;
  location_lng?: number | null;
  distance_miles?: number | null;
  attendees_count?: number;
  location?: string | null;
  location_address?: string | null;
  place_id?: string | null;
  organization?: { id: string; name: string; city?: string } | null;
  category?: { id: string; name: string; icon?: string; color?: string } | null;
  type?: { id: string; name: string } | null;
  is_global?: boolean;
  is_featured_by_company?: boolean;
  difficulty?: string;
}

export interface ActivityCategory {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  organization_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ActivityType {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  category_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateActivityData {
  title: string;
  description?: string | null;
  category_id?: string | null;
  type_id?: string | null;
  organization_id?: string | null;
  points: number;
  difficulty?: 'easy' | 'medium' | 'hard' | string;
  duration?: number | null;
  start_at?: string | null;
  end_at?: string | null;
  visibility?: 'public' | 'private' | 'team_only';
  verification_method?: 'manual' | 'gps' | 'qr' | 'host_approval';
  requires_location?: boolean;
  requires_evidence?: boolean;
  requires_host_approval?: boolean;
  completion_limit?: number | null;
  status?: 'draft' | 'published' | 'active' | 'paused' | 'completed' | 'archived';
  created_by?: string | null;
  image_url?: string | null;
  is_featured?: boolean;
  source?: 'manual' | 'meetup' | 'google_places' | 'employee_suggestion';
  source_id?: string;
  external_url?: string;
  interest_tags?: string[];
  location_lat?: number | null;
  location_lng?: number | null;
  distance_miles?: number | null;
  // Location fields
  location?: string | null;
  location_address?: string | null;
  place_id?: string | null;
}

export interface UpdateActivityData {
  title?: string;
  description?: string | null;
  category_id?: string | null;
  type_id?: string | null;
  points?: number;
  difficulty?: 'easy' | 'medium' | 'hard' | string;
  duration?: number | null;
  start_at?: string | null;
  end_at?: string | null;
  visibility?: 'public' | 'private' | 'team_only';
  verification_method?: 'manual' | 'gps' | 'qr' | 'host_approval';
  requires_location?: boolean;
  requires_evidence?: boolean;
  requires_host_approval?: boolean;
  completion_limit?: number | null;
  status?: 'draft' | 'published' | 'active' | 'paused' | 'completed' | 'archived';
  image_url?: string | null;
  is_featured?: boolean;
  // Location fields
  location?: string | null;
  location_address?: string | null;
  place_id?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
}

export interface ActivityParticipation {
  id: string;
  activity_id: string;
  profile_id: string;
  status: 'joined' | 'in_progress' | 'submitted' | 'pending_verification' | 'verified' | 'flagged' | 'rejected' | 'cancelled';
  joined_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string | null;
  };
  activity?: Activity;
}

export interface ActivityFilters {
  search?: string;
  category_id?: string | null;
  type_id?: string | null;
  status?: string | string[];
  visibility?: string | string[];
  organization_id?: string | null;
  is_featured?: boolean;
  source?: string | string[];
  start_after?: string;
  end_before?: string;
  location?: string;
  city?: string;
  domain?: string;
}