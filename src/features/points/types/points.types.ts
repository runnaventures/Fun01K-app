export interface PointsAccount {
  id: string;
  profile_id: string;
  balance: number;
  pending: number;
  lifetime_earned: number;
  lifetime_redeemed: number;
  created_at: string;
  updated_at: string;
}

export interface PointsTransaction {
  id: string;
  profile_id: string;
  amount: number;
  type: 'earned' | 'redeemed' | 'adjusted' | 'reversed';
  source: 'activity' | 'challenge' | 'reward' | 'admin' | 'system';
  source_id?: string;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface AwardPointsData {
  profileId: string;
  amount: number;
  source: 'activity' | 'challenge' | 'reward' | 'admin' | 'system';
  sourceId?: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface RedeemPointsData {
  profileId: string;
  amount: number;
  rewardId: string;
  description: string;
}