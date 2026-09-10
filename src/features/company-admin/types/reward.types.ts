export type RewardSource = 'manual' | 'tremendous' | 'tangocard' | 'giftbit' | 'blackhawk';
export type RewardCategory = 'gift_card' | 'merchandise' | 'experience' | 'training' | 'pto' | 'company_benefit' | 'charitable';
export type RewardStatus = 'draft' | 'published' | 'active' | 'out_of_stock' | 'archived';

export interface Reward {
  id: string;
  organization_id: string;
  title: string;
  description: string;
  category: RewardCategory;
  points_required: number;
  image_url?: string | null;
  stock?: number | null;
  source: RewardSource;
  source_id?: string | null;
  metadata?: Record<string, any>;
  status: RewardStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRewardData {
  organization_id: string;
  title: string;
  description: string;
  category: RewardCategory;
  points_required: number;
  image_url?: string;
  stock?: number;
  source?: RewardSource;
  source_id?: string;
  metadata?: Record<string, any>;
  status?: RewardStatus;
  created_by: string;
}

export interface UpdateRewardData {
  title?: string;
  description?: string;
  category?: RewardCategory;
  points_required?: number;
  image_url?: string | null;
  stock?: number | null;
  source?: RewardSource;
  source_id?: string | null;
  metadata?: Record<string, any>;
  status?: RewardStatus;
}

export interface ExternalReward {
  id: string;
  title: string;
  description: string;
  source: RewardSource;
  sourceId: string;
  category: RewardCategory;
  points_required?: number;
  image_url?: string;
  retail_price?: number;
  currency?: string;
  metadata?: Record<string, any>;
}

export interface TremendousReward {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image_url?: string;
  metadata?: Record<string, any>;
}

export interface TangoCardReward {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  image_url?: string;
}