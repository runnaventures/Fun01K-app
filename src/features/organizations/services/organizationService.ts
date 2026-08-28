import { supabase } from '@/lib/supabase';
import type { Organization, CreateOrganizationData, UpdateOrganizationData, OrganizationMember } from '../types/organization.types';

export const organizationService = {
  async createOrganization(data: CreateOrganizationData): Promise<Organization | null> {
    const { data: organization, error } = await supabase
      .from('organizations')
      .insert({
        name: data.name,
        slug: data.slug,
        website: data.website || null,
        industry: data.industry || null,
        size: data.size || null,
        timezone: data.timezone || 'UTC',
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating organization:', error);
      return null;
    }

    return organization as Organization;
  },

  async getOrganizations(): Promise<Organization[]> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching organizations:', error);
      return [];
    }

    return data as Organization[];
  },

  async getOrganization(id: string): Promise<Organization | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching organization:', error);
      return null;
    }

    return data as Organization;
  },

  async updateOrganization(id: string, data: UpdateOrganizationData): Promise<Organization | null> {
    const updateData: {
      name?: string;
      slug?: string;
      website?: string | null;
      industry?: string | null;
      size?: number | null;
      timezone?: string;
      status?: 'active' | 'inactive' | 'suspended';
      updated_at: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.industry !== undefined) updateData.industry = data.industry;
    if (data.size !== undefined) updateData.size = data.size;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.status !== undefined) updateData.status = data.status;

    const { data: updated, error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating organization:', error);
      return null;
    }

    return updated as Organization;
  },

  async inviteEmployee(organizationId: string, email: string, role: string): Promise<any> {
    // This will call an Edge Function to send invitation
    const { data, error } = await supabase.functions.invoke('invite-employee', {
      body: { organizationId, email, role },
    });

    if (error) {
      console.error('Error inviting employee:', error);
      return { error };
    }

    return { data };
  },

  async getOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
    const { data, error } = await supabase
      .from('organization_members')
      .select('*, profiles(first_name, last_name, email, avatar_url)')
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Error fetching organization members:', error);
      return [];
    }

    return data as OrganizationMember[];
  },

  async updateMemberRole(memberId: string, roles: string[]): Promise<any> {
    const { data, error } = await supabase
      .from('organization_members')
      .update({ roles, updated_at: new Date().toISOString() })
      .eq('id', memberId)
      .select();

    if (error) {
      console.error('Error updating member role:', error);
      return { error };
    }

    return { data };
  },

  async removeMember(memberId: string): Promise<any> {
    const { error } = await supabase
      .from('organization_members')
      .update({ status: 'inactive', updated_at: new Date().toISOString() })
      .eq('id', memberId);

    if (error) {
      console.error('Error removing member:', error);
      return { error };
    }

    return { success: true };
  },
};