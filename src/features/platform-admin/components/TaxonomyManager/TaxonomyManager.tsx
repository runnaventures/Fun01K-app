// src/features/platform-admin/components/TaxonomyManager/TaxonomyManager.tsx

import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import {
  useInterestsWithSubs,
  useCreateInterest,
  useUpdateInterest,
  useDeleteInterest,
  useCreateSubInterest,
  useUpdateSubInterest,
  useDeleteSubInterest,
} from '../../queries/taxonomyQueries';
import type { Interest, SubInterest } from '../../services/taxonomyService';

/* ─── Helpers ─── */

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/* ═══════════════════════════════════════════════════════════════════════ */

export function TaxonomyManager() {
  const { data: interests, isLoading, error } = useInterestsWithSubs();

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNewInterest, setShowNewInterest] = useState(false);
  const [editingInterest, setEditingInterest] = useState<Interest | null>(null);
  const [addingSubFor, setAddingSubFor] = useState<string | null>(null);
  const [editingSub, setEditingSub] = useState<SubInterest | null>(null);

  const toggle = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  if (isLoading) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        Loading taxonomy…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-sm text-rose-600">
        Failed to load taxonomy
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            Interests &amp; Sub-Interests
          </h2>
          <p className="text-sm text-slate-500">
            These appear in activity forms and signup. Platform-wide.
          </p>
        </div>
        <Button
          onClick={() => {
            setShowNewInterest(true);
            setEditingInterest(null);
          }}
          className="flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Add Interest
        </Button>
      </div>

      {/* Create / Edit interest form */}
      {(showNewInterest || editingInterest) && (
        <InterestForm
          initial={editingInterest}
          onClose={() => {
            setShowNewInterest(false);
            setEditingInterest(null);
          }}
        />
      )}

      {/* Empty state */}
      {(interests || []).length === 0 && (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-slate-500">
          No interests yet. Click "Add Interest" to create one.
        </div>
      )}

      {/* Interests list */}
      <div className="space-y-2">
        {(interests || []).map((interest) => {
          const isOpen = expanded[interest.id];
          const subs = interest.sub_interests || [];

          return (
            <div
              key={interest.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              {/* Interest row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => toggle(interest.id)}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-500 hover:bg-slate-100"
                >
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

                <span className="text-xl">{interest.icon || '📌'}</span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">
                    {interest.name}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {interest.slug} · {subs.length}{' '}
                    {subs.length === 1 ? 'sub-interest' : 'sub-interests'}
                    {interest.is_active === false && ' · inactive'}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => {
                      setAddingSubFor(interest.id);
                      setExpanded((p) => ({ ...p, [interest.id]: true }));
                    }}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    title="Add sub-interest"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEditingInterest(interest)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <DeleteInterestButton interest={interest} />
                </div>
              </div>

              {/* Sub-interests */}
              {isOpen && (
                <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3">
                  {/* Add sub-interest inline form */}
                  {addingSubFor === interest.id && (
                    <SubInterestForm
                      interestId={interest.id}
                      onClose={() => setAddingSubFor(null)}
                    />
                  )}

                  {/* Sub-interest rows */}
                  {subs.length === 0 && addingSubFor !== interest.id ? (
                    <p className="text-xs text-slate-500">
                      No sub-interests yet.{' '}
                      <button
                        onClick={() => setAddingSubFor(interest.id)}
                        className="text-indigo-600 hover:underline"
                      >
                        Add one
                      </button>
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {subs.map((sub) =>
                        editingSub?.id === sub.id ? (
                          <SubInterestForm
                            key={sub.id}
                            interestId={interest.id}
                            initial={sub}
                            onClose={() => setEditingSub(null)}
                          />
                        ) : (
                          <div
                            key={sub.id}
                            className="flex items-center gap-3 rounded-lg bg-white px-3 py-2"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-slate-700">
                                {sub.name}
                              </p>
                              <p className="truncate text-xs text-slate-400">
                                {sub.slug}
                              </p>
                            </div>
                            <button
                              onClick={() => setEditingSub(sub)}
                              className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <DeleteSubButton sub={sub} />
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Interest form
   ═══════════════════════════════════════════════════════════════════════ */

function InterestForm({
  initial,
  onClose,
}: {
  initial: Interest | null;
  onClose: () => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    name: initial?.name || '',
    slug: initial?.slug || '',
    icon: initial?.icon || '',
    color: initial?.color || '',
    description: initial?.description || '',
    sort_order: initial?.sort_order ?? 0,
    is_active: initial?.is_active ?? true,
  });
  const [error, setError] = useState<string | null>(null);

  const createMutation = useCreateInterest();
  const updateMutation = useUpdateInterest();

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: isEdit && prev.slug ? prev.slug : slugify(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.slug.trim()) {
      setError('Name and slug are required');
      return;
    }

    try {
      if (isEdit && initial) {
        await updateMutation.mutateAsync({ id: initial.id, data: form });
      } else {
        await createMutation.mutateAsync(form);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    }
  };

  const busy = createMutation.isPending || updateMutation.isPending;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800">
          {isEdit ? 'Edit interest' : 'New interest'}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            Name *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Sports"
            required
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            Slug *
          </label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) =>
              setForm({ ...form, slug: slugify(e.target.value) })
            }
            placeholder="sports"
            required
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            Icon (emoji)
          </label>
          <input
            type="text"
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
            placeholder="⚽"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            Color (hex)
          </label>
          <input
            type="text"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            placeholder="#3b82f6"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            Description
          </label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Short description"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            Sort order
          </label>
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) =>
              setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })
            }
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm({ ...form, is_active: e.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300"
            />
            Active
          </label>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={busy}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create interest'}
        </Button>
      </div>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Sub-interest form
   ═══════════════════════════════════════════════════════════════════════ */

function SubInterestForm({
  interestId,
  initial,
  onClose,
}: {
  interestId: string;
  initial?: SubInterest;
  onClose: () => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    name: initial?.name || '',
    slug: initial?.slug || '',
    description: initial?.description || '',
    sort_order: initial?.sort_order ?? 0,
    is_active: initial?.is_active ?? true,
  });
  const [error, setError] = useState<string | null>(null);

  const createMutation = useCreateSubInterest();
  const updateMutation = useUpdateSubInterest();

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: isEdit && prev.slug ? prev.slug : slugify(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.slug.trim()) {
      setError('Name is required');
      return;
    }

    try {
      if (isEdit && initial) {
        await updateMutation.mutateAsync({ id: initial.id, data: form });
      } else {
        await createMutation.mutateAsync({ interest_id: interestId, ...form });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    }
  };

  const busy = createMutation.isPending || updateMutation.isPending;

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3"
    >
      {error && (
        <p className="mb-2 text-xs text-rose-700">{error}</p>
      )}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <input
          type="text"
          value={form.name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Football"
          autoFocus
          required
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <input
          type="text"
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
          placeholder="football"
          required
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <div className="flex gap-2">
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) =>
              setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })
            }
            placeholder="0"
            className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy}
            className="flex-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {busy ? '…' : isEdit ? 'Save' : 'Add'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Delete buttons
   ═══════════════════════════════════════════════════════════════════════ */

function DeleteInterestButton({ interest }: { interest: Interest }) {
  const del = useDeleteInterest();
  const subs = interest.sub_interests || [];

  const handle = () => {
    const msg =
      subs.length > 0
        ? `Delete "${interest.name}"? This will also delete its ${subs.length} sub-interests and untag any activities using them.`
        : `Delete "${interest.name}"?`;
    if (!confirm(msg)) return;
    del.mutate(interest.id);
  };

  return (
    <button
      onClick={handle}
      disabled={del.isPending}
      className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
      title="Delete"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

function DeleteSubButton({ sub }: { sub: SubInterest }) {
  const del = useDeleteSubInterest();

  const handle = () => {
    if (!confirm(`Delete "${sub.name}"?`)) return;
    del.mutate(sub.id);
  };

  return (
    <button
      onClick={handle}
      disabled={del.isPending}
      className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
      title="Delete"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}