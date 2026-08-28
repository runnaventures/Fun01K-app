import { lazy } from 'react';

// Lazy load pages for better performance
export const routeConfig = {
  // Public
  login: lazy(() => import('@/features/auth/pages/LoginPage')),
  signup: lazy(() => import('@/features/auth/pages/SignupPage')),
  resetPassword: lazy(() => import('@/features/auth/pages/ResetPasswordPage')),

  // Employee
  dashboard: lazy(() => import('@/features/employee/pages/DashboardPage')),
  discover: lazy(() => import('@/features/activities/pages/DiscoverPage')),
  activities: lazy(() => import('@/features/activities/pages/ActivitiesPage')),
  activityDetail: lazy(() => import('@/features/activities/pages/ActivityDetailPage')),
  challenges: lazy(() => import('@/features/challenges/pages/ChallengesPage')),
  feed: lazy(() => import('@/features/feed/pages/FeedPage')),
  rewards: lazy(() => import('@/features/rewards/pages/RewardsPage')),
  wallet: lazy(() => import('@/features/points/pages/WalletPage')),
  leaderboard: lazy(() => import('@/features/leaderboards/pages/LeaderboardPage')),
  activityHistory: lazy(() => import('@/features/activities/pages/ActivityHistoryPage')),
  profile: lazy(() => import('@/features/profiles/pages/ProfilePage')),
  notifications: lazy(() => import('@/features/notifications/pages/NotificationsPage')),

  // Company Admin
  adminDashboard: lazy(() => import('@/features/company-admin/pages/DashboardPage')),
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