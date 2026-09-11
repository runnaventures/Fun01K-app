// src/features/platform-admin/pages/DashboardPage.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import {
  ShieldCheck,
  Building2,
  Scale,
  Flag,
  FolderTree,
  Gift,
  Plug,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { usePlatformStats } from '../hooks/usePlatformStats';
import { CompanyDirectory } from '../components/CompanyDirectory/CompanyDirectory';
import { PointsGovernance } from '../components/PointsGovernance/PointsGovernance';
import { FeedModeration } from '../components/FeedModeration/FeedModeration';
import { TaxonomyManager } from '../components/TaxonomyManager/TaxonomyManager';
import { RewardsManager } from '../components/RewardsManager/RewardsManager';
import { ActivitiesManager } from '../components/ActivitiesManager/ActivitiesManager';
import { IntegrationsPanel } from '../components/Integrations/IntegrationsPanel';

type TabId =
  | 'companies'
  | 'activities'
  | 'rewards'
  | 'governance'
  | 'moderation'
  | 'taxonomy'
  | 'integrations';

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
}

export default function PlatformDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('companies');
  const { stats, isLoading } = usePlatformStats();

  const tabs: TabDef[] = [
    {
      id: 'companies',
      label: 'Company Directory',
      icon: <Building2 className="h-4 w-4" />,
      badge: stats?.totalOrganizations ?? 0,
    },
    {
      id: 'governance',
      label: 'Points Governance Engine',
      icon: <Scale className="h-4 w-4" />,
    },
    {
      id: 'moderation',
      label: 'Feeds & Activity Moderation',
      icon: <Flag className="h-4 w-4" />,
      badge: 0,
    },
    {
      id: 'taxonomy',
      label: 'Taxonomy & Sub-Interests',
      icon: <FolderTree className="h-4 w-4" />,
    },
    {
      id: 'rewards',
      label: 'Rewards & Fulfillment',
      icon: <Gift className="h-4 w-4" />,
      badge: stats?.totalRewards ?? 0,
    },
    {
      id: 'activities',
      label: 'Activities',
      icon: <Flag className="h-4 w-4" />,
      badge: stats?.totalActivities ?? 0,
    },
    {
      id: 'integrations',
      label: 'Integrations',
      icon: <Plug className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* ───────────── Hero panel ───────────── */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 px-6 py-6 text-white shadow-lg">
        {/* Top badges */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-violet-500/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-violet-200 ring-1 ring-violet-400/30">
            <ShieldCheck className="h-3.5 w-3.5" />
            App Owner Control Panel
          </span>
          <span className="text-xs font-medium text-white/60">
            Super Admin • Platform Master Operations
          </span>
        </div>

        {/* Main heading row */}
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Multi-Tenant Governance &amp; Operations
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/70">
              Monitor signed-up companies, govern global point exchange economics
              &amp; caps, moderate cross-company activities, and curate the master
              interest taxonomy.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Platform Status: Operational
            </span>
            <Button
              onClick={() => navigate('/platform/organizations')}
              className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Onboard Company Tenant
            </Button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label="Signed-up Tenants"
            value={stats?.totalOrganizations ?? 0}
            accent="text-emerald-300"
            
          />
          <StatTile
            label="Total Platform Seats"
            value={stats?.totalUsers ?? 0}
            accent="text-white"
          />
          <StatTile
            label="Monthly Points Pool"
            value={(stats?.monthlyPointsPool ?? 0).toLocaleString()}
            accent="text-amber-300"
            suffix="PTS"
          />
          <StatTile
            label="Point Exchange Valuation"
            value={`$${(stats?.pointValuationUSD ?? 0.1).toFixed(2)}`}
            accent="text-emerald-300"
            suffix="/ Point"
          />
        </div>
      </div>

      {/* ───────────── Tab bar ───────────── */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all',
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'border bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge !== 0 && (
                <span
                  className={cn(
                    'ml-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold',
                    tab.id === 'moderation'
                      ? 'bg-rose-500 text-white'
                      : isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-700'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ───────────── Tab content ───────────── */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        {activeTab === 'companies' && <CompanyDirectory />}
        {activeTab === 'governance' && <PointsGovernance />}
        {activeTab === 'moderation' && <FeedModeration />}
        {activeTab === 'taxonomy' && <TaxonomyManager />}
        {activeTab === 'rewards' && <RewardsManager />}
        {activeTab === 'activities' && <ActivitiesManager />}
        {activeTab === 'integrations' && <IntegrationsPanel />}
      </div>
    </div>
  );
}

/* ───────────── Sub-components ───────────── */

function StatTile({
  label,
  value,
  accent,
  hint,
  suffix,
}: {
  label: string;
  value: number | string;
  accent: string;
  hint?: string;
  suffix?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">
        {label}
      </p>
      <p className={cn('mt-1 flex items-baseline gap-1.5 text-2xl font-extrabold', accent)}>
        {value}
        {suffix && (
          <span className="text-xs font-semibold text-white/60">{suffix}</span>
        )}
      </p>
      {hint && <p className="text-[11px] font-medium text-emerald-400">{hint}</p>}
    </div>
  );
}