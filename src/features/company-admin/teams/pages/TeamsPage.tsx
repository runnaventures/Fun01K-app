import { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useOrganization } from '@/app/providers/OrganizationProvider';
import { useTeams, useCreateTeam, useUpdateTeam, useDeleteTeam } from '@/features/teams/queries/teamQueries';
import { useDepartments } from '@/features/profiles/queries/profileQueries';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';

export default function TeamsPage() {
  const { user } = useAuth();
  const { organizationMember } = useOrganization();
  const organizationId = organizationMember?.organization_id || '';

  const { data: teams, isLoading, refetch } = useTeams(organizationId);
  const { data: departments } = useDepartments(); // No arguments needed
  const { mutate: createTeam, isPending: isCreatingTeam } = useCreateTeam();
  const { mutate: updateTeam } = useUpdateTeam();
  const { mutate: deleteTeam } = useDeleteTeam();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department_id: '',
  });

  const handleCreate = () => {
    setFormData({ name: '', description: '', department_id: '' });
    setIsCreating(true);
  };

  const handleEdit = (team: any) => {
    setFormData({
      name: team.name,
      description: team.description || '',
      department_id: team.department_id || '',
    });
    setEditingId(team.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      updateTeam({
        id: editingId,
        data: {
          name: formData.name,
          description: formData.description || null,
          department_id: formData.department_id || null,
        },
      }, {
        onSuccess: () => {
          setEditingId(null);
          refetch();
        },
      });
    } else {
      createTeam({
        organization_id: organizationId,
        name: formData.name,
        description: formData.description || undefined,
        department_id: formData.department_id || undefined,
      }, {
        onSuccess: () => {
          setIsCreating(false);
          refetch();
        },
      });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      deleteTeam(id, {
        onSuccess: () => {
          refetch();
        },
      });
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground">
            Manage teams in your organization
          </p>
        </div>
        {!isCreating && !editingId && (
          <button
            onClick={handleCreate}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Create Team
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Team' : 'Create Team'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">Team Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Frontend Team"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Department</label>
                <select
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">No Department</option>
                  {departments?.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Team description"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isCreatingTeam}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isCreatingTeam ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Teams List */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Department</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Description</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Members</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No teams found
                  </td>
                </tr>
              ) : (
                teams?.map((team) => (
                  <tr key={team.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium">{team.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {departments?.find(d => d.id === team.department_id)?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{team.description || '-'}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">0</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(team)}
                        className="text-sm text-primary hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(team.id)}
                        className="text-sm text-destructive hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}