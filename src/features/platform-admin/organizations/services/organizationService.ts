import { supabase } from '@/lib/supabase';
import type { Organization, CreateOrganizationData, UpdateOrganizationData, OrganizationMember } from '../types/organization.types';

export const organizationService = {
  // Get all organizations
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

  // Get a single organization
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

  // Create organization
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
      .select('*')
      .single();

    if (error) {
      console.error('Error creating organization:', error);
      return null;
    }

    return organization as Organization;
  },

  // Update organization - FIXED
  async updateOrganization(id: string, data: UpdateOrganizationData): Promise<Organization | null> {
    if (!id || id === 'super-admin') {
      console.error('Cannot update super-admin organization');
      return null;
    }

    console.log('updateOrganization called with:', { id, data });
    
    // First, check if the organization exists
    const { data: existing, error: checkError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking organization existence:', checkError);
      return null;
    }

    if (!existing) {
      console.error('Organization not found with ID:', id);
      return null;
    }

    // Build update object
    const updateData: {
      name?: string;
      industry?: string | null;
      size?: number | null;
      website?: string | null;
      timezone?: string;
      status?: 'active' | 'inactive' | 'suspended';
      updated_at: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.industry !== undefined) updateData.industry = data.industry;
    if (data.size !== undefined) updateData.size = data.size;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.status !== undefined) updateData.status = data.status;

    console.log('Update data:', updateData);

    // Use .select('*') without .single() to avoid PGRST116 error
    const { data: updated, error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', id)
      .select('*');

    if (error) {
      console.error('Error updating organization:', error);
      return null;
    }

    if (!updated || updated.length === 0) {
      console.error('No rows updated');
      return null;
    }

    console.log('Updated organization:', updated[0]);
    return updated[0] as Organization;
  },

  // Delete organization
  async deleteOrganization(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting organization:', error);
      return false;
    }

    return true;
  },

  // Upload logo
  async uploadLogo(organizationId: string, file: File): Promise<string | null> {
    try {
      const { error: bucketError } = await supabase.storage.createBucket('organization-logos', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      });
      if (bucketError && bucketError.message !== 'Bucket already exists') {
        console.error('Error creating bucket:', bucketError);
      }
    } catch (e) {
      // Bucket might already exist
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${organizationId}-${Date.now()}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('organization-logos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

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

  // Remove logo
  async removeLogo(organizationId: string): Promise<boolean> {
    const { data: org, error: fetchError } = await supabase
      .from('organizations')
      .select('logo_url')
      .eq('id', organizationId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching organization for logo removal:', fetchError);
      return false;
    }

    if (org?.logo_url) {
      const urlParts = org.logo_url.split('/');
      const filePath = urlParts.slice(urlParts.indexOf('organization-logos') + 1).join('/');
      
      if (filePath) {
        const { error } = await supabase.storage
          .from('organization-logos')
          .remove([filePath]);
        
        if (error) {
          console.error('Error removing logo:', error);
        }
      }
    }

    const { error } = await supabase
      .from('organizations')
      .update({ logo_url: null })
      .eq('id', organizationId);

    if (error) {
      console.error('Error removing logo from organization:', error);
      return false;
    }

    return true;
  },

  // Invite employee
  async inviteEmployee(organizationId: string, email: string, role: string): Promise<any> {
    const { data, error } = await supabase.functions.invoke('invite-employee', {
      body: { organizationId, email, role },
    });

    if (error) {
      console.error('Error inviting employee:', error);
      return { error };
    }

    return { data };
  },

  // Get organization members
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

  // Update member role
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

  // Remove member
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