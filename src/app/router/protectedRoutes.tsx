// src/app/router/protectedRoutes.tsx

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { useOrganization } from '../providers/OrganizationProvider';
import { ReactNode, useMemo } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
}

// List of super admin user IDs
const SUPER_ADMINS = [
  '8f914d26-6dce-4b51-8b22-a1d792b07c5d',
  'f49d186f-059e-4087-beb3-c3363ec28853',
];

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { user, isLoading: authLoading, userRole } = useAuth();
  const { organizationMember, isLoading: orgLoading } = useOrganization();
  const location = useLocation();

  // Check if user is a super admin
  const isSuperAdmin = useMemo(() => {
    return user?.id ? SUPER_ADMINS.includes(user.id) : false;
  }, [user?.id]);

  // Memoize the role check - prevent recalculations
  const { hasAccess, userRoles } = useMemo(() => {
    // Super admins have access to everything
    if (isSuperAdmin) {
      return { hasAccess: true, userRoles: ['super_admin'] };
    }
    
    const roles = organizationMember?.roles || [];
    // If userRole is set, use it for faster role check
    const effectiveRole = userRole || 'employee';
    const access = !requiredRoles || requiredRoles.length === 0 || 
      requiredRoles.some((role) => roles.includes(role) || role === effectiveRole);
    return { hasAccess: access, userRoles: roles };
  }, [organizationMember, requiredRoles, isSuperAdmin, userRole]);

  // Show loading while checking auth - use a single combined loading state
  const isLoading = authLoading || orgLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasAccess) {
    console.log('Access denied - redirecting to /app');
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}