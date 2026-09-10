import { supabase } from '@/lib/supabase';
import type { Employee, BulkEmployeeImport, EmployeeInvite } from '../types/employee.types';

const db = supabase as any;

export const employeeService = {
  // Get all employees for an organization
  async getEmployees(organizationId: string, filters?: { status?: string; department_id?: string; search?: string }) {
    let query = db
      .from('organization_members')
      .select(`
        id,
        profile_id,
        organization_id,
        roles,
        status,
        profiles:profile_id (
          id,
          first_name,
          last_name,
          email,
          phone,
          avatar_url,
          job_title,
          department_id,
          team_id
        )
      `)
      .eq('organization_id', organizationId);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.department_id) {
      // Filter by department through profiles
      query = query.eq('profiles.department_id', filters.department_id);
    }
    if (filters?.search) {
      query = query.or(
        `profiles.first_name.ilike.%${filters.search}%,` +
        `profiles.last_name.ilike.%${filters.search}%,` +
        `profiles.email.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching employees:', error);
      return [];
    }

    return data;
  },

  // Get single employee
  async getEmployee(profileId: string) {
    const { data, error } = await db
      .from('organization_members')
      .select(`
        *,
        profiles:profile_id (
          id,
          first_name,
          last_name,
          email,
          phone,
          avatar_url,
          job_title,
          department_id,
          team_id
        )
      `)
      .eq('profile_id', profileId)
      .single();

    if (error) {
      console.error('Error fetching employee:', error);
      return null;
    }

    return data;
  },

  // Add employee manually
  async addEmployee(organizationId: string, data: any) {
    const { data: profile, error: profileError } = await db
      .from('profiles')
      .insert({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone || null,
        job_title: data.job_title || null,
        department_id: data.department_id || null,
        team_id: data.team_id || null,
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error creating profile:', profileError);
      return null;
    }

    const { data: member, error: memberError } = await db
      .from('organization_members')
      .insert({
        organization_id: organizationId,
        profile_id: profile.id,
        roles: data.roles || ['employee'],
        status: 'active',
      })
      .select()
      .single();

    if (memberError) {
      console.error('Error adding organization member:', memberError);
      return null;
    }

    return member;
  },

  // Bulk import employees from CSV
  async bulkImport(organizationId: string, employees: BulkEmployeeImport[]) {
    const results = [];
    const errors = [];

    for (const emp of employees) {
      try {
        // Create profile
        const { data: profile, error: profileError } = await db
          .from('profiles')
          .insert({
            first_name: emp.first_name,
            last_name: emp.last_name,
            email: emp.email,
            job_title: emp.job_title || null,
          })
          .select()
          .single();

        if (profileError) {
          errors.push({ email: emp.email, error: profileError.message });
          continue;
        }

        // Add to organization
        const { data: member, error: memberError } = await db
          .from('organization_members')
          .insert({
            organization_id: organizationId,
            profile_id: profile.id,
            roles: [emp.role || 'employee'],
            status: 'active',
          })
          .select()
          .single();

        if (memberError) {
          errors.push({ email: emp.email, error: memberError.message });
          continue;
        }

        results.push(member);
      } catch (error) {
        errors.push({ email: emp.email, error: String(error) });
      }
    }

    return { results, errors };
  },

  // Invite employee
  async inviteEmployee(organizationId: string, invite: EmployeeInvite) {
    // Check if profile exists
    const { data: existing } = await db
      .from('profiles')
      .select('id')
      .eq('email', invite.email)
      .single();

    let profileId = existing?.id;

    if (!existing) {
      // Create profile with minimal info
      const { data: profile, error } = await db
        .from('profiles')
        .insert({
          email: invite.email,
          first_name: '',
          last_name: '',
          phone: null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return null;
      }

      profileId = profile.id;
    }

    // Check if already a member
    const { data: existingMember } = await db
      .from('organization_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('profile_id', profileId)
      .single();

    if (existingMember) {
      // Update status to invited if not already
      await db
        .from('organization_members')
        .update({ status: 'invited', updated_at: new Date().toISOString() })
        .eq('id', existingMember.id);
      
      return { success: true, alreadyMember: true };
    }

    // Add as invited member
    const { data: member, error } = await db
      .from('organization_members')
      .insert({
        organization_id: organizationId,
        profile_id: profileId,
        roles: [invite.role || 'employee'],
        status: 'invited',
        department_id: invite.department_id || null,
        team_id: invite.team_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inviting employee:', error);
      return null;
    }

    // TODO: Send email invitation
    return member;
  },

  // Update employee status
  async updateStatus(memberId: string, status: string) {
    const { data, error } = await db
      .from('organization_members')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', memberId)
      .select()
      .single();

    if (error) {
      console.error('Error updating status:', error);
      return null;
    }

    return data;
  },

  // Remove employee (soft delete)
  async removeEmployee(memberId: string) {
    const { data, error } = await db
      .from('organization_members')
      .update({ 
        status: 'inactive', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', memberId)
      .select()
      .single();

    if (error) {
      console.error('Error removing employee:', error);
      return null;
    }

    return data;
  },

  // Update employee role
  async updateRole(memberId: string, roles: string[]) {
    const { data, error } = await db
      .from('organization_members')
      .update({ roles, updated_at: new Date().toISOString() })
      .eq('id', memberId)
      .select()
      .single();

    if (error) {
      console.error('Error updating role:', error);
      return null;
    }

    return data;
  },

  // Get pending invites
  async getPendingInvites(organizationId: string) {
    const { data, error } = await db
      .from('organization_members')
      .select(`
        *,
        profiles:profile_id (
          first_name,
          last_name,
          email
        )
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'invited');

    if (error) {
      console.error('Error fetching pending invites:', error);
      return [];
    }

    return data;
  },
};