import { supabase } from '@/lib/supabase';
import type { Team, CreateTeamData, UpdateTeamData } from '../types/team.types';

export const teamService = {
  async getTeams(organizationId: string, departmentId?: string): Promise<Team[]> {
    let query = supabase
      .from('teams')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name');

    if (departmentId) {
      query = query.eq('department_id', departmentId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching teams:', error);
      return [];
    }

    return data as Team[];
  },

  async getTeam(id: string): Promise<Team | null> {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching team:', error);
      return null;
    }

    return data as Team;
  },

  async createTeam(data: CreateTeamData): Promise<Team | null> {
    const { data: team, error } = await supabase
      .from('teams')
      .insert({
        organization_id: data.organization_id,
        department_id: data.department_id || null,
        name: data.name,
        description: data.description || null,
        team_lead_id: data.team_lead_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating team:', error);
      return null;
    }

    return team as Team;
  },

  async updateTeam(id: string, data: UpdateTeamData): Promise<Team | null> {
    const updateData: {
      name?: string;
      description?: string | null;
      department_id?: string | null;
      team_lead_id?: string | null;
      updated_at: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.department_id !== undefined) updateData.department_id = data.department_id;
    if (data.team_lead_id !== undefined) updateData.team_lead_id = data.team_lead_id;

    const { data: updated, error } = await supabase
      .from('teams')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating team:', error);
      return null;
    }

    return updated as Team;
  },

  async deleteTeam(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting team:', error);
      return false;
    }

    return true;
  },
};