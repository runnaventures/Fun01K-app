// src/features/activities/hooks/useActivityPermissions.ts

import { useAuth } from '@/app/providers/AuthProvider';
import { useOrganization } from '@/app/providers/OrganizationProvider';

export function useActivityPermissions() {
  const { userRole } = useAuth();
  const { organizationMember } = useOrganization();

  const isEmployee = userRole === 'employee';
  const isAdmin = userRole === 'admin';
  const isPlatformOwner = userRole === 'platform_owner';

  const canAddActivity = () => {
    return isAdmin || isPlatformOwner || isEmployee;
  };

  const canFeatureActivity = () => {
    return isAdmin || isPlatformOwner;
  };

  const canFlagActivity = () => {
    return isEmployee || isAdmin || isPlatformOwner;
  };

  const canViewActivity = () => {
    return isEmployee || isAdmin || isPlatformOwner;
  };

  const canCreateActivity = () => {
    return isAdmin || isPlatformOwner;
  };

  const canViewAllActivities = () => {
    return isPlatformOwner;
  };

  const canViewOrgActivities = () => {
    return isAdmin || isPlatformOwner;
  };

  const canManageMeetupApi = () => {
    return isPlatformOwner;
  };

  const canManageGooglePlaces = () => {
    return isPlatformOwner;
  };

  return {
    isEmployee,
    isAdmin,
    isPlatformOwner,
    canAddActivity,
    canFeatureActivity,
    canFlagActivity,
    canViewActivity,
    canCreateActivity,
    canViewAllActivities,
    canViewOrgActivities,
    canManageMeetupApi,
    canManageGooglePlaces,
  };
}