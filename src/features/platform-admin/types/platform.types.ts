// src/features/platform-admin/types/platform.types.ts

export interface Company {
  id: string;
  name: string;
  slug: string;
  planTier?: 'Enterprise' | 'Growth' | 'Starter';
  status?: 'Active' | 'Trial' | 'Suspended';
  registeredEmployees?: number;
  monthlyPointsBudget?: number;
  joinedDate?: string;
  adminEmail?: string;
  logo_url?: string;
  industry?: string;
  size?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PlatformStats {
  totalOrganizations: number;
  totalUsers: number;
  totalActivities: number;
  totalChallenges: number;
  totalRewards: number;
  totalPointsAwarded: number;
  activeUsers: number;
  activeTenants: number;
  monthlyPointsPool: number;
  pointValuationUSD: number;
}

// Moderation Types
export interface ModerationState {
  flaggedActivityIds: Record<string, string>;
  featuredActivityIds: string[];
  flaggedSocialEventIds: Record<string, string>;
  featuredSocialEventIds: string[];
  hiddenSocialEventIds: string[];
  deletedSocialEventIds: string[];
  flaggedPlaceIds: Record<string, string>;
  featuredPlaceIds: string[];
  hiddenPlaceIds: string[];
  deletedPlaceIds: string[];
}

// Reward Types
export interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  category: 'Voucher' | 'Experience' | 'Company Swag' | 'Perk';
  stock: number;
  icon: string;
  photo: string;
  provider: string;
  deliveryMethod: 'instant_digital' | 'manual_fulfillment';
  organization_id: string;
  externalProductId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RewardsIntegrationConfig {
  activeProvider: 'Digital Vouchers' | 'Brand Catalog' | 'Corporate Gateway' | 'Custom Internal';
  apiKey: string;
  environment: 'production' | 'sandbox';
  webhookUrl: string;
  autoFulfillDigitalCards: boolean;
  prepaidAccountBalance: number;
  connectedAt: string;
}

export interface CompanyFormData {
  name: string;
  email: string;
  tier: 'Enterprise' | 'Growth' | 'Starter';
  budget: number;
}