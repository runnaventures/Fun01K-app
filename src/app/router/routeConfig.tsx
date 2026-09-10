// src/app/router/routeConfig.tsx

import { lazy } from 'react';

// Lazy load pages for better performance
export const routeConfig = {
  // Public
  login: lazy(() => import('@/features/public/pages/LoginPage')),
  signup: lazy(() => import('@/features/public/pages/SignupPage')),
  resetPassword: lazy(() => import('@/features/public/pages/ResetPasswordPage')),

  // Employee (FIXED PATHS)
  dashboard: lazy(() => import('@/features/employee/pages/DashboardPage')),
  discover: lazy(() => import('@/features/employee/pages/DiscoverPage')),
  activities: lazy(() => import('@/features/employee/pages/ActivitiesPage')),
  activityDetail: lazy(() => import('@/features/employee/pages/ActivityDetailPage')),
  activityHistory: lazy(() => import('@/features/employee/pages/ActivityHistoryPage')),
  challenges: lazy(() => import('@/features/shared/challenges/pages/ChallengesPage')),
  feed: lazy(() => import('@/features/shared/feed/pages/FeedPage')),
  rewards: lazy(() => import('@/features/company-admin/pages/RewardsPage')),
  wallet: lazy(() => import('@/features/employee/pages/WalletPage')),
  leaderboard: lazy(() => import('@/features/employee/pages/LeaderboardPage')),
  profile: lazy(() => import('@/features/employee/pages/ProfilePage')),
  notifications: lazy(() => import('@/features/shared/notifications/pages/NotificationsPage')),

  // Company Admin
  admindashboard: lazy(() => import('@/features/employee/pages/DashboardPage')),
  adminEmployees: lazy(() => import('@/features/company-admin/employees/pages/EmployeesPage')),
  adminTeams: lazy(() => import('@/features/company-admin/teams/pages/TeamsPage')),
  adminDepartments: lazy(() => import('@/features/company-admin/departments/pages/DepartmentsPage')),
  adminActivities: lazy(() => import('@/features/company-admin/activities/pages/ActivitiesPage')),
  adminChallenges: lazy(() => import('@/features/company-admin/challenges/pages/ChallengesPage')),
  adminRewards: lazy(() => import('@/features/company-admin/rewards/pages/RewardsPage')),
  adminLocations: lazy(() => import('@/features/company-admin/locations/pages/LocationsPage')),
  adminAnalytics: lazy(() => import('@/features/company-admin/analytics/pages/AnalyticsPage')),
  adminReports: lazy(() => import('@/features/company-admin/reports/pages/ReportsPage')),
  adminSettings: lazy(() => import('@/features/company-admin/settings/pages/SettingsPage')),
  adminPermissions: lazy(() => import('@/features/company-admin/permissions/pages/PermissionsPage')),
  adminAudit: lazy(() => import('@/features/company-admin/audit/pages/AuditPage')),

  // Platform Admin
  platformDashboard: lazy(() => import('@/features/platform-admin/pages/DashboardPage')),
  platformOrganizations: lazy(() => import('@/features/platform-admin/organizations/pages/OrganizationsPage')),
  platformUsers: lazy(() => import('@/features/platform-admin/users/pages/UsersPage')),
  platformActivities: lazy(() => import('@/features/platform-admin/activities/pages/ActivitiesPage')),
  platformRewards: lazy(() => import('@/features/platform-admin/rewards/pages/RewardsPage')),
  platformAnalytics: lazy(() => import('@/features/platform-admin/analytics/pages/AnalyticsPage')),
  platformModeration: lazy(() => import('@/features/platform-admin/moderation/pages/ModerationPage')),
  platformFraud: lazy(() => import('@/features/platform-admin/fraud/pages/FraudPage')),
  platformSettings: lazy(() => import('@/features/platform-admin/settings/pages/SettingsPage')),
  platformAudit: lazy(() => import('@/features/platform-admin/audit/pages/AuditPage')),
};