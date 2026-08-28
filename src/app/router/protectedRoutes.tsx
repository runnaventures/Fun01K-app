import { Navigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { useOrganization } from '../providers/OrganizationProvider';
import { ReactNode, useMemo } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
}

// List of super admin user IDs who have access to everything
const SUPER_ADMINS = [
  '8f914d26-6dce-4b51-8b22-a1d792b07c5d', // Your user ID
  // Add more user IDs here as needed
];

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { organizationMember, isLoading: orgLoading } = useOrganization();

  // Check if user is a super admin
  const isSuperAdmin = useMemo(() => {
    return user?.id ? SUPER_ADMINS.includes(user.id) : false;
  }, [user]);

  // Memoize the role check
  const { hasAccess, userRoles } = useMemo(() => {
    // Super admins have access to everything
    if (isSuperAdmin) {
      return { hasAccess: true, userRoles: ['super_admin'] };
    }
    
    const roles = organizationMember?.roles || [];
    const access = !requiredRoles || requiredRoles.length === 0 || 
      requiredRoles.some((role) => roles.includes(role));
    return { hasAccess: access, userRoles: roles };
  }, [organizationMember, requiredRoles, isSuperAdmin]);

  // Debug logging
  console.log('ProtectedRoute:', {
    userId: user?.id,
    isSuperAdmin,
    hasAccess,
    requiredRoles,
    userRoles,
  });

  // Wait for both auth and organization to load
  if (authLoading || orgLoading) {
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
    return <Navigate to="/login" replace />;
  }

  if (!hasAccess) {
    console.log('Access denied - redirecting to /app');
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}