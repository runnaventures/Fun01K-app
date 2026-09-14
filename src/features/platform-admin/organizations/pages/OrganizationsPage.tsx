// src/features/platform-admin/organizations/pages/OrganizationsPage.tsx

import { useState, useRef } from 'react';
import {
  useOrganizations,
  useUpdateOrganization,
} from '@/features/platform-admin/organizations/queries/organizationQueries';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';
import { Search, Trash2, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type PlanTier = 'all' | 'enterprise' | 'growth' | 'starter';
type StatusFilter = 'all' | 'active' | 'trial' | 'suspended';

export default function OrganizationsPage() {
  const { data: organizations, isLoading, refetch } = useOrganizations();
  const { mutate: updateOrganization, isPending: isUpdating } =
    useUpdateOrganization();

  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState<PlanTier>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const [editingOrg, setEditingOrg] = useState<string | null>(null);
  const editFormRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    website: '',
    industry: '',
    size: '',
    subscription_plan: 'starter' as 'starter' | 'growth' | 'enterprise',
    monthly_points_allowance: 5000,
    contact_email: '',
  });

  const handleEdit = (org: any) => {
    setFormData({
      name: org.name,
      slug: org.slug,
      website: org.website || '',
      industry: org.industry || '',
      size: org.size?.toString() || '',
      subscription_plan: org.subscription_plan || 'starter',
      monthly_points_allowance: org.monthly_points_allowance || 5000,
      contact_email: org.contact_email || '',
    });
    setEditingOrg(org.id);

    // Scroll to the form after React renders it
    setTimeout(() => {
      editFormRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      // Focus the first input after the scroll starts
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 350);
    }, 50);
  };

  const handleCancel = () => setEditingOrg(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg) return;

    let website = formData.website.trim();
    if (website && !/^https?:\/\//i.test(website)) {
      website = `https://${website}`;
    }

    updateOrganization(
      {
        id: editingOrg,
        data: {
          name: formData.name,
          industry: formData.industry || null,
          size: formData.size ? parseInt(formData.size) : null,
          website: website || null,
          subscription_plan: formData.subscription_plan,
          monthly_points_allowance: formData.monthly_points_allowance,
          contact_email: formData.contact_email || null,
        },
      },
      {
        onSuccess: () => {
          handleCancel();
          refetch();
        },
      }
    );
  };

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `Delete "${name}"? This cannot be undone and will remove all associated data.`
      )
    )
      return;
    const { organizationService } = await import(
      '@/features/platform-admin/organizations/services/organizationService'
    );
    const ok = await organizationService.deleteOrganization(id);
    if (ok) refetch();
  };

  const filtered = (organizations || []).filter((org: any) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      !search ||
      org.name?.toLowerCase().includes(search) ||
      org.slug?.toLowerCase().includes(search) ||
      org.company_code?.toLowerCase().includes(search) ||
      org.contact_email?.toLowerCase().includes(search);

    const matchesPlan =
      planFilter === 'all' || org.subscription_plan === planFilter;

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && org.status === 'active') ||
      (statusFilter === 'trial' && org.status === 'inactive') ||
      (statusFilter === 'suspended' && org.status === 'suspended');

    return matchesSearch && matchesPlan && matchesStatus;
  });

  if (isLoading) return <LoadingScreen />;

  const planBadge = (plan: string | null | undefined) => {
    switch (plan) {
      case 'enterprise':
        return 'border-purple-200 bg-purple-50 text-purple-700';
      case 'growth':
        return 'border-blue-200 bg-blue-50 text-blue-700';
      case 'starter':
        return 'border-slate-200 bg-slate-50 text-slate-600';
      default:
        return 'border-slate-200 bg-slate-50 text-slate-600';
    }
  };

  const planLabel = (plan: string | null | undefined) => {
    if (!plan) return 'Starter Tier';
    return plan.charAt(0).toUpperCase() + plan.slice(1) + ' Tier';
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'inactive':
        return 'border-amber-200 bg-amber-50 text-amber-700';
      case 'suspended':
        return 'border-rose-200 bg-rose-50 text-rose-700';
      default:
        return 'border-slate-200 bg-slate-50 text-slate-600';
    }
  };

  const statusLabel = (status: string) => {
    if (status === 'inactive') return 'Trial';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const initials = (name: string) =>
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
        <p className="text-muted-foreground">
          Manage all organizations on the platform
        </p>
      </div>

      {/* Filters card */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[260px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tenant companies by name or ID (e.g., Acme, ACME-1024)..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm focus:border-slate-400 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Plan Tier:
            </span>
            {(['all', 'enterprise', 'growth', 'starter'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPlanFilter(p)}
                className={cn(
                  'rounded-xl px-3 py-1.5 text-xs font-semibold transition-all',
                  planFilter === p
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Status:
            </span>
            {(['all', 'active', 'trial', 'suspended'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'rounded-xl px-3 py-1.5 text-xs font-semibold transition-all',
                  statusFilter === s
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Edit form — auto-scrolls into view when opened */}
      {editingOrg && (
        <div
          ref={editFormRef}
          className="scroll-mt-6 rounded-2xl border-2 border-indigo-200 bg-white p-6 shadow-lg ring-4 ring-indigo-100/50"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">
              Edit Organization
            </h2>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close edit form"
            >
              <span className="text-xl leading-none">&times;</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Organization Name *
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_email: e.target.value })
                  }
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Subscription Plan
                </label>
                <select
                  value={formData.subscription_plan}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      subscription_plan: e.target.value as any,
                    })
                  }
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Monthly Points Allowance
                </label>
                <input
                  type="number"
                  value={formData.monthly_points_allowance}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      monthly_points_allowance: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Website</label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && !/^https?:\/\//i.test(v)) {
                      setFormData({ ...formData, website: `https://${v}` });
                    }
                  }}
                  placeholder="https://acme.com"
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Industry</label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) =>
                    setFormData({ ...formData, industry: e.target.value })
                  }
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isUpdating}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Company Tenant &amp; ID
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Subscription Plan
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Platform Seats
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Monthly Points Allowance
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Joined Date
                </th>
                <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    <Building2 className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    No organizations found
                  </td>
                </tr>
              ) : (
                filtered.map((org: any) => {
                  const isEditingThisRow = editingOrg === org.id;
                  return (
                    <tr
                      key={org.id}
                      className={cn(
                        'border-b border-slate-100 transition-colors',
                        isEditingThisRow
                          ? 'bg-indigo-50/50'
                          : 'hover:bg-slate-50/50'
                      )}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {org.logo_url ? (
                            <img
                              src={org.logo_url}
                              alt={org.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                              {initials(org.name)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {org.name}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {org.company_code || '—'}{' '}
                              {org.contact_email && (
                                <>
                                  <span className="mx-1">•</span>
                                  {org.contact_email}
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold',
                            planBadge(org.subscription_plan)
                          )}
                        >
                          {planLabel(org.subscription_plan)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-800">
                          {org.members_count ?? 0}
                        </span>
                        <span className="ml-1 text-sm text-slate-500">
                          {org.members_count === 1 ? 'Employee' : 'Employees'}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-amber-600">
                          {(org.monthly_points_allowance ?? 0).toLocaleString()}
                        </span>
                        <span className="ml-1 text-sm text-slate-500">
                          PTS / mo
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
                            statusBadge(org.status)
                          )}
                        >
                          <span
                            className={cn(
                              'h-1.5 w-1.5 rounded-full',
                              org.status === 'active' && 'bg-emerald-500',
                              org.status === 'inactive' && 'bg-amber-500',
                              org.status === 'suspended' && 'bg-rose-500'
                            )}
                          />
                          {statusLabel(org.status)}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {org.created_at
                          ? new Date(org.created_at)
                              .toISOString()
                              .split('T')[0]
                          : '—'}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(org)}
                            className={cn(
                              'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
                              isEditingThisRow
                                ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                            )}
                          >
                            {isEditingThisRow ? 'Editing...' : 'Edit Settings'}
                          </button>
                          <button
                            onClick={() => handleDelete(org.id, org.name)}
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                            title="Delete organization"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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
    </div>
  );
}