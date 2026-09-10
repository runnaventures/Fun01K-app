export interface Challenge {
    id: string;
    organization_id: string;
    title: string;
    description: string;
    objective: string;
    type: 'individual' | 'team' | 'department' | 'company' | 'invite_only';
    points_reward: number;
    start_at: string;
    end_at: string;
    eligibility?: string;
    visibility: 'public' | 'private';
    status: 'draft' | 'published' | 'active' | 'completed' | 'cancelled';
    requirements: Record<string, any>;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface CreateChallengeData {
    organization_id: string;
    title: string;
    description: string;
    objective: string;
    type: 'individual' | 'team' | 'department' | 'company' | 'invite_only';
    points_reward: number;
    start_at: string;
    end_at: string;
    eligibility?: string;
    visibility?: 'public' | 'private';
    status?: 'draft' | 'published' | 'active' | 'completed' | 'cancelled';
    requirements?: Record<string, any>;
    created_by: string;
}

export interface UpdateChallengeData {
    title?: string;
    description?: string;
    objective?: string;
    type?: 'individual' | 'team' | 'department' | 'company' | 'invite_only';
    points_reward?: number;
    start_at?: string;
    end_at?: string;
    eligibility?: string;
    visibility?: 'public' | 'private';
    status?: 'draft' | 'published' | 'active' | 'completed' | 'cancelled';
    requirements?: Record<string, any>;
}

export interface ChallengeMember {
    id: string;
    challenge_id: string;
    profile_id: string;
    team_id?: string;
    status: 'active' | 'completed' | 'cancelled';
    joined_at: string;
    completed_at?: string;
    created_at: string;
}

export interface ChallengeProgress {
    id: string;
    challenge_id: string;
    profile_id: string;
    activity_id?: string;
    progress_value: number;
    target_value: number;
    is_completed: boolean;
    completed_at?: string;
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
}