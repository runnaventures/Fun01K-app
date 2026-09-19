// src/features/platform-admin/components/RewardsManager/RewardsManager.tsx

import { useState, useEffect, useRef } from 'react';
import {
  Gift,
  Plus,
  Trash2,
  Globe,
  Wallet,
  Coffee,
  Shirt,
  Compass,
  GraduationCap,
  Calendar,
  Sparkles,
  Heart,
  X,
  Search,
  Settings,
  Check,
  ChevronDown,
  KeyRound,
  Link2,
  Plug,
  LucideIcon,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/providers/AuthProvider';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';
import { FundPoolModal } from '@/features/company-admin/rewards/components/FundPoolModal';
import { GlobalApiCatalogModal } from '@/features/company-admin/rewards/components/GlobalApiCatalogModal';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────

type ProviderKey =
  | 'Digital Vouchers'
  | 'Brand Catalog'
  | 'Corporate Gateway'
  | 'Custom Internal';

type RewardCategorySlug =
  | 'gift_card'
  | 'merchandise'
  | 'experience'
  | 'training'
  | 'pto'
  | 'company_benefit'
  | 'charitable';

interface Reward {
  id: string;
  title: string;
  description: string;
  points_required: number;
  category: RewardCategorySlug | string;
  stock: number | null;
  image_url: string | null;
  status: string;
  source: string;
  organization_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface RewardsIntegrationConfig {
  activeProvider: ProviderKey;
  apiKey: string;
  environment: 'production' | 'sandbox';
  webhookUrl: string;
  autoFulfillDigitalCards: boolean;
  prepaidAccountBalance: number;
  connectedAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────

const PROVIDER_OPTIONS: {
  key: ProviderKey;
  label: string;
  sub: string;
  testLabel: string;
}[] = [
  {
    key: 'Digital Vouchers',
    label: 'Digital Vouchers API',
    sub: 'Global Digital Vouchers',
    testLabel: 'Test Digital Vouchers API Ping',
  },
  {
    key: 'Brand Catalog',
    label: 'Direct Brand Catalog API',
    sub: 'Brand Gift Cards',
    testLabel: 'Test Brand Catalog Ping',
  },
  {
    key: 'Corporate Gateway',
    label: 'Enterprise Corporate Gateway',
    sub: 'Global Direct Vouchers',
    testLabel: 'Test Corporate Gateway Ping',
  },
  {
    key: 'Custom Internal',
    label: 'Custom Internal Fulfillment',
    sub: 'Internal Company Perks',
    testLabel: 'Test Internal Fulfillment Ping',
  },
];

const CATEGORY_OPTIONS: { value: RewardCategorySlug; label: string }[] = [
  { value: 'gift_card', label: 'Gift Card' },
  { value: 'merchandise', label: 'Merchandise' },
  { value: 'experience', label: 'Experience' },
  { value: 'training', label: 'Training' },
  { value: 'pto', label: 'PTO' },
  { value: 'company_benefit', label: 'Company Benefit' },
  { value: 'charitable', label: 'Charitable' },
];

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  gift_card: Coffee,
  merchandise: Shirt,
  experience: Compass,
  training: GraduationCap,
  pto: Calendar,
  company_benefit: Sparkles,
  charitable: Heart,
};

const DEFAULT_CONFIG: RewardsIntegrationConfig = {
  activeProvider: 'Digital Vouchers',
  apiKey: '',
  environment: 'sandbox',
  webhookUrl: 'https://api.app.com/webhooks/digitalcards',
  autoFulfillDigitalCards: true,
  prepaidAccountBalance: 0,
  connectedAt: new Date().toISOString(),
};

// ─── Component ────────────────────────────────────────────────────────

export function RewardsManager() {
  const { user } = useAuth();

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All Categories');

  const [config, setConfig] = useState<RewardsIntegrationConfig>(() => {
    try {
      const saved = localStorage.getItem('rewardsConfig');
      return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isFundPoolOpen, setIsFundPoolOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'gift_card' as RewardCategorySlug,
    points_required: 100,
    stock: 10,
  });

  useEffect(() => {
    localStorage.setItem('rewardsConfig', JSON.stringify(config));
  }, [config]);

  const fetchRewards = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .is('organization_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRewards((data || []) as Reward[]);
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const updateConfig = (patch: Partial<RewardsIntegrationConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  };

  const handleFundPool = (amount: number) => {
    setConfig((prev) => ({
      ...prev,
      prepaidAccountBalance: prev.prepaidAccountBalance + amount,
    }));
  };

  const handlePing = () => {
    updateConfig({ connectedAt: new Date().toISOString() });
  };

  const handleCreateReset = () => {
    setFormData({
      title: '',
      description: '',
      category: 'gift_card',
      points_required: 100,
      stock: 10,
    });
    setImageFile(null);
    setImagePreview('');
    setSaveError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      const payload: Record<string, any> = {
        title: formData.title.trim(),
        description: formData.description.trim() || '',
        category: formData.category,
        points_required: formData.points_required,
        stock: formData.stock,
        organization_id: null,
        status: 'draft',
        source: 'manual',
        created_by: user.id,
        image_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: created, error } = await supabase
        .from('rewards')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      if (imageFile && created) {
        const ext = imageFile.name.split('.').pop();
        const path = `rewards/${created.id}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('reward-images')
          .upload(path, imageFile, { contentType: imageFile.type, upsert: false });
        if (!upErr) {
          const { data: urlData } = supabase.storage
            .from('reward-images')
            .getPublicUrl(path);
          if (urlData?.publicUrl) {
            await supabase
              .from('rewards')
              .update({ image_url: urlData.publicUrl })
              .eq('id', created.id);
          }
        }
      }

      setIsCreateOpen(false);
      handleCreateReset();
      fetchRewards();
    } catch (err: any) {
      console.error('Error creating reward:', err);
      setSaveError(err.message || 'Failed to create reward');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this reward?')) return;
    try {
      const { error } = await supabase.from('rewards').delete().eq('id', id);
      if (error) throw error;
      fetchRewards();
    } catch (err) {
      console.error('Error deleting reward:', err);
    }
  };

  const handleAddStock = async (reward: Reward, amount: number = 25) => {
    try {
      const { error } = await supabase
        .from('rewards')
        .update({ stock: (reward.stock || 0) + amount })
        .eq('id', reward.id);
      if (error) throw error;
      fetchRewards();
    } catch (err) {
      console.error('Error updating stock:', err);
    }
  };

  const filteredRewards = rewards.filter((r) => {
    const matchSearch =
      !searchTerm ||
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory =
      filterCategory === 'All Categories' ||
      CATEGORY_OPTIONS.find((c) => c.value === r.category)?.label === filterCategory;
    return matchSearch && matchCategory;
  });

  const activeProviderLabel =
    PROVIDER_OPTIONS.find((p) => p.key === config.activeProvider)?.testLabel ||
    'Test API Ping';

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="space-y-6 pb-12">
      {/* ─── HERO ─────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 px-8 py-7 text-white shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white/70 ring-1 ring-white/10">
                Fulfillment Provider Control
              </span>
              <span className="text-xs font-medium text-white/60">
                Active API:{' '}
                <span className="font-bold text-white">
                  {config.activeProvider}
                </span>{' '}
                <span className="text-white/40">
                  ({config.environment.toUpperCase()})
                </span>
              </span>
            </div>

            <h1 className="mt-4 flex items-center gap-2 text-2xl font-extrabold tracking-tight">
              <Gift className="h-6 w-6 text-indigo-300" />
              Rewards Fulfillment Partners &amp; API Gateway
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
              As App Owner, configure the primary digital card fulfillment provider API,
              manage access keys, set instant e-voucher auto-dispatch rules, and fund the
              platform prepaid reward balance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                Prepaid Funding Balance
              </p>
              <p className="mt-1 text-2xl font-extrabold tracking-tight text-emerald-300">
                ${config.prepaidAccountBalance.toFixed(2)}{' '}
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
            <button
              type="button"
              onClick={() => setIsCatalogOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-indigo-700"
            >
              <Globe className="h-4 w-4" />
              Global API Catalog
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/70">
            <Settings className="h-3.5 w-3.5" />
            Select Primary Fulfillment Provider API
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            {PROVIDER_OPTIONS.map((opt) => {
              const isActive = config.activeProvider === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => updateConfig({ activeProvider: opt.key })}
                  className={cn(
                    'flex flex-col items-start gap-1 rounded-2xl border px-4 py-4 text-left transition-all',
                    isActive
                      ? 'border-indigo-400 bg-indigo-500/10 ring-2 ring-indigo-400/30'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                  )}
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <span className="text-sm font-bold text-white">
                      {opt.label}
                    </span>
                    {isActive && (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500">
                        <Check className="h-3 w-3 text-white" />
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-white/50">{opt.sub}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/60">
                <KeyRound className="h-3 w-3" />
                API Access Secret Key
              </label>
              <input
                type="password"
                value={config.apiKey}
                onChange={(e) => updateConfig({ apiKey: e.target.value })}
                placeholder="••••••••••••••••••••••••••••••"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/60">
                <Plug className="h-3 w-3" />
                Gateway Environment
              </label>
              <div className="relative">
                <select
                  value={config.environment}
                  onChange={(e) =>
                    updateConfig({
                      environment: e.target.value as 'production' | 'sandbox',
                    })
                  }
                  className="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 pr-10 text-sm text-white focus:border-indigo-400 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="sandbox" className="bg-slate-900">
                    Sandbox / Staging Environment
                  </option>
                  <option value="production" className="bg-slate-900">
                    Production Environment
                  </option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              </div>
            </div>

            <div>
              <label className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/60">
                <Link2 className="h-3 w-3" />
                Delivery Status Webhook URL
              </label>
              <input
                type="text"
                value={config.webhookUrl}
                onChange={(e) => updateConfig({ webhookUrl: e.target.value })}
                placeholder="https://api.app.com/webhooks/digitalcards"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  updateConfig({
                    autoFulfillDigitalCards: !config.autoFulfillDigitalCards,
                  })
                }
                className={cn(
                  'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                  config.autoFulfillDigitalCards ? 'bg-indigo-500' : 'bg-white/20'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                    config.autoFulfillDigitalCards ? 'translate-x-5' : 'translate-x-0.5'
                  )}
                />
              </button>
              <div>
                <p className="text-sm font-bold text-white">
                  Instant Digital Card Auto-Fulfillment
                </p>
                <p className="text-[11px] text-white/50">
                  Dispatch digital vouchers automatically on employee redemption
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePing}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-indigo-700"
              >
                <Check className="h-4 w-4" />
                {activeProviderLabel}
              </button>
              <p className="text-[11px] text-white/50">
                Connected:{' '}
                <span className="font-semibold text-white/80">
                  {new Date(config.connectedAt).toLocaleDateString()}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── TWO-COLUMN SECTION ──────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-indigo-700 ring-1 ring-indigo-100">
              App Owner Privilege
            </span>

            <div className="mt-4 flex items-start justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-extrabold uppercase tracking-tight text-slate-900">
                <Plus className="h-5 w-5 text-indigo-500" />
                Create Custom Global Reward
              </h2>
              <button
                type="button"
                onClick={() => setIsCreateOpen((v) => !v)}
                className="shrink-0 rounded-xl bg-indigo-600 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-indigo-700"
              >
                {isCreateOpen ? 'Collapse' : '+ Expand Form'}
              </button>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              Design custom reward vouchers, company merchandise, physical perks, or
              experiences. Custom rewards created by the App Owner will be
              immediately published across{' '}
              <span className="font-bold text-slate-700">all companies</span>,{' '}
              <span className="font-bold text-slate-700">employers</span>, and{' '}
              <span className="font-bold text-slate-700">employees platform-wide</span>.
            </p>
          </div>

          {isCreateOpen && (
            <div
              id="platform-reward-form"
              className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-indigo-900 to-indigo-800 px-5 py-3">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-indigo-200" />
                  <h3 className="text-sm font-bold text-white">
                    New Global Reward
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    handleCreateReset();
                  }}
                  className="text-indigo-300 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 p-5">
                {saveError && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700">
                    {saveError}
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Title
                  </label>
                  <input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="e.g., $10 Coffee Voucher"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="What employees get and how they redeem it..."
                    className="min-h-[80px] w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category: e.target.value as RewardCategorySlug,
                        })
                      }
                      className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Points Cost
                    </label>
                    <input
                      type="number"
                      value={formData.points_required}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          points_required: parseInt(e.target.value) || 0,
                        })
                      }
                      min={1}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock: parseInt(e.target.value) || 0,
                      })
                    }
                    min={0}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Image
                  </label>
                  {imagePreview ? (
                    <div className="relative mb-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-36 w-full rounded-xl object-cover"
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
                  ) : (
                    <div className="mb-2 flex h-36 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400">
                      No image selected
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setImageFile(f);
                        const reader = new FileReader();
                        reader.onloadend = () =>
                          setImagePreview(reader.result as string);
                        reader.readAsDataURL(f);
                      }
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {imagePreview ? 'Change Image' : 'Choose Image'}
                  </button>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateOpen(false);
                      handleCreateReset();
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isSaving ? 'Publishing…' : 'Publish Globally'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <Gift className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold uppercase tracking-wider text-slate-900">
                  Platform Active Rewards Catalog ({filteredRewards.length})
                </h2>
                <p className="text-sm text-slate-500">
                  Rewards available to all employees and employers platform-wide
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  {['All Categories', ...CATEGORY_OPTIONS.map((c) => c.label)].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search rewards..."
                  className="w-56 rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </div>

          <div className="mt-5">
            {filteredRewards.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/40 py-16 text-center">
                <Gift className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-base font-bold text-slate-800">
                  No rewards yet
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Create your first global reward using the form on the left.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredRewards.map((reward) => {
                  const CategoryIcon = CATEGORY_ICONS[reward.category] || Gift;
                  const categoryLabel =
                    CATEGORY_OPTIONS.find((c) => c.value === reward.category)
                      ?.label || reward.category;

                  return (
                    <div
                      key={reward.id}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                        {reward.image_url ? (
                          <img
                            src={reward.image_url}
                            alt={reward.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <CategoryIcon className="h-14 w-14 text-slate-300" />
                          </div>
                        )}

                        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-lg bg-slate-900/90 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                          {reward.points_required} PTS
                        </span>
                      </div>

                      <div className="flex flex-1 flex-col gap-2 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">
                          {categoryLabel}
                        </p>
                        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-900">
                          {reward.title}
                        </h3>
                        <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">
                          {reward.description || 'No description provided.'}
                        </p>

                        <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                          <span className="text-[11px] font-semibold text-slate-600">
                            Stock:{' '}
                            <span className="font-bold text-slate-800">
                              {reward.stock ?? 0}
                            </span>{' '}
                            units
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleAddStock(reward, 25)}
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 transition-colors hover:bg-slate-50"
                            >
                              +25 Stock
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
          </div>
        </div>
      </div>

      {/* ─── Modals ────────────────────────────────────────────── */}
      <FundPoolModal
        open={isFundPoolOpen}
        onClose={() => setIsFundPoolOpen(false)}
        currentBalance={config.prepaidAccountBalance}
        onConfirm={async (amount) => {
          handleFundPool(amount);
        }}
      />
      <GlobalApiCatalogModal
        open={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        onImport={(ids) => console.log('Imported global ids:', ids)}
      />
    </div>
  );
}