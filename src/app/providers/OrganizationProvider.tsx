// src/app/providers/OrganizationProvider.tsx

import { createContext, useContext, ReactNode, useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthProvider';
import { db } from '@/lib/db';

interface OrganizationMember {
  id: string;
  organization_id: string;
  profile_id: string;
  roles: string[];
  department_id?: string;
  team_id?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  website?: string | null;
  industry?: string | null;
  size?: number | null;
  timezone?: string | null;
  status?: string | null;
  monthly_points_budget?: number | null;
  created_at?: string;
  updated_at?: string;
}

interface OrganizationContextType {
  organizationMember: OrganizationMember | null;
  organization: Organization | null;
  organizationId: string | null;
  isLoading: boolean;
  isSuperAdmin: boolean;
  refetch: () => Promise<void>;
  setOrganizationMember: (member: OrganizationMember | null) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

// List of super admin user IDs
const SUPER_ADMINS = [
  '8f914d26-6dce-4b51-8b22-a1d792b07c5d',
  'f49d186f-059e-4087-beb3-c3363ec28853',
];

// Cache the organization data to prevent unnecessary re-fetches
// ✅ Reset cache when user changes
let cachedMember: OrganizationMember | null = null;
let cachedOrganization: Organization | null = null;
let cachedUserId: string | null = null;

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading, userRole } = useAuth();
  const [organizationMember, setOrganizationMember] = useState<OrganizationMember | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [orgLoading, setOrgLoading] = useState(false);
  const isFirstLoad = useRef(true);
  const isFetching = useRef(false);
  const lastUserId = useRef<string | null>(null);

  const isSuperAdmin = user?.id ? SUPER_ADMINS.includes(user.id) : false;

  // ✅ Reset cache when user changes
  useEffect(() => {
    if (lastUserId.current && lastUserId.current !== user?.id) {
      // User has changed - clear cache
      cachedMember = null;
      cachedOrganization = null;
      cachedUserId = null;
      setOrganizationMember(null);
      setOrganization(null);
      isFirstLoad.current = true;
    }
    lastUserId.current = user?.id || null;
  }, [user?.id]);

  const fetchOrganizationData = useCallback(async (forceRefresh: boolean = false) => {
    // Prevent concurrent fetches
    if (isFetching.current) {
      console.log('Organization fetch already in progress, skipping...');
      return;
    }

    if (!user) {
      setOrganizationMember(null);
      setOrganization(null);
      cachedMember = null;
      cachedOrganization = null;
      cachedUserId = null;
      setOrgLoading(false);
      return;
    }

    // ✅ Only use cache if the user ID matches and not forcing refresh
    if (!forceRefresh && cachedMember && cachedUserId === user.id) {
      setOrganizationMember(cachedMember);
      setOrganization(cachedOrganization);
      setOrgLoading(false);
      return;
    }

    isFetching.current = true;
    setOrgLoading(true);

    try {
      // Use the database wrapper
      const { data: member, error: memberError } = await db.organizationMembers.getByProfileId(user.id);

      if (memberError) {
        console.error('Error fetching organization member:', memberError);
        setOrgLoading(false);
        return;
      }

      if (member) {
        setOrganizationMember(member);
        cachedMember = member;
        cachedUserId = user.id;

        // Fetch organization details
        const { data: org, error: orgError } = await db.organizations.getById(member.organization_id);

        if (orgError) {
          console.error('Error fetching organization:', orgError);
        } else {
          setOrganization(org);
          cachedOrganization = org;
        }
      } else {
        setOrganizationMember(null);
        setOrganization(null);
        cachedMember = null;
        cachedOrganization = null;
        cachedUserId = null;
      }
    } catch (error) {
      console.error('Error in fetchOrganizationData:', error);
    } finally {
      setOrgLoading(false);
      isFetching.current = false;
      isFirstLoad.current = false;
    }
  }, [user]);

  // Fetch on mount and when user changes
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    if (user) {
      // Debounce the fetch to prevent multiple calls
      timeoutId = setTimeout(() => {
        // ✅ Always fetch when user changes, but use cache if available
        if (isFirstLoad.current || lastUserId.current !== user.id) {
          fetchOrganizationData(false);
        } else {
          fetchOrganizationData(false);
        }
      }, 50);
    } else {
      setOrganizationMember(null);
      setOrganization(null);
      cachedMember = null;
      cachedOrganization = null;
      cachedUserId = null;
      setOrgLoading(false);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user?.id, fetchOrganizationData]);

  const refetch = useCallback(async () => {
    // Clear cache before refetch
    cachedMember = null;
    cachedOrganization = null;
    cachedUserId = null;
    await fetchOrganizationData(true);
  }, [fetchOrganizationData]);

  const value = useMemo(() => {
    const organizationId = organizationMember?.organization_id || null;

    return {
      organizationMember,
      organization,
      organizationId,
      isLoading: authLoading || orgLoading,
      isSuperAdmin,
      refetch,
      setOrganizationMember,
    };
  }, [organizationMember, organization, authLoading, orgLoading, isSuperAdmin, refetch]);

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