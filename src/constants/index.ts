// Application constants
export const APP_NAME = 'Fun01K';
export const APP_VERSION = '0.1.0';

export const ACTIVITY_STATUSES = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
} as const;

export const PARTICIPATION_STATUSES = {
  JOINED: 'joined',
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  PENDING_VERIFICATION: 'pending_verification',
  VERIFIED: 'verified',
  FLAGGED: 'flagged',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const;

export const VERIFICATION_METHODS = {
  GPS: 'gps',
  QR: 'qr',
  HOST_APPROVAL: 'host_approval',
  MANUAL: 'manual',
} as const;

export const CHALLENGE_TYPES = {
  INDIVIDUAL: 'individual',
  TEAM: 'team',
  DEPARTMENT: 'department',
  COMPANY: 'company',
  INVITE_ONLY: 'invite_only',
} as const;

export const REWARD_TYPES = {
  GIFT_CARD: 'gift_card',
  MERCHANDISE: 'merchandise',
  EXPERIENCE: 'experience',
  TRAINING: 'training',
  PTO: 'pto',
  COMPANY_BENEFIT: 'company_benefit',
  CHARITABLE: 'charitable',
} as const;

export const ROLES = {
  PLATFORM_OWNER: 'platform_owner',
  PLATFORM_ADMIN: 'platform_admin',
  SUPPORT_ADMIN: 'support_admin',
  COMPANY_OWNER: 'company_owner',
  COMPANY_ADMIN: 'company_admin',
  MANAGER: 'manager',
  ACTIVITY_HOST: 'activity_host',
  EMPLOYEE: 'employee',
} as const;

export const PERMISSIONS = {
  // Employee
  EMPLOYEES_READ: 'employees.read',
  EMPLOYEES_MANAGE: 'employees.manage',
  
  // Activities
  ACTIVITIES_READ: 'activities.read',
  ACTIVITIES_CREATE: 'activities.create',
  ACTIVITIES_MANAGE: 'activities.manage',
  ACTIVITIES_VERIFY: 'activities.verify',
  
  // Challenges
  CHALLENGES_CREATE: 'challenges.create',
  CHALLENGES_MANAGE: 'challenges.manage',
  
  // Rewards
  REWARDS_READ: 'rewards.read',
  REWARDS_MANAGE: 'rewards.manage',
  
  // Analytics
  ANALYTICS_READ: 'analytics.read',
  
  // Audit
  AUDIT_READ: 'audit.read',
} as const;