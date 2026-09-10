import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganizations, useCreateOrganization, useUpdateOrganization } from '@/features/platform-admin/organizations/queries/organizationQueries';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';

export default function OrganizationsPage() {
  const navigate = useNavigate();
  const { data: organizations, isLoading, refetch } = useOrganizations();
  const { mutate: createOrganization, isPending: isCreating } = useCreateOrganization();
  const { mutate: updateOrganization } = useUpdateOrganization();

  // Get initial state from localStorage or URL params
  const getInitialState = () => {
    const saved = sessionStorage.getItem('orgFormData');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.timestamp && Date.now() - parsed.timestamp < 3600000) {
          return {
            isCreating: parsed.isCreating || false,
            editingOrg: parsed.editingOrg || null,
            formData: parsed.formData || {
              name: '',
              slug: '',
              website: '',
              industry: '',
              size: '',
            }
          };
        }
      } catch (e) {
        console.error('Error loading saved form data:', e);
      }
    }
    return {
      isCreating: false,
      editingOrg: null,
      formData: {
        name: '',
        slug: '',
        website: '',
        industry: '',
        size: '',
      }
    };
  };

  const [isCreatingOrg, setIsCreatingOrg] = useState(() => getInitialState().isCreating);
  const [editingOrg, setEditingOrg] = useState<string | null>(() => getInitialState().editingOrg);
  const [formData, setFormData] = useState(() => getInitialState().formData);

  // Save form state to sessionStorage (not localStorage)
  useEffect(() => {
    if (isCreatingOrg || editingOrg) {
      sessionStorage.setItem('orgFormData', JSON.stringify({
        isCreating: isCreatingOrg,
        editingOrg: editingOrg,
        formData: formData,
        timestamp: Date.now()
      }));
    } else {
      sessionStorage.removeItem('orgFormData');
    }
  }, [isCreatingOrg, editingOrg, formData]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isCreatingOrg || editingOrg) {
        sessionStorage.setItem('orgFormData', JSON.stringify({
          isCreating: isCreatingOrg,
          editingOrg: editingOrg,
          formData: formData,
          timestamp: Date.now()
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isCreatingOrg, editingOrg, formData]);

  // Prevent browser navigation confirmation if form has unsaved changes
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (isCreatingOrg || editingOrg) {
        if (!window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
          // Prevent navigation by pushing the current state back
          window.history.pushState(null, '', window.location.pathname);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isCreatingOrg, editingOrg]);

  const handleCreate = () => {
    setFormData({
      name: '',
      slug: '',
      website: '',
      industry: '',
      size: '',
    });
    setIsCreatingOrg(true);
    setEditingOrg(null);
    // Push state to prevent accidental navigation
    window.history.pushState(null, '', window.location.pathname);
  };

  const handleEdit = (org: any) => {
    setFormData({
      name: org.name,
      slug: org.slug,
      website: org.website || '',
      industry: org.industry || '',
      size: org.size?.toString() || '',
    });
    setEditingOrg(org.id);
    setIsCreatingOrg(false);
    window.history.pushState(null, '', window.location.pathname);
  };

  const handleCancel = () => {
    setIsCreatingOrg(false);
    setEditingOrg(null);
    sessionStorage.removeItem('orgFormData');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData: {
      name: string;
      slug: string;
      website?: string;
      industry?: string;
      size?: number;
    } = {
      name: formData.name,
      slug: formData.slug,
    };

    if (formData.website) {
      submitData.website = formData.website;
    }
    if (formData.industry) {
      submitData.industry = formData.industry;
    }
    if (formData.size) {
      submitData.size = parseInt(formData.size);
    }

    if (editingOrg) {
      updateOrganization({
        id: editingOrg,
        data: submitData,
      }, {
        onSuccess: () => {
          handleCancel();
          refetch();
        },
      });
    } else {
      createOrganization(submitData, {
        onSuccess: () => {
          handleCancel();
          refetch();
        },
      });
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">
            Manage all organizations on the platform
          </p>
        </div>
        {!isCreatingOrg && !editingOrg && (
          <button
            onClick={handleCreate}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Create Organization
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {(isCreatingOrg || editingOrg) && (
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">
            {editingOrg ? 'Edit Organization' : 'Create Organization'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">Organization Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Acme Inc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  required
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="acme-inc"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="https://acme.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Industry</label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Technology"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Company Size</label>
                <input
                  type="number"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="50"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isCreating}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isCreating ? 'Saving...' : editingOrg ? 'Update' : 'Create'}
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

      {/* Organizations List */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Slug</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Industry</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Size</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Members</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {organizations?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No organizations found
                  </td>
                </tr>
              ) : (
                organizations?.map((org) => (
                  <tr key={org.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium">{org.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{org.slug}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{org.industry || '-'}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{org.size || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        org.status === 'active' ? 'bg-green-500/10 text-green-600' :
                        org.status === 'inactive' ? 'bg-yellow-500/10 text-yellow-600' :
                        'bg-red-500/10 text-red-600'
                      }`}>
                        {org.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">0</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleEdit(org)}
                        className="text-sm text-primary hover:underline"
                      >
                        Edit
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