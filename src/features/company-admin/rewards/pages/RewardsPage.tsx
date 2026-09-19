// src/features/company-admin/rewards/pages/RewardsPage.tsx

import { useState, useRef } from 'react';
import {
  Gift,
  Plus,
  Trash2,
  Zap,
  Globe,
  Upload,
  Wallet,
  Coins,
  Coffee,
  Shirt,
  Compass,
  GraduationCap,
  Calendar,
  Sparkles,
  Heart,
  X,
  Search,
  LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useOrganization } from '@/app/providers/OrganizationProvider';
import {
  useRewards,
  useCreateReward,
  useUpdateReward,
  useDeleteReward,
  useUpdateRewardStock,
  useUploadRewardImage,
  useRemoveRewardImage,
} from '@/features/company-admin/queries/rewardQueries';
import {
  useOrganizationFunding,
  useDepositFunding,
} from '@/features/company-admin/queries/fundingQueries';
import { rewardSourceService } from '@/features/company-admin/services/rewardSourceService';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';
import { GlobalApiCatalogModal } from '@/features/company-admin/rewards/components/GlobalApiCatalogModal';
import { FundPoolModal } from '@/features/company-admin/rewards/components/FundPoolModal';
import { cn } from '@/lib/utils';
import type {
  Reward,
  RewardCategory,
  RewardStatus,
  ExternalReward,
} from '@/features/company-admin/types/reward.types';

// ─── Constants ────────────────────────────────────────────────────────

const CATEGORY_OPTIONS: { value: RewardCategory; label: string }[] = [
  { value: 'gift_card', label: 'Gift Card' },
  { value: 'merchandise', label: 'Merchandise' },
  { value: 'experience', label: 'Experience' },
  { value: 'training', label: 'Training' },
  { value: 'pto', label: 'PTO' },
  { value: 'company_benefit', label: 'Company Benefit' },
  { value: 'charitable', label: 'Charitable' },
];

const CATEGORY_ICONS: Record<RewardCategory, LucideIcon> = {
  gift_card: Coffee,
  merchandise: Shirt,
  experience: Compass,
  training: GraduationCap,
  pto: Calendar,
  company_benefit: Sparkles,
  charitable: Heart,
};

const SOURCE_OPTIONS = [
  { value: 'manual', label: 'Manual', description: 'Create from scratch' },
  { value: 'tremendous', label: 'Tremendous', description: 'Gift cards & rewards' },
  { value: 'tangocard', label: 'Tango Card', description: 'Digital rewards' },
  { value: 'giftbit', label: 'Giftbit', description: 'Gift cards' },
  { value: 'blackhawk', label: 'BlackHawk', description: 'Gift cards & incentives' },
] as const;

const STATUS_BADGE_LABELS: Record<RewardStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  active: 'Active',
  out_of_stock: 'Out of Stock',
  archived: 'Archived',
};

const STATUS_BADGE_STYLES: Record<RewardStatus, string> = {
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
  published: 'bg-blue-50 text-blue-700 border-blue-200',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  out_of_stock: 'bg-rose-50 text-rose-700 border-rose-200',
  archived: 'bg-slate-100 text-slate-500 border-slate-200',
};

// ─── Page ─────────────────────────────────────────────────────────────

export default function RewardsPage() {
  const { user } = useAuth();
  const { organizationMember } = useOrganization();
  const organizationId = organizationMember?.organization_id || '';

  const { data: rewards, isLoading, refetch } = useRewards(organizationId);
  const { mutate: createReward, isPending: isCreating } = useCreateReward();
  const { mutate: updateReward } = useUpdateReward();
  const { mutate: deleteReward } = useDeleteReward();
  const { mutate: updateStock } = useUpdateRewardStock();
  const { mutate: uploadImage, isPending: isUploading } = useUploadRewardImage();
  const { mutate: removeImage } = useRemoveRewardImage();

  // ─── Funding ────────────────────────────────────────────────────────
  const { data: prepaidBalance = 0 } = useOrganizationFunding(organizationId);
  const { mutateAsync: depositFunds } = useDepositFunding();

  const [isCreatingReward, setIsCreatingReward] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rewardSource, setRewardSource] = useState<
    'manual' | 'tremendous' | 'tangocard' | 'giftbit' | 'blackhawk'
  >('manual');
  const [apiSearchQuery, setApiSearchQuery] = useState('');
  const [apiResults, setApiResults] = useState<ExternalReward[]>([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isFundPoolOpen, setIsFundPoolOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'gift_card' as RewardCategory,
    points_required: 100,
    stock: '',
    image_url: '',
  });

  const handleCreate = () => {
    setFormData({
      title: '',
      description: '',
      category: 'gift_card',
      points_required: 100,
      stock: '',
      image_url: '',
    });
    setRewardSource('manual');
    setApiResults([]);
    setApiSearchQuery('');
    setImagePreview('');
    setImageFile(null);
    setIsCreatingReward(true);
    setEditingId(null);
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleEdit = (reward: Reward) => {
    setFormData({
      title: reward.title,
      description: reward.description,
      category: reward.category,
      points_required: reward.points_required,
      stock: reward.stock?.toString() || '',
      image_url: reward.image_url || '',
    });
    setImagePreview('');
    setImageFile(null);
    setEditingId(reward.id);
    setIsCreatingReward(false);
    setRewardSource(reward.source || 'manual');
    setApiResults([]);
    setApiSearchQuery('');
    setSaveError(null);
    setSaveSuccess(false);
    setTimeout(() => {
      document.getElementById('reward-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleApiSearch = async () => {
    if (!apiSearchQuery.trim()) {
      setSaveError('Please enter a search term');
      return;
    }
    if (rewardSource === 'manual') {
      setSaveError('Please select an API source');
      return;
    }
    setIsSearchingApi(true);
    setSaveError(null);
    try {
      const results = await rewardSourceService.searchAllSources(
        apiSearchQuery,
        rewardSource as 'tremendous' | 'tangocard' | 'giftbit' | 'blackhawk'
      );
      setApiResults(results);
      if (results.length === 0) {
        setSaveError('No rewards found. Try a different search term.');
      }
    } catch (error) {
      console.error('API search error:', error);
      setSaveError('Failed to search. Please try again.');
    } finally {
      setIsSearchingApi(false);
    }
  };

  const handleImportApiResult = (result: ExternalReward) => {
    setFormData({
      ...formData,
      title: result.title,
      description: result.description,
      category: result.category,
      image_url: result.image_url || '',
      points_required: Math.round((result.retail_price || 10) * 10),
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    setApiResults([]);
    setApiSearchQuery('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = () => {
    if (!imageFile) {
      setSaveError('No image selected');
      return;
    }
    const rewardId = editingId;
    if (!rewardId) {
      setSaveError('Please save the reward first, then upload an image');
      return;
    }
    setSaveError(null);
    uploadImage(
      { rewardId, file: imageFile },
      {
        onSuccess: (result) => {
          if (result) {
            setImagePreview('');
            setImageFile(null);
            setFormData((prev) => ({ ...prev, image_url: result }));
            refetch();
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
          }
        },
        onError: () => setSaveError('Failed to upload image'),
      }
    );
  };

  const handleRemoveImage = async () => {
    if (!editingId) return;
    removeImage(editingId, {
      onSuccess: () => {
        setFormData({ ...formData, image_url: '' });
        refetch();
      },
      onError: () => setSaveError('Failed to remove image'),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    const submitData = {
      organization_id: organizationId,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      points_required: formData.points_required,
      image_url: formData.image_url || undefined,
      stock: formData.stock ? parseInt(formData.stock) : undefined,
      source: rewardSource,
      status: 'active' as RewardStatus,
      created_by: user.id,
    };

    if (editingId) {
      const existingReward = rewards?.find((r) => r.id === editingId);
      updateReward(
        {
          id: editingId,
          data: { ...submitData, status: existingReward?.status || 'draft' },
        },
        {
          onSuccess: () => {
            setEditingId(null);
            setIsCreatingReward(false);
            refetch();
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
          },
          onError: () => setSaveError('Failed to update reward'),
        }
      );
    } else {
      createReward(submitData, {
        onSuccess: (newReward) => {
          setIsCreatingReward(false);
          refetch();
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
          if (imageFile && newReward) {
            uploadImage({ rewardId: newReward.id, file: imageFile });
          }
        },
        onError: () => setSaveError('Failed to create reward'),
      });
    }
  };

  const handleStatusChange = (id: string, status: RewardStatus) => {
    const reward = rewards?.find((r) => r.id === id);
    if (!reward) return;
    updateReward(
      { id, data: { ...reward, status } },
      {
        onSuccess: () => refetch(),
        onError: () => setSaveError('Failed to update status'),
      }
    );
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this reward?')) {
      deleteReward(id, { onSuccess: () => refetch() });
    }
  };

  const handleStockUpdate = (id: string, stock: number) => {
    updateStock({ id, stock }, { onSuccess: () => refetch() });
  };

  const handleCancel = () => {
    setIsCreatingReward(false);
    setEditingId(null);
    setImagePreview('');
    setImageFile(null);
    setApiResults([]);
    setApiSearchQuery('');
    setSaveError(null);
    setSaveSuccess(false);
  };

  if (isLoading) return <LoadingScreen />;

  const totalRewards = rewards?.length || 0;

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Hero Panel ─────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 px-8 py-7 text-white shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-300 ring-1 ring-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Instant Digital E-Vouchers Active
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white/70 ring-1 ring-white/10">
                Sandbox Mode
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-200 ring-1 ring-indigo-400/30">
                <Zap className="h-3 w-3" />
                Auto-Issue Active
              </span>
            </div>

            <h1 className="mt-4 flex items-center gap-2 text-2xl font-extrabold tracking-tight">
              <Zap className="h-6 w-6 text-amber-300" />
              Automated Rewards Platform Sync
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
              Digital e-gift vouchers and rewards are automatically imported and
              issued instantly upon employee points redemption.
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                  Prepaid Funding Balance
                </p>
                <p className="mt-1 text-2xl font-extrabold tracking-tight text-emerald-300">
                  ${prepaidBalance.toFixed(2)}{' '}
                  <span className="text-sm font-semibold text-emerald-400">USD</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFundPoolOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-emerald-600"
              >
                <Wallet className="h-4 w-4" />
                Fund Pool
              </button>
            </div>
            <button
              type="button"
              onClick={() => setIsCatalogOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-indigo-700"
            >
              <Globe className="h-4 w-4" />
              Global API Catalog
            </button>
          </div>
        </div>
      </div>

      {/* ─── Section header + actions ───────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold uppercase tracking-wider text-slate-900">
              Active Reward Catalog
            </h2>
            <p className="text-sm text-slate-500">
              Currently listed rewards in the employee store for team points redemption.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCatalogOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 transition-colors hover:bg-slate-200"
          >
            <Upload className="h-3.5 w-3.5" />
            Import Gift Cards
          </button>
          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Custom Reward
          </button>
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
            <span className="text-indigo-600">{totalRewards}</span>
            <span className="text-slate-400">Items Listed</span>
          </span>
        </div>
      </div>

      {/* ─── Success / Error banners ────────────────────────────── */}
      {saveSuccess && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700">
          ✅ Reward saved successfully!
        </div>
      )}
      {saveError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700">
          {saveError}
        </div>
      )}

      {/* ─── Inline form (create / edit) ────────────────────────── */}
      {(isCreatingReward || editingId) && (
        <div
          id="reward-form"
          className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-indigo-900 to-indigo-800 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20">
                <Gift className="h-5 w-5 text-indigo-200" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingId ? 'Edit Reward' : 'Create New Reward'}
                </h3>
                <p className="mt-0.5 text-xs text-indigo-300">
                  {editingId
                    ? 'Update the details below'
                    : 'New rewards start as Draft until published'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="text-indigo-300 transition-colors hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
            {/* Left column */}
            <div className="space-y-4 lg:col-span-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Reward Title <span className="text-rose-500">*</span>
                </label>
                <input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., $10 Coffee Voucher"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell employees what they get and how to redeem it..."
                  className="min-h-[90px] w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as RewardCategory })
                    }
                    className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Points Required <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.points_required}
                    onChange={(e) =>
                      setFormData({ ...formData, points_required: parseInt(e.target.value) || 0 })
                    }
                    min={1}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Stock <span className="text-xs font-normal text-slate-400">(blank = unlimited)</span>
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    min={0}
                    placeholder="Unlimited"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Source selector */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Reward Source
                </label>
                <div className="flex flex-wrap gap-2">
                  {SOURCE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRewardSource(opt.value)}
                      className={cn(
                        'rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-all',
                        rewardSource === opt.value
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      )}
                    >
                      <div>{opt.label}</div>
                      <div className="mt-0.5 text-[10px] font-normal opacity-70">
                        {opt.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {rewardSource !== 'manual' && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Search {rewardSource} catalog
                  </p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={apiSearchQuery}
                        onChange={(e) => setApiSearchQuery(e.target.value)}
                        placeholder="e.g., Amazon, Starbucks, Nike..."
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApiSearch}
                      disabled={isSearchingApi}
                      className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                      {isSearchingApi ? 'Searching…' : 'Search'}
                    </button>
                  </div>
                  {apiResults.length > 0 && (
                    <div className="mt-3 max-h-48 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2">
                      {apiResults.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => handleImportApiResult(r)}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs hover:bg-slate-50"
                        >
                          <span className="font-semibold text-slate-800">{r.title}</span>
                          <span className="text-slate-500">
                            ${r.retail_price?.toFixed(2) ?? '—'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right column — image */}
            <div className="space-y-4 lg:col-span-1">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Reward Image
                </label>

                {imagePreview ? (
                  <div className="relative mb-3">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-40 w-full rounded-xl object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview('');
                        setImageFile(null);
                      }}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-xs text-white hover:bg-rose-600"
                    >
                      ×
                    </button>
                  </div>
                ) : formData.image_url ? (
                  <div className="relative mb-3">
                    <img
                      src={formData.image_url}
                      alt="Current"
                      className="h-40 w-full rounded-xl object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-xs text-white hover:bg-rose-600"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="mb-3 flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white text-xs text-slate-400">
                    No image selected
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  {imagePreview || formData.image_url ? 'Change Image' : 'Choose Image'}
                </button>

                {imagePreview && editingId && (
                  <button
                    type="button"
                    onClick={handleImageUpload}
                    disabled={isUploading}
                    className="mt-2 w-full rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isUploading ? 'Uploading…' : 'Upload to Reward'}
                  </button>
                )}

                <p className="mt-2 text-[10px] text-slate-400">
                  Max 5MB · JPG, PNG, GIF, WEBP
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 lg:col-span-3">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {isCreating ? 'Saving…' : editingId ? 'Update Reward' : 'Create Reward'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Reward grid ────────────────────────────────────────── */}
      {totalRewards === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center">
          <Gift className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-lg font-bold text-slate-800">No rewards yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Create your first reward to start rewarding employees.
          </p>
          <button
            type="button"
            onClick={handleCreate}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Add Custom Reward
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {rewards?.map((reward: Reward) => {
            const CategoryIcon = CATEGORY_ICONS[reward.category] || Gift;
            const categoryLabel =
              CATEGORY_OPTIONS.find((c) => c.value === reward.category)?.label ||
              reward.category;
            const hasImage = !!reward.image_url;

            return (
              <div
                key={reward.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative h-44 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                  {hasImage ? (
                    <img
                      src={reward.image_url!}
                      alt={reward.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <CategoryIcon className="h-16 w-16 text-slate-300" />
                    </div>
                  )}

                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                    <Coins className="h-3 w-3" />
                    {reward.points_required} PTS
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                      <CategoryIcon className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          'rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                          STATUS_BADGE_STYLES[reward.status]
                        )}
                      >
                        {STATUS_BADGE_LABELS[reward.status]}
                      </span>
                      <select
                        value={reward.status}
                        onChange={(e) =>
                          handleStatusChange(reward.id, e.target.value as RewardStatus)
                        }
                        className="cursor-pointer rounded-lg border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        title="Change status"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="active">Active</option>
                        <option value="out_of_stock">Out of Stock</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">
                      {categoryLabel}
                    </p>
                    <h3 className="mt-1 line-clamp-1 text-base font-bold text-slate-900">
                      {reward.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                      {reward.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-100">
                      STOCK: {reward.stock !== null ? reward.stock : '∞'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          handleStockUpdate(reward.id, (reward.stock || 0) + 5)
                        }
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-slate-800"
                      >
                        +5 Stock
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEdit(reward)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(reward.id)}
                        className="rounded-lg border border-rose-200 bg-white p-1.5 text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-700"
                        title="Delete reward"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Modals ─────────────────────────────────────────────── */}
      <GlobalApiCatalogModal
        open={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        onImport={(ids) => console.log('Imported ids:', ids)}
      />
      <FundPoolModal
        open={isFundPoolOpen}
        onClose={() => setIsFundPoolOpen(false)}
        currentBalance={prepaidBalance}
        onConfirm={async (amount, method) => {
          await depositFunds({ organizationId, amount });
          console.log('Deposit recorded:', amount, method);
        }}
      />
    </div>
  );
}