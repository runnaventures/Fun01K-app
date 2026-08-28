import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useAuth } from './AuthProvider';
import { useOrganizationMember } from '@/features/profiles/queries/profileQueries';

interface OrganizationMember {
  id: string;
  organization_id: string;
  profile_id: string;
  roles: string[];
  department_id?: string;
  team_id?: string;
  status: string;
}

interface OrganizationContextType {
  organizationMember: OrganizationMember | null;
  isLoading: boolean;
  setOrganizationMember: (member: OrganizationMember | null) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

// List of super admin user IDs
const SUPER_ADMINS = [
  '8f914d26-6dce-4b51-8b22-a1d792b07c5d', // Your user ID
];

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const { data: organizationMember, isLoading: orgLoading, refetch } = useOrganizationMember(user?.id);

  // Check if user is a super admin
  const isSuperAdmin = user?.id ? SUPER_ADMINS.includes(user.id) : false;

  const value = useMemo(() => ({
    organizationMember: isSuperAdmin 
      ? { 
          id: 'super-admin',
          organization_id: 'super-admin',
          profile_id: user?.id || '',
          roles: ['super_admin', 'platform_owner', 'company_owner'],
          status: 'active',
        } as OrganizationMember
      : organizationMember as OrganizationMember | null,
    isLoading: authLoading || orgLoading,
    setOrganizationMember: () => {
      refetch();
    },
  }), [organizationMember, authLoading, orgLoading, refetch, isSuperAdmin, user]);

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}