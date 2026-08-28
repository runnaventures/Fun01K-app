export interface ActivityCategory {
  id: string;
  organization_id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  sort_order?: number;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActivityType {
  id: string;
  organization_id: string;
  category_id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  sort_order?: number;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  organization_id: string;
  title: string;
  description: string;
  image_url?: string | null;
  category_id?: string | null;
  type_id?: string | null;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  duration: number;
  start_at?: string | null;
  end_at?: string | null;
  status: 'draft' | 'published' | 'active' | 'paused' | 'completed' | 'archived';
  visibility: 'public' | 'private' | 'invite_only';
  verification_method: 'gps' | 'qr' | 'host_approval' | 'manual';
  requires_location: boolean;
  requires_evidence: boolean;
  requires_host_approval: boolean;
  completion_limit?: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateActivityData {
  organization_id: string;
  title: string;
  description: string;
  image_url?: string;
  category_id?: string;
  type_id?: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  duration: number;
  start_at?: string;
  end_at?: string;
  status?: 'draft' | 'published' | 'active' | 'paused' | 'completed' | 'archived';
  visibility?: 'public' | 'private' | 'invite_only';
  verification_method: 'gps' | 'qr' | 'host_approval' | 'manual';
  requires_location?: boolean;
  requires_evidence?: boolean;
  requires_host_approval?: boolean;
  completion_limit?: number;
  created_by: string;
}

export interface UpdateActivityData {
  title?: string;
  description?: string;
  image_url?: string | null;
  category_id?: string | null;
  type_id?: string | null;
  points?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  duration?: number;
  start_at?: string | null;
  end_at?: string | null;
  status?: 'draft' | 'published' | 'active' | 'paused' | 'completed' | 'archived';
  visibility?: 'public' | 'private' | 'invite_only';
  verification_method?: 'gps' | 'qr' | 'host_approval' | 'manual';
  requires_location?: boolean;
  requires_evidence?: boolean;
  requires_host_approval?: boolean;
  completion_limit?: number | null;
}

// Make sure ActivityParticipation is exported
export interface ActivityParticipation {
  id: string;
  activity_id: string;
  profile_id: string;
  status: 'joined' | 'in_progress' | 'submitted' | 'pending_verification' | 'verified' | 'flagged' | 'rejected' | 'cancelled';
  points_earned?: number | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}