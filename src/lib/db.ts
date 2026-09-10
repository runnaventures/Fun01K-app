// src/lib/db.ts

import { supabase } from './supabase';

/**
 * Database wrapper with complete type safety bypass
 * All methods return typed data with proper error handling
 */
export const db = {
  // ==================== Organization Members ====================
  organizationMembers: {
    getByProfileId: async (profileId: string) => {
      const { data, error } = await supabase
        .from('organization_members')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle() as any;
      return { data: data as any, error };
    },

    getRolesByProfileId: async (profileId: string) => {
      const { data, error } = await supabase
        .from('organization_members')
        .select('roles')
        .eq('profile_id', profileId)
        .maybeSingle() as any;
      return { data: data as any, error };
    },

    getByOrganizationId: async (organizationId: string) => {
      const { data, error } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', organizationId) as any;
      return { data: data as any, error };
    },

    insert: async (memberData: any) => {
      const { data, error } = await supabase
        .from('organization_members')
        .insert(memberData)
        .select() as any;
      return { data: data as any, error };
    },

    update: async (profileId: string, updates: any) => {
      const { data, error } = await supabase
        .from('organization_members')
        .update(updates)
        .eq('profile_id', profileId)
        .select() as any;
      return { data: data as any, error };
    },

    upsert: async (memberData: any) => {
      const { data, error } = await supabase
        .from('organization_members')
        .upsert(memberData)
        .select() as any;
      return { data: data as any, error };
    },
  },

  // ==================== Organizations ====================
  organizations: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false }) as any;
      return { data: data as any, error };
    },

    getAllExceptPlatform: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .neq('slug', 'platform')
        .order('created_at', { ascending: false }) as any;
      return { data: data as any, error };
    },

    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .maybeSingle() as any;
      return { data: data as any, error };
    },

    getBySlug: async (slug: string) => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .maybeSingle() as any;
      return { data: data as any, error };
    },

    create: async (orgData: any) => {
      const { data, error } = await supabase
        .from('organizations')
        .insert(orgData)
        .select() as any;
      return { data: data as any, error };
    },

    update: async (id: string, updates: any) => {
      const { data, error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', id)
        .select() as any;
      return { data: data as any, error };
    },

    delete: async (id: string) => {
      const { data, error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id)
        .select() as any;
      return { data: data as any, error };
    },
  },

  // ==================== Profiles ====================
  profiles: {
    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle() as any;
      return { data: data as any, error };
    },

    getByEmail: async (email: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle() as any;
      return { data: data as any, error };
    },

    update: async (id: string, updates: any) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select() as any;
      return { data: data as any, error };
    },

    create: async (profileData: any) => {
      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select() as any;
      return { data: data as any, error };
    },
  },

  // ==================== Departments ====================
  departments: {
    getByOrganizationId: async (organizationId: string) => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('organization_id', organizationId) as any;
      return { data: data as any, error };
    },

    create: async (deptData: any) => {
      const { data, error } = await supabase
        .from('departments')
        .insert(deptData)
        .select() as any;
      return { data: data as any, error };
    },

    update: async (id: string, updates: any) => {
      const { data, error } = await supabase
        .from('departments')
        .update(updates)
        .eq('id', id)
        .select() as any;
      return { data: data as any, error };
    },

    delete: async (id: string) => {
      const { data, error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id)
        .select() as any;
      return { data: data as any, error };
    },
  },

  // ==================== Teams ====================
  teams: {
    getByOrganizationId: async (organizationId: string) => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('organization_id', organizationId) as any;
      return { data: data as any, error };
    },

    getByDepartmentId: async (departmentId: string) => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('department_id', departmentId) as any;
      return { data: data as any, error };
    },

    create: async (teamData: any) => {
      const { data, error } = await supabase
        .from('teams')
        .insert(teamData)
        .select() as any;
      return { data: data as any, error };
    },

    update: async (id: string, updates: any) => {
      const { data, error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', id)
        .select() as any;
      return { data: data as any, error };
    },

    delete: async (id: string) => {
      const { data, error } = await supabase
        .from('teams')
        .delete()
        .eq('id', id)
        .select() as any;
      return { data: data as any, error };
    },
  },

  // ==================== Activities ====================
  activities: {
    getByOrganizationId: async (organizationId: string) => {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('organization_id', organizationId) as any;
      return { data: data as any, error };
    },

    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('id', id)
        .maybeSingle() as any;
      return { data: data as any, error };
    },

    create: async (activityData: any) => {
      const { data, error } = await supabase
        .from('activities')
        .insert(activityData)
        .select() as any;
      return { data: data as any, error };
    },

    update: async (id: string, updates: any) => {
      const { data, error } = await supabase
        .from('activities')
        .update(updates)
        .eq('id', id)
        .select() as any;
      return { data: data as any, error };
    },

    updateImage: async (id: string, imageUrl: string | null) => {
      const { data, error } = await supabase
        .from('activities')
        .update({ image_url: imageUrl })
        .eq('id', id)
        .select() as any;
      return { data: data as any, error };
    },

    delete: async (id: string) => {
      const { data, error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id)
        .select() as any;
      return { data: data as any, error };
    },
  },

  // ==================== Activity Participations ====================
  activityParticipations: {
    getByProfileId: async (profileId: string) => {
      const { data, error } = await supabase
        .from('activity_participations')
        .select('*')
        .eq('profile_id', profileId) as any;
      return { data: data as any, error };
    },

    getByActivityId: async (activityId: string) => {
      const { data, error } = await supabase
        .from('activity_participations')
        .select('*')
        .eq('activity_id', activityId) as any;
      return { data: data as any, error };
    },

    create: async (participationData: any) => {
      const { data, error } = await supabase
        .from('activity_participations')
        .insert(participationData)
        .select() as any;
      return { data: data as any, error };
    },

    update: async (id: string, updates: any) => {
      const { data, error } = await supabase
        .from('activity_participations')
        .update(updates)
        .eq('id', id)
        .select() as any;
      return { data: data as any, error };
    },
  },

  // ==================== Points ====================
  pointsAccounts: {
    getByProfileId: async (profileId: string) => {
      const { data, error } = await supabase
        .from('points_accounts')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle() as any;
      return { data: data as any, error };
    },

    update: async (profileId: string, updates: any) => {
      const { data, error } = await supabase
        .from('points_accounts')
        .update(updates)
        .eq('profile_id', profileId)
        .select() as any;
      return { data: data as any, error };
    },
  },

  pointsLedger: {
    getByProfileId: async (profileId: string) => {
      const { data, error } = await supabase
        .from('points_ledger')
        .select('*')
        .eq('account_id', profileId)
        .order('created_at', { ascending: false }) as any;
      return { data: data as any, error };
    },

    create: async (ledgerData: any) => {
      const { data, error } = await supabase
        .from('points_ledger')
        .insert(ledgerData)
        .select() as any;
      return { data: data as any, error };
    },
  },

  // ==================== Audit Logs ====================
  auditLogs: {
    create: async (logData: any) => {
      const { data, error } = await supabase
        .from('audit_logs')
        .insert(logData)
        .select() as any;
      return { data: data as any, error };
    },

    getRecent: async (limit: number = 10) => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit) as any;
      return { data: data as any, error };
    },
  },

  // ==================== Platform Admin Helper ====================
  platform: {
    getPlatformOrganizationId: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', 'platform')
        .maybeSingle() as any;
      return { data: data as any, error };
    },
  },
};

export default db;