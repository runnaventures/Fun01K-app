export interface Team {
  id: string;
  organization_id: string;
  department_id?: string | null;
  name: string;
  description?: string | null;
  team_lead_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTeamData {
  organization_id: string;
  department_id?: string;
  name: string;
  description?: string;
  team_lead_id?: string;
}

export interface UpdateTeamData {
  name?: string;
  description?: string | null;
  department_id?: string | null;
  team_lead_id?: string | null;
}