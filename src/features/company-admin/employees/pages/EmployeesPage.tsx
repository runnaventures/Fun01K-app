import { useState, useRef } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useOrganization } from '@/app/providers/OrganizationProvider';
import { useEmployees, useAddEmployee, useBulkImport, useInviteEmployee, useUpdateEmployeeStatus, useRemoveEmployee, useUpdateEmployeeRole, usePendingInvites } from '@/features/company-admin/queries/employeeQueries';
import { useDepartments } from '@/features/employee/queries/profileQueries';
import { useTeams } from '@/features/company-admin/queries/teamQueries';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';
import { formatPoints, getInitials } from '@/lib/utils';
import { 
  Search, 
  Plus, 
  Upload, 
  Mail, 
  MoreVertical,
  UserPlus,
  Download,
  X,
  Check,
  Edit2,
  Trash2,
  Send,
  Users,
} from 'lucide-react';

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    active: 'bg-green-500/10 text-green-600',
    invited: 'bg-yellow-500/10 text-yellow-600',
    pending: 'bg-blue-500/10 text-blue-600',
    inactive: 'bg-gray-500/10 text-gray-600',
  };
  
  const labels: Record<string, string> = {
    active: 'Active',
    invited: 'Invited',
    pending: 'Pending',
    inactive: 'Inactive',
  };

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${styles[status] || 'bg-gray-500/10 text-gray-600'}`}>
      {labels[status] || status}
    </span>
  );
};

export default function EmployeesPage() {
  const { user } = useAuth();
  const { organizationMember } = useOrganization();
  const organizationId = organizationMember?.organization_id || '';

  // Queries
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  
  const { data: employees, isLoading, refetch } = useEmployees(organizationId, {
    search: searchQuery || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    department_id: departmentFilter === 'all' ? undefined : departmentFilter,
  });
  const { data: departments = [] } = useDepartments(organizationId);
  const { data: teams } = useTeams(organizationId);
  const { data: pendingInvites } = usePendingInvites(organizationId);

  // Mutations
  const { mutate: addEmployee, isPending: isAdding } = useAddEmployee();
  const { mutate: bulkImport, isPending: isImporting } = useBulkImport();
  const { mutate: inviteEmployee, isPending: isInviting } = useInviteEmployee();
  const { mutate: updateStatus } = useUpdateEmployeeStatus();
  const { mutate: removeEmployee } = useRemoveEmployee();
  const { mutate: updateRole } = useUpdateEmployeeRole();

  // UI States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [addForm, setAddForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    job_title: '',
    department_id: '',
    team_id: '',
    role: 'employee',
  });

  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'employee',
    department_id: '',
    team_id: '',
  });

  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkPreview, setBulkPreview] = useState<any[]>([]);
  const [bulkErrors, setBulkErrors] = useState<any[]>([]);

  // Stats
  const totalEmployees = employees?.length || 0;
  const activeEmployees = employees?.filter((e: any) => e.status === 'active').length || 0;
  const invitedCount = pendingInvites?.length || 0;

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    addEmployee({
      organizationId,
      data: addForm,
    }, {
      onSuccess: () => {
        setShowAddModal(false);
        setAddForm({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          job_title: '',
          department_id: '',
          team_id: '',
          role: 'employee',
        });
        refetch();
      },
    });
  };

  const handleInviteEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    inviteEmployee({
      organizationId,
      invite: inviteForm,
    }, {
      onSuccess: () => {
        setShowInviteModal(false);
        setInviteForm({
          email: '',
          role: 'employee',
          department_id: '',
          team_id: '',
        });
        refetch();
      },
    });
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvData = event.target?.result as string;
        const lines = csvData.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        const parsed = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',').map(v => v.trim());
            return headers.reduce((obj: any, header, index) => {
              obj[header] = values[index] || '';
              return obj;
            }, {});
          });

        setBulkPreview(parsed);
        setBulkErrors([]);
      } catch (error) {
        console.error('Error parsing CSV:', error);
      }
    };
    reader.readAsText(file);
  };

  const handleBulkImport = () => {
    if (bulkPreview.length === 0) return;

    bulkImport({
      organizationId,
      employees: bulkPreview,
    }, {
      onSuccess: (result) => {
        if (result.errors.length > 0) {
          setBulkErrors(result.errors);
        } else {
          setShowBulkModal(false);
          setBulkFile(null);
          setBulkPreview([]);
          refetch();
        }
      },
    });
  };

  const handleStatusChange = (memberId: string, status: string) => {
    updateStatus({ memberId, status }, {
      onSuccess: () => refetch(),
    });
    setShowActionsMenu(null);
  };

  const handleRemoveEmployee = (memberId: string) => {
    if (window.confirm('Are you sure you want to remove this employee?')) {
      removeEmployee(memberId, {
        onSuccess: () => refetch(),
      });
    }
    setShowActionsMenu(null);
  };

  const handleRoleChange = (memberId: string, role: string) => {
    updateRole({ memberId, roles: [role] }, {
      onSuccess: () => refetch(),
    });
    setShowActionsMenu(null);
  };

  const downloadTemplate = () => {
    const headers = ['first_name', 'last_name', 'email', 'job_title', 'department_name', 'team_name', 'role'];
    const csv = headers.join(',') + '\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Roster</h1>
          <p className="text-muted-foreground">
            Manage your employees, departments, and teams
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Mail className="w-4 h-4" />
            Invite
          </button>
          <button
            onClick={() => setShowBulkModal(true)}
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Upload className="w-4 h-4" />
            Bulk Upload
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Employees</p>
          <p className="text-2xl font-bold">{totalEmployees}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-2xl font-bold text-green-600">{activeEmployees}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Pending Invites</p>
          <p className="text-2xl font-bold text-yellow-600">{invitedCount}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Departments</p>
          <p className="text-2xl font-bold">{departments?.length || 0}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="invited">Invited</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Departments</option>
            {departments?.map((dept: any) => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Employee List */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Employee</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Department</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Team</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Points</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No employees found. Add your first employee or invite someone to get started.
                  </td>
                </tr>
              ) : (
                employees?.map((member: any) => {
                  const profile = member.profiles;
                  const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || profile?.email || 'Unknown';
                  const isAdmin = member.roles?.includes('company_admin') || member.roles?.includes('company_owner');
                  const isInvited = member.status === 'invited';
                  const isPending = member.status === 'pending';

                  return (
                    <tr key={member.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt={fullName} className="w-9 h-9 rounded-full object-cover" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                              {getInitials(fullName)}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm">{fullName}</p>
                            <p className="text-xs text-muted-foreground">{profile?.email}</p>
                            {profile?.phone && (
                              <p className="text-xs text-muted-foreground">{profile.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {isAdmin ? 'Admin' : profile?.job_title || 'Employee'}
                          </span>
                          {isAdmin && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-medium">Admin</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {departments?.find((d: any) => d.id === profile?.department_id)?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {teams?.find((t: any) => t.id === profile?.team_id)?.name || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={member.status} />
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold">
                        {formatPoints(0)}
                      </td>
                      <td className="px-4 py-3 text-right relative">
                        <div className="flex items-center justify-end gap-1">
                          {isInvited && (
                            <button
                              onClick={() => handleStatusChange(member.id, 'pending')}
                              className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors"
                              title="Mark as pending"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setShowActionsMenu(showActionsMenu === member.id ? null : member.id)}
                            className="p-1.5 hover:bg-muted rounded transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {showActionsMenu === member.id && (
                            <div className="absolute right-0 top-full mt-1 z-10 w-48 bg-popover border rounded-md shadow-lg py-1">
                              <button
                                onClick={() => {
                                  handleStatusChange(member.id, 'active');
                                  setShowActionsMenu(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                              >
                                <Check className="w-4 h-4" />
                                Mark Active
                              </button>
                              <button
                                onClick={() => {
                                  handleStatusChange(member.id, 'inactive');
                                  setShowActionsMenu(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                              >
                                <X className="w-4 h-4" />
                                Mark Inactive
                              </button>
                              <div className="border-t my-1" />
                              <button
                                onClick={() => {
                                  handleRoleChange(member.id, 'employee');
                                  setShowActionsMenu(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                              >
                                <UserPlus className="w-4 h-4" />
                                Set as Employee
                              </button>
                              <button
                                onClick={() => {
                                  handleRoleChange(member.id, 'company_admin');
                                  setShowActionsMenu(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                              >
                                <Edit2 className="w-4 h-4" />
                                Set as Admin
                              </button>
                              <button
                                onClick={() => {
                                  handleRoleChange(member.id, 'activity_host');
                                  setShowActionsMenu(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                              >
                                <Users className="w-4 h-4" />
                                Set as Activity Host
                              </button>
                              <div className="border-t my-1" />
                              <button
                                onClick={() => {
                                  handleRemoveEmployee(member.id);
                                  setShowActionsMenu(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-muted text-red-600 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Add Employee</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-muted rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name *</label>
                  <input
                    type="text"
                    value={addForm.first_name}
                    onChange={(e) => setAddForm({ ...addForm, first_name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={addForm.last_name}
                    onChange={(e) => setAddForm({ ...addForm, last_name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Job Title</label>
                <input
                  type="text"
                  value={addForm.job_title}
                  onChange={(e) => setAddForm({ ...addForm, job_title: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Department</label>
                <select
                  value={addForm.department_id}
                  onChange={(e) => setAddForm({ ...addForm, department_id: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">None</option>
                  {departments?.map((dept: any) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Team</label>
                <select
                  value={addForm.team_id}
                  onChange={(e) => setAddForm({ ...addForm, team_id: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">None</option>
                  {teams?.map((team: any) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="employee">Employee</option>
                  <option value="company_admin">Admin</option>
                  <option value="activity_host">Activity Host</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={isAdding} className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 disabled:opacity-50">
                  {isAdding ? 'Adding...' : 'Add Employee'}
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-input rounded-md hover:bg-muted">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Invite Employee</h2>
              <button onClick={() => setShowInviteModal(false)} className="p-2 hover:bg-muted rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleInviteEmployee} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="colleague@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="employee">Employee</option>
                  <option value="company_admin">Admin</option>
                  <option value="activity_host">Activity Host</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Department</label>
                <select
                  value={inviteForm.department_id}
                  onChange={(e) => setInviteForm({ ...inviteForm, department_id: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">None</option>
                  {departments?.map((dept: any) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Team</label>
                <select
                  value={inviteForm.team_id}
                  onChange={(e) => setInviteForm({ ...inviteForm, team_id: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">None</option>
                  {teams?.map((team: any) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={isInviting} className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 disabled:opacity-50">
                  {isInviting ? 'Sending...' : 'Send Invite'}
                </button>
                <button type="button" onClick={() => setShowInviteModal(false)} className="px-4 py-2 border border-input rounded-md hover:bg-muted">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Bulk Upload Employees</h2>
              <button onClick={() => setShowBulkModal(false)} className="p-2 hover:bg-muted rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!bulkFile ? (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-input rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload a CSV file with employee data
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Required columns: first_name, last_name, email
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Optional: job_title, department_name, team_name, role
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleBulkUpload}
                    accept=".csv"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
                  >
                    <Upload className="w-4 h-4" />
                    Choose CSV File
                  </button>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Download Template
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{bulkFile.name}</p>
                    <p className="text-sm text-muted-foreground">{bulkPreview.length} employees found</p>
                  </div>
                  <button
                    onClick={() => {
                      setBulkFile(null);
                      setBulkPreview([]);
                      setBulkErrors([]);
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Change File
                  </button>
                </div>

                {bulkErrors.length > 0 && (
                  <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
                    <p className="text-sm font-medium text-destructive">Import Errors</p>
                    <ul className="mt-2 text-sm text-destructive space-y-1">
                      {bulkErrors.map((err, i) => (
                        <li key={i}>{err.email}: {err.error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="max-h-60 overflow-y-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        {Object.keys(bulkPreview[0] || {}).map((key) => (
                          <th key={key} className="px-3 py-2 text-left font-medium text-muted-foreground">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bulkPreview.slice(0, 10).map((row, i) => (
                        <tr key={i} className="border-t">
                          {Object.values(row).map((val: any, j) => (
                            <td key={j} className="px-3 py-2">{val}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {bulkPreview.length > 10 && (
                    <p className="px-3 py-2 text-sm text-muted-foreground">
                      +{bulkPreview.length - 10} more employees
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleBulkImport}
                    disabled={isImporting || bulkPreview.length === 0}
                    className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isImporting ? 'Importing...' : `Import ${bulkPreview.length} Employees`}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBulkModal(false);
                      setBulkFile(null);
                      setBulkPreview([]);
                      setBulkErrors([]);
                    }}
                    className="px-4 py-2 border border-input rounded-md hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}