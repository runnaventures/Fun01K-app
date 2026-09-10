import { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useOrganization } from '@/app/providers/OrganizationProvider';
import { useTeams, useCreateTeam, useUpdateTeam, useDeleteTeam } from '@/features/company-admin/queries/teamQueries';
import { useDepartments } from '@/features/employee/queries/profileQueries';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';
import { Button } from '@/components/ui/Button';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';

export default function TeamsPage() {
  const { user } = useAuth();
  const { organizationMember } = useOrganization();
  const organizationId = organizationMember?.organization_id || '';

  const { data: teams, isLoading, refetch } = useTeams(organizationId);
  const { data: departments = [], isLoading: deptsLoading } = useDepartments(organizationId);
  const { mutate: createTeam, isPending: isCreatingTeam } = useCreateTeam(); // Changed from isCreating to isCreatingTeam
  const { mutate: updateTeam } = useUpdateTeam();
  const { mutate: deleteTeam } = useDeleteTeam();

  const [isCreating, setIsCreating] = useState(false); // This is the state variable
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department_id: '',
  });
  const [showCreateDepartment, setShowCreateDepartment] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');

  // Reset form when editing
  useEffect(() => {
    if (editingId) {
      const team = teams?.find((t: any) => t.id === editingId);
      if (team) {
        setFormData({
          name: team.name || '',
          description: team.description || '',
          department_id: team.department_id || '',
        });
      }
    }
  }, [editingId, teams]);

  const handleCreate = () => {
    setFormData({ name: '', description: '', department_id: '' });
    setIsCreating(true);
    setEditingId(null);
    setShowCreateDepartment(false);
  };

  const handleEdit = (team: any) => {
    setFormData({
      name: team.name,
      description: team.description || '',
      department_id: team.department_id || '',
    });
    setEditingId(team.id);
    setIsCreating(false);
    setShowCreateDepartment(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) return;

    const submitData = {
      organization_id: organizationId,
      name: formData.name,
      description: formData.description || undefined,
      department_id: formData.department_id || undefined,
    };

    if (editingId) {
      updateTeam({
        id: editingId,
        data: submitData,
      }, {
        onSuccess: () => {
          setEditingId(null);
          refetch();
        },
      });
    } else {
      createTeam(submitData, {
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
    setShowCreateDepartment(false);
    setNewDepartmentName('');
  };

  // Get department name by ID
  const getDepartmentName = (deptId: string | null | undefined) => {
    if (!deptId) return 'No Department';
    const dept = departments?.find((d: any) => d.id === deptId);
    return dept?.name || 'Unknown Department';
  };

  if (isLoading || deptsLoading) {
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
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
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
            <div className="grid gap-4 md:grid-cols-2">
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
                <div className="flex gap-2">
                  <select
                    value={formData.department_id}
                    onChange={(e) => {
                      if (e.target.value === 'create_new') {
                        setShowCreateDepartment(true);
                        setFormData({ ...formData, department_id: '' });
                      } else {
                        setFormData({ ...formData, department_id: e.target.value });
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">No Department</option>
                    {departments?.map((dept: any) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                    <option value="create_new" className="text-primary font-medium">+ Create New Department</option>
                  </select>
                </div>
              </div>
              {showCreateDepartment && (
                <div className="md:col-span-2 flex gap-2 items-center">
                  <input
                    type="text"
                    value={newDepartmentName}
                    onChange={(e) => setNewDepartmentName(e.target.value)}
                    placeholder="Enter new department name..."
                    className="flex-1 px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newDepartmentName.trim()) {
                        // In production, you'd create the department here
                        // For now, we'll just close the input
                        setShowCreateDepartment(false);
                        setNewDepartmentName('');
                      }
                    }}
                    className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateDepartment(false);
                      setNewDepartmentName('');
                    }}
                    className="px-3 py-2 border border-input rounded-md hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <div className="md:col-span-2">
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
                    No teams found. Create your first team by clicking the "Create Team" button.
                  </td>
                </tr>
              ) : (
                teams?.map((team: any) => (
                  <tr key={team.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium">{team.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {getDepartmentName(team.department_id)}
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