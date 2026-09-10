// src/app/router/AppRouter.tsx

import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useAuth } from '../providers/AuthProvider';
import PublicLayout from '../layouts/PublicLayout';
import EmployeeLayout from '../layouts/EmployeeLayout';
import CompanyAdminLayout from '../layouts/CompanyAdminLayout';
import PlatformAdminLayout from '../layouts/PlatformAdminLayout';
import { ProtectedRoute } from './protectedRoutes';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';

// ✅ Import platform components directly (not lazy-loaded)
import { ActivitiesManager } from '@/features/platform-admin/components/ActivitiesManager/ActivitiesManager';
import { RewardsManager } from '@/features/platform-admin/components/RewardsManager/RewardsManager';
import { PlatformSettings } from '@/features/platform-admin/components/PlatformSettings/PlatformSettings';

// Marketing Pages
const HomePage = lazy(() => import('@/features/public/pages/HomePage'));
const AboutPage = lazy(() => import('@/features/public/pages/AboutPage'));
const ContactPage = lazy(() => import('@/features/public/pages/ContactPage'));
const PricingPage = lazy(() => import('@/features/public/pages/PricingPage'));
const ImageUploadPage = lazy(() => import('@/features/public/pages/ImageUploadPage'));

// Public Auth pages
const LoginPage = lazy(() => import('@/features/public/pages/LoginPage'));
const SignupPage = lazy(() => import('@/features/public/pages/SignupPage'));
const AuthCallbackPage = lazy(() => import('@/features/public/pages/AuthCallbackPage'));
const ResetPasswordPage = lazy(() => import('@/features/public/pages/ResetPasswordPage'));

// Platform Login (Hidden - Not linked anywhere)
const PlatformLoginPage = lazy(() => import('@/features/platform-admin/pages/PlatformLoginPage'));

// ✅ Employee pages (FIXED PATHS)
const DashboardPage = lazy(() => import('@/features/employee/pages/DashboardPage'));
const DiscoverPage = lazy(() => import('@/features/employee/pages/DiscoverPage'));
const ActivitiesPage = lazy(() => import('@/features/employee/pages/ActivitiesPage'));
const ActivityDetailPage = lazy(() => import('@/features/employee/pages/ActivityDetailPage'));
const ActivityHistoryPage = lazy(() => import('@/features/employee/pages/ActivityHistoryPage'));
const ChallengesPage = lazy(() => import('@/features/shared/challenges/pages/ChallengesPage'));
const FeedPage = lazy(() => import('@/features/shared/feed/pages/FeedPage'));
const RewardsPage = lazy(() => import('@/features/company-admin/pages/RewardsPage'));
const WalletPage = lazy(() => import('@/features/employee/pages/WalletPage'));
const LeaderboardPage = lazy(() => import('@/features/employee/pages/LeaderboardPage'));
const ProfilePage = lazy(() => import('@/features/employee/pages/ProfilePage'));
const NotificationsPage = lazy(() => import('@/features/shared/notifications/pages/NotificationsPage'));

// Company Admin pages
const AdminDashboardPage = lazy(() => import('@/features/company-admin/pages/DashboardPage'));
const AdminEmployeesPage = lazy(() => import('@/features/company-admin/employees/pages/EmployeesPage'));
const AdminTeamsPage = lazy(() => import('@/features/company-admin/teams/pages/TeamsPage'));
const AdminDepartmentsPage = lazy(() => import('@/features/company-admin/departments/pages/DepartmentsPage'));
const CategoryTypesPage = lazy(() => import('@/features/company-admin/activities/pages/CategoryTypesPage'));
const AdminActivitiesPage = lazy(() => import('@/features/company-admin/activities/pages/ActivitiesPage'));
const AdminChallengesPage = lazy(() => import('@/features/company-admin/challenges/pages/ChallengesPage'));
const AdminRewardsPage = lazy(() => import('@/features/company-admin/rewards/pages/RewardsPage'));
const AdminLocationsPage = lazy(() => import('@/features/company-admin/locations/pages/LocationsPage'));
const AdminAnalyticsPage = lazy(() => import('@/features/company-admin/analytics/pages/AnalyticsPage'));
const AdminReportsPage = lazy(() => import('@/features/company-admin/reports/pages/ReportsPage'));
const AdminPermissionsPage = lazy(() => import('@/features/company-admin/permissions/pages/PermissionsPage'));
const AdminAuditPage = lazy(() => import('@/features/company-admin/audit/pages/AuditPage'));
// ✅ Company Profile - imported for the profile route
const CompanyProfilePage = lazy(() => import('@/features/company-admin/pages/CompanyProfilePage'));
// ✅ Settings - using existing settings page from settings folder
const AdminSettingsPage = lazy(() => import('@/features/company-admin/settings/pages/SettingsPage'));

// Platform Admin pages (lazy-loaded)
const PlatformDashboardPage = lazy(() => import('@/features/platform-admin/pages/DashboardPage'));
const PlatformOrganizationsPage = lazy(() => import('@/features/platform-admin/organizations/pages/OrganizationsPage'));
const PlatformUsersPage = lazy(() => import('@/features/platform-admin/users/pages/UsersPage'));
const PlatformAnalyticsPage = lazy(() => import('@/features/platform-admin/analytics/pages/AnalyticsPage'));
const PlatformModerationPage = lazy(() => import('@/features/platform-admin/moderation/pages/ModerationPage'));
const PlatformFraudPage = lazy(() => import('@/features/platform-admin/fraud/pages/FraudPage'));
// ✅ Integrations - Only available to Platform Admin
const PlatformIntegrationsPage = lazy(() => import('@/features/platform-admin/integrations/pages/IntegrationsPage'));
const PlatformAuditPage = lazy(() => import('@/features/platform-admin/audit/pages/AuditPage'));

// Wrapper component for lazy-loaded pages
function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingScreen />}>{children}</Suspense>;
}

export default function AppRouter() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Marketing Pages */}
      <Route path="/" element={<LazyPage><HomePage /></LazyPage>} />
      <Route path="/about" element={<LazyPage><AboutPage /></LazyPage>} />
      <Route path="/contact" element={<LazyPage><ContactPage /></LazyPage>} />
      <Route path="/pricing" element={<LazyPage><PricingPage /></LazyPage>} />
      <Route path="/admin/upload-image" element={<LazyPage><ImageUploadPage /></LazyPage>} />

      {/* Public Auth Routes */}
      <Route element={<PublicLayout />}>
        <Route
          path="/login"
          element={
            <LazyPage>
              <LoginPage />
            </LazyPage>
          }
        />
        <Route
          path="/signup"
          element={
            <LazyPage>
              <SignupPage />
            </LazyPage>
          }
        />
        <Route
          path="/auth/callback"
          element={
            <LazyPage>
              <AuthCallbackPage />
            </LazyPage>
          }
        />
        <Route
          path="/auth/reset-password"
          element={
            <LazyPage>
              <ResetPasswordPage />
            </LazyPage>
          }
        />
      </Route>

      {/* ⚠️ HIDDEN PLATFORM LOGIN - NOT LINKED ANYWHERE ⚠️ */}
      <Route
        path="/platform-login"
        element={
          <LazyPage>
            <PlatformLoginPage />
          </LazyPage>
        }
      />

      {/* Protected Employee Routes */}
      <Route
        element={
          <ProtectedRoute>
            <EmployeeLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/app"
          element={
            <LazyPage>
              <DashboardPage />
            </LazyPage>
          }
        />
        <Route
          path="/app/discover"
          element={
            <LazyPage>
              <DiscoverPage />
            </LazyPage>
          }
        />
        <Route
          path="/app/activities"
          element={
            <LazyPage>
              <ActivitiesPage />
            </LazyPage>
          }
        />
        <Route
          path="/app/activities/:id"
          element={
            <LazyPage>
              <ActivityDetailPage />
            </LazyPage>
          }
        />
        <Route
          path="/app/challenges"
          element={
            <LazyPage>
              <ChallengesPage />
            </LazyPage>
          }
        />
        <Route
          path="/app/feed"
          element={
            <LazyPage>
              <FeedPage />
            </LazyPage>
          }
        />
        <Route
          path="/app/rewards"
          element={
            <LazyPage>
              <RewardsPage />
            </LazyPage>
          }
        />
        <Route
          path="/app/wallet"
          element={
            <LazyPage>
              <WalletPage />
            </LazyPage>
          }
        />
        <Route
          path="/app/leaderboard"
          element={
            <LazyPage>
              <LeaderboardPage />
            </LazyPage>
          }
        />
        <Route
          path="/app/activity-history"
          element={
            <LazyPage>
              <ActivityHistoryPage />
            </LazyPage>
          }
        />
        <Route
          path="/app/profile"
          element={
            <LazyPage>
              <ProfilePage />
            </LazyPage>
          }
        />
        <Route
          path="/app/notifications"
          element={
            <LazyPage>
              <NotificationsPage />
            </LazyPage>
          }
        />
      </Route>

      {/* Company Admin Routes */}
      <Route
        element={
          <ProtectedRoute requiredRoles={['company_admin', 'company_owner', 'manager', 'activity_host']}>
            <CompanyAdminLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/admin"
          element={
            <LazyPage>
              <AdminDashboardPage />
            </LazyPage>
          }
        />
        <Route
          path="/admin/employees"
          element={
            <LazyPage>
              <AdminEmployeesPage />
            </LazyPage>
          }
        />
        <Route
          path="/admin/teams"
          element={
            <LazyPage>
              <AdminTeamsPage />
            </LazyPage>
          }
        />
        <Route
          path="/admin/departments"
          element={
            <LazyPage>
              <AdminDepartmentsPage />
            </LazyPage>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <LazyPage>
              <CategoryTypesPage />
            </LazyPage>
          }
        />
        <Route
          path="/admin/activities"
          element={
            <LazyPage>
              <AdminActivitiesPage />
            </LazyPage>
          }
        />
        <Route
          path="/admin/challenges"
          element={
            <LazyPage>
              <AdminChallengesPage />
            </LazyPage>
          }
        />
        <Route
          path="/admin/rewards"
          element={
            <LazyPage>
              <AdminRewardsPage />
            </LazyPage>
          }
        />
        <Route
          path="/admin/locations"
          element={
            <LazyPage>
              <AdminLocationsPage />
            </LazyPage>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <LazyPage>
              <AdminAnalyticsPage />
            </LazyPage>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <LazyPage>
              <AdminReportsPage />
            </LazyPage>
          }
        />
        {/* ✅ Company Profile - accessible from header */}
        <Route
          path="/admin/profile"
          element={
            <LazyPage>
              <CompanyProfilePage />
            </LazyPage>
          }
        />
        {/* ✅ Settings - using existing settings page */}
        <Route
          path="/admin/settings"
          element={
            <LazyPage>
              <AdminSettingsPage />
            </LazyPage>
          }
        />
        <Route
          path="/admin/permissions"
          element={
            <LazyPage>
              <AdminPermissionsPage />
            </LazyPage>
          }
        />
        <Route
          path="/admin/audit"
          element={
            <LazyPage>
              <AdminAuditPage />
            </LazyPage>
          }
        />
      </Route>

      {/* ✅ Platform Admin Routes - Includes Integrations */}
      <Route
        element={
          <ProtectedRoute requiredRoles={['platform_owner', 'platform_admin']}>
            <PlatformAdminLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/platform"
          element={
            <LazyPage>
              <PlatformDashboardPage />
            </LazyPage>
          }
        />
        <Route
          path="/platform/organizations"
          element={
            <LazyPage>
              <PlatformOrganizationsPage />
            </LazyPage>
          }
        />
        <Route
          path="/platform/users"
          element={
            <LazyPage>
              <PlatformUsersPage />
            </LazyPage>
          }
        />

        {/* ✅ Activities - Using ActivitiesManager (full implementation) */}
        <Route
          path="/platform/activities"
          element={<ActivitiesManager />}
        />

        {/* ✅ Rewards - Using RewardsManager (full implementation) */}
        <Route
          path="/platform/rewards"
          element={<RewardsManager />}
        />

        <Route
          path="/platform/analytics"
          element={
            <LazyPage>
              <PlatformAnalyticsPage />
            </LazyPage>
          }
        />
        <Route
          path="/platform/moderation"
          element={
            <LazyPage>
              <PlatformModerationPage />
            </LazyPage>
          }
        />
        <Route
          path="/platform/fraud"
          element={
            <LazyPage>
              <PlatformFraudPage />
            </LazyPage>
          }
        />

        {/* ✅ Integrations - Only available to Platform Admin */}
        <Route
          path="/platform/integrations"
          element={
            <LazyPage>
              <PlatformIntegrationsPage />
            </LazyPage>
          }
        />

        {/* ✅ Settings - Using PlatformSettings (full implementation) */}
        <Route
          path="/platform/settings"
          element={<PlatformSettings />}
        />

        <Route
          path="/platform/audit"
          element={
            <LazyPage>
              <PlatformAuditPage />
            </LazyPage>
          }
        />
      </Route>

      {/* 404 */}
      <Route
        path="*"
        element={
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold">404</h1>
              <p className="mt-2 text-muted-foreground">Page not found</p>
            </div>
          </div>
        }
      />
    </Routes>
  );
}