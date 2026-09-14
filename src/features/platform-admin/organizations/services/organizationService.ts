// src/features/platform-admin/organizations/services/organizationService.ts

import { supabase } from '@/lib/supabase';
import type {
  Organization,
  CreateOrganizationData,
  UpdateOrganizationData,
  OrganizationMember,
} from '../types/organization.types';

export const organizationService = {
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Get all organizations with member counts + owner email
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async getOrganizations(): Promise<Organization[]> {
    // Fetch base org rows
    const { data: orgs, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching organizations:', error);
      return [];
    }

    if (!orgs || orgs.length === 0) return [];

    const orgIds = orgs.map((o: any) => o.id);

    // Fetch member counts per org
    const { data: memberRows } = await supabase
      .from('organization_members')
      .select('organization_id')
      .in('organization_id', orgIds);

    const memberCountMap: Record<string, number> = {};
    (memberRows || []).forEach((row: any) => {
      memberCountMap[row.organization_id] =
        (memberCountMap[row.organization_id] || 0) + 1;
    });

    // Fetch owner email per org (first company_owner found)
    const { data: ownerRows } = await supabase
      .from('organization_members')
      .select('organization_id, profiles(email)')
      .in('organization_id', orgIds)
      .contains('roles', ['company_owner']);

    const ownerEmailMap: Record<string, string> = {};
    (ownerRows || []).forEach((row: any) => {
      const email = row.profiles?.email;
      if (email && !ownerEmailMap[row.organization_id]) {
        ownerEmailMap[row.organization_id] = email;
      }
    });

    return orgs.map((org: any) => ({
      ...org,
      members_count: memberCountMap[org.id] || 0,
      contact_email: org.contact_email || ownerEmailMap[org.id] || null,
    })) as Organization[];
  },

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Get a single organization
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async getOrganization(id: string): Promise<Organization | null> {
    if (!id || id === 'super-admin') {
      console.log('Invalid organization ID:', id);
      return null;
    }

    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching organization:', error);
      return null;
    }

    return data as Organization;
  },

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Create organization
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async createOrganization(
    data: CreateOrganizationData
  ): Promise<Organization | null> {
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
        subscription_plan: data.subscription_plan || 'starter',
        monthly_points_allowance: data.monthly_points_allowance || 5000,
        contact_email: data.contact_email || null,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating organization:', error);
      return null;
    }

    return organization as Organization;
  },

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Update organization
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async updateOrganization(
    id: string,
    data: UpdateOrganizationData
  ): Promise<Organization | null> {
    if (!id || id === 'super-admin') {
      console.error('Cannot update super-admin organization');
      return null;
    }

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.industry !== undefined) updateData.industry = data.industry;
    if (data.size !== undefined) updateData.size = data.size;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.subscription_plan !== undefined)
      updateData.subscription_plan = data.subscription_plan;
    if (data.monthly_points_allowance !== undefined)
      updateData.monthly_points_allowance = data.monthly_points_allowance;
    if (data.contact_email !== undefined)
      updateData.contact_email = data.contact_email;

    const { data: updated, error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', id)
      .select('*');

    if (error) {
      console.error('Error updating organization:', error);
      return null;
    }

    if (!updated || updated.length === 0) return null;

    return updated[0] as Organization;
  },

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Delete organization
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async deleteOrganization(id: string): Promise<boolean> {
    const { error } = await supabase.from('organizations').delete().eq('id', id);
    if (error) {
      console.error('Error deleting organization:', error);
      return false;
    }
    return true;
  },

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Logo upload / remove (unchanged)
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async uploadLogo(organizationId: string, file: File): Promise<string | null> {
    try {
      const { error: bucketError } = await supabase.storage.createBucket(
        'organization-logos',
        { public: true, fileSizeLimit: 5242880 }
      );
      if (bucketError && bucketError.message !== 'Bucket already exists') {
        console.error('Error creating bucket:', bucketError);
      }
    } catch (e) {
      // ignore
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${organizationId}-${Date.now()}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('organization-logos')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      console.error('Error uploading logo:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('organization-logos')
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from('organizations')
      .update({ logo_url: data.publicUrl })
      .eq('id', organizationId);

    if (updateError) {
      console.error('Error updating organization with logo:', updateError);
      return null;
    }

    return data.publicUrl;
  },

  async removeLogo(organizationId: string): Promise<boolean> {
    const { data: org } = await supabase
      .from('organizations')
      .select('logo_url')
      .eq('id', organizationId)
      .maybeSingle();

    if (org?.logo_url) {
      const urlParts = org.logo_url.split('/');
      const filePath = urlParts
        .slice(urlParts.indexOf('organization-logos') + 1)
        .join('/');
      if (filePath) {
        await supabase.storage.from('organization-logos').remove([filePath]);
      }
    }

    const { error } = await supabase
      .from('organizations')
      .update({ logo_url: null })
      .eq('id', organizationId);

    return !error;
  },

  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Members
  // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async getOrganizationMembers(
    organizationId: string
  ): Promise<OrganizationMember[]> {
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

    return error ? { error } : { data };
  },

  async removeMember(memberId: string): Promise<any> {
    const { error } = await supabase
      .from('organization_members')
      .update({ status: 'inactive', updated_at: new Date().toISOString() })
      .eq('id', memberId);

    return error ? { error } : { success: true };
  },

  async inviteEmployee(
    organizationId: string,
    email: string,
    role: string
  ): Promise<any> {
    const { data, error } = await supabase.functions.invoke('invite-employee', {
      body: { organizationId, email, role },
    });
    return error ? { error } : { data };
  },
};