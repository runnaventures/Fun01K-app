// src/features/employee/pages/DashboardPage.tsx

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { useOrganization } from '@/app/providers/OrganizationProvider';
import { useFeaturedActivities, useUserActivities } from '@/features/shared/activities/queries/activityQueries';
import { usePointsAccount } from '@/features/employee/queries/pointsQueries';
import { useEmployees } from '@/features/company-admin/queries/employeeQueries';
import { useDepartments } from '@/features/employee/queries/profileQueries';
import { supabase } from '@/lib/supabase';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';
import { getInitials } from '@/lib/utils';
import {
  Bell,
  Coins,
  Crown,
  MapPin,
  Star,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Medal,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*                               Small helpers                                */
/* -------------------------------------------------------------------------- */

const TIERS = [
  { name: 'Bronze Starter', min: 0, max: 100, color: 'bg-amber-700/15 text-amber-800 border-amber-700/30' },
  { name: 'Silver Seeker', min: 100, max: 250, color: 'bg-slate-300/25 text-slate-700 border-slate-400/40' },
  { name: 'Golden Legend', min: 250, max: 500, color: 'bg-amber-400/25 text-amber-800 border-amber-500/40' },
  { name: 'Platinum Elite', min: 500, max: 1000, color: 'bg-violet-400/20 text-violet-700 border-violet-400/40' },
  { name: 'Diamond Master', min: 1000, max: Infinity, color: 'bg-cyan-400/20 text-cyan-700 border-cyan-400/40' },
];

function getTier(points: number) {
  return TIERS.find((t) => points >= t.min && points < t.max) ?? TIERS[0];
}

function getLevel(points: number) {
  return Math.max(1, Math.floor(points / 150) + 1);
}

function nextMilestone(points: number) {
  const level = getLevel(points);
  const next = level * 150;
  const prev = (level - 1) * 150;
  const progress = next > prev ? ((points - prev) / (next - prev)) * 100 : 0;
  return { next, prev, progress: Math.max(0, Math.min(100, progress)) };
}

function timeAgo(dateStr: string) {
  const d = new Date(dateStr).getTime();
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/* -------------------------------------------------------------------------- */
/*                              Local social feed                             */
/* -------------------------------------------------------------------------- */

interface FeedItem {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  action: string;
  timestamp: string;
  points_delta: number;
}

function useSocialFeed(organizationId: string, limit = 8) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!organizationId) {
        setItems([]);
        setLoading(false);
        return;
      }
      try {
        const { data: participations } = await supabase
          .from('activity_participations')
          .select('id, profile_id, created_at, activity:activities(title, points_reward, organization_id)')
          .eq('activities.organization_id', organizationId)
          .order('created_at', { ascending: false })
          .limit(limit);

        const { data: redemptions } = await supabase
          .from('reward_redemptions')
          .select('id, profile_id, created_at, reward:rewards(title, points_cost, organization_id)')
          .eq('rewards.organization_id', organizationId)
          .order('created_at', { ascending: false })
          .limit(limit);

        const profileIds = new Set<string>();
        (participations ?? []).forEach((p: any) => p.profile_id && profileIds.add(p.profile_id));
        (redemptions ?? []).forEach((r: any) => r.profile_id && profileIds.add(r.profile_id));

        const { data: profiles } = profileIds.size
          ? await supabase
              .from('profiles')
              .select('id, first_name, last_name, avatar_url, email')
              .in('id', Array.from(profileIds))
          : { data: [] as any[] };

        const profileMap = new Map<string, any>();
        (profiles ?? []).forEach((p: any) => profileMap.set(p.id, p));

        const feed: FeedItem[] = [];

        (participations ?? []).forEach((p: any) => {
          const prof = profileMap.get(p.profile_id);
          const name = prof
            ? `${prof.first_name ?? ''} ${prof.last_name ?? ''}`.trim() || prof.email
            : 'Someone';
          feed.push({
            id: `part-${p.id}`,
            user_id: p.profile_id,
            full_name: name,
            avatar_url: prof?.avatar_url ?? null,
            action: `registered for ${p.activity?.title ?? 'an activity'}`,
            timestamp: p.created_at,
            points_delta: p.activity?.points_reward ?? 0,
          });
        });

        (redemptions ?? []).forEach((r: any) => {
          const prof = profileMap.get(r.profile_id);
          const name = prof
            ? `${prof.first_name ?? ''} ${prof.last_name ?? ''}`.trim() || prof.email
            : 'Someone';
          feed.push({
            id: `red-${r.id}`,
            user_id: r.profile_id,
            full_name: name,
            avatar_url: prof?.avatar_url ?? null,
            action: `redeemed ${r.reward?.title ?? 'a reward'}`,
            timestamp: r.created_at,
            points_delta: -(r.reward?.points_cost ?? 0),
          });
        });

        feed.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        if (!cancelled) {
          setItems(feed.slice(0, limit));
          setLoading(false);
        }
      } catch (err) {
        console.error('Social feed load failed:', err);
        if (!cancelled) {
          setItems([]);
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [organizationId, limit]);

  return { items, loading };
}

/* -------------------------------------------------------------------------- */
/*                                   Page                                     */
/* -------------------------------------------------------------------------- */

export default function DashboardPage() {
  const { user } = useAuth();
  const { organizationMember } = useOrganization();
  const navigate = useNavigate();
  const organizationId = organizationMember?.organization_id || '';
  const userId = user?.id || '';

  const { data: featured = [], isLoading: featuredLoading } = useFeaturedActivities(organizationId);
  const { data: myActivities = [], isLoading: myActivitiesLoading } = useUserActivities(userId);
  const { data: account, isLoading: accountLoading } = usePointsAccount(userId);
  const { data: employees = [], isLoading: employeesLoading } = useEmployees(organizationId);
  const { data: departments = [] } = useDepartments(organizationId);
  const { items: socialFeed, loading: socialLoading } = useSocialFeed(organizationId);

  const isLoading =
    featuredLoading || myActivitiesLoading || accountLoading || employeesLoading;

  /* ---------------------- derived data ---------------------- */

  const points = account?.balance ?? 0;
  const tier = getTier(points);
  const level = getLevel(points);
  const { next, progress } = nextMilestone(points);

  const spotlight = (featured as any[])[0];

  const sortedEmployees = useMemo(() => {
    return [...(employees as any[])]
      .map((e: any) => ({
        id: e.id,
        profile_id: e.profile_id ?? e.profiles?.id ?? e.id,
        name:
          `${e.profiles?.first_name ?? ''} ${e.profiles?.last_name ?? ''}`.trim() ||
          e.profiles?.email ||
          'Unknown',
        avatar_url: e.profiles?.avatar_url ?? null,
        points: e.points ?? 0,
      }))
      .sort((a, b) => b.points - a.points);
  }, [employees]);

  const myRank = useMemo(() => {
    const idx = sortedEmployees.findIndex(
      (e) => e.profile_id === userId || e.id === userId
    );
    return idx >= 0 ? idx + 1 : null;
  }, [sortedEmployees, userId]);

  const top3 = sortedEmployees.slice(0, 3);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return (myActivities as any[])
      .map((a: any) => ({ raw: a, activity: a.activity ?? a }))
      .filter((x) => {
        const when = x.activity?.scheduled_at;
        return when && new Date(when).getTime() >= now;
      })
      .sort(
        (a, b) =>
          new Date(a.activity.scheduled_at).getTime() -
          new Date(b.activity.scheduled_at).getTime()
      )
      .slice(0, 5);
  }, [myActivities]);

  const myDepartment = useMemo(() => {
    const myDeptId = (employees as any[]).find(
      (e: any) => (e.profile_id ?? e.profiles?.id) === userId
    )?.profiles?.department_id;
    if (!myDeptId) return null;
    return (departments as any[]).find((d: any) => d.id === myDeptId)?.name ?? null;
  }, [employees, departments, userId]);

  if (isLoading) return <LoadingScreen />;

  const firstName =
    user?.user_metadata?.first_name ||
    user?.email?.split('@')[0] ||
    'there';

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  /* ---------------------- render ---------------------- */

  return (
    <div className="space-y-6">
      {/* Welcome banner with chips inside */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 rounded-2xl border bg-card px-6 py-5 shadow-sm">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {firstName}! 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {myRank ? (
              <>
                You are ranked{' '}
                <span className="font-semibold text-foreground">#{myRank}</span> in the employee
                list. Broaden your ties across departments of your workspace.
              </>
            ) : (
              <>Broaden your ties across departments of your workspace.</>
            )}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Chip icon={Bell} label="1h Reminders" badge="FEATURED" />
            <Chip icon={Coins} label={`${points} Spending Tokens`} variant="success" />
            <Chip icon={Crown} label={`Lvl ${level} • ${firstName}`} variant="violet" />
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-background px-4 py-3 self-start">
          {avatarUrl ? (
            <img src={avatarUrl} alt="You" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {getInitials(firstName)}
            </div>
          )}
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Department
            </p>
            <p className="text-sm font-semibold">{myDepartment ?? 'Not assigned'}</p>
          </div>
        </div>
      </div>

      {/* Row 2 — Spotlight / Wallet / Standings */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Spotlight */}
        <section className="lg:col-span-6 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 p-6 text-white shadow-md">
          {spotlight ? (
            <>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider">
                  <Star className="h-3.5 w-3.5" />
                  Platform Featured Spotlight
                </span>
                <span className="rounded-full bg-emerald-400/90 px-3 py-1 text-xs font-bold text-emerald-950">
                  +{spotlight.points_reward ?? spotlight.points ?? 40} PTS
                </span>
              </div>

              <h2 className="mt-4 text-3xl font-extrabold tracking-tight">
                {spotlight.title}
              </h2>
              {spotlight.description && (
                <p className="mt-2 text-sm text-white/90 line-clamp-4">
                  {spotlight.description}
                </p>
              )}

              <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/70">
                    Logistics
                  </p>
                  <p className="font-semibold">
                    {spotlight.scheduled_at
                      ? new Date(spotlight.scheduled_at).toLocaleString(undefined, {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'TBD'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/70">
                    Location
                  </p>
                  <p className="font-semibold line-clamp-2">
                    {spotlight.location || 'See activity details'}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => navigate(`/app/activities/${spotlight.id}`)}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-emerald-950 shadow-sm transition hover:bg-emerald-300"
                >
                  <MapPin className="h-4 w-4" />
                  Check in &amp; Earn
                </button>
                {spotlight.rating && (
                  <span className="text-sm text-white/90">
                    {spotlight.rating}★ Rating • Verified Venue
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="py-10 text-center">
              <Sparkles className="mx-auto mb-3 h-10 w-10 text-white/60" />
              <p className="text-sm text-white/80">No featured activity right now.</p>
              <button
                onClick={() => navigate('/app/discover')}
                className="mt-4 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/25"
              >
                Discover activities →
              </button>
            </div>
          )}
        </section>

        {/* Points wallet */}
        <section className="lg:col-span-3 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Active Points Wallet
            </p>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Coins className="h-4 w-4" />
            </div>
          </div>

          <p className="mt-5 text-sm text-muted-foreground">Available Balance</p>
          <p className="mt-1 text-4xl font-extrabold tracking-tight">
            {points}
            <span className="ml-2 text-base font-semibold text-muted-foreground">TOKENS</span>
          </p>

          <div className="mt-5 flex items-center justify-between">
            <p className="text-sm font-semibold">Employee Tier</p>
            <span className={`rounded-md border px-2.5 py-1 text-xs font-bold ${tier.color}`}>
              {tier.name}
            </span>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Overall Points Gathered:{' '}
            <span className="font-semibold text-foreground">{points} XP</span>.
            <br />
            Milestone to level-up is {next - ((level - 1) * 150)} points.
          </p>

          <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {Math.round(progress)}% Level Progress ({points % 150} / 150)
          </p>
        </section>

        {/* Social standings */}
        <section className="lg:col-span-3 rounded-2xl bg-slate-900 p-6 text-white shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
              Social Standings
            </p>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400/20 text-amber-300">
              <Medal className="h-4 w-4" />
            </div>
          </div>

          <p className="mt-5 text-sm text-white/70">Your Current Standings</p>
          <p className="mt-1 text-4xl font-extrabold">
            {myRank ? `#${myRank}` : '—'}
            <span className="ml-2 text-sm font-medium text-white/60">
              among colleagues
            </span>
          </p>

          <p className="mt-6 text-[11px] font-semibold uppercase tracking-wider text-white/60">
            Top 3 Socializers
          </p>
          <div className="mt-3 space-y-3">
            {top3.length === 0 ? (
              <p className="text-xs text-white/50">No standings yet.</p>
            ) : (
              top3.map((e, i) => (
                <div key={e.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-4 text-xs font-bold text-white/50">{i + 1}</span>
                    {e.avatar_url ? (
                      <img
                        src={e.avatar_url}
                        alt={e.name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
                        {getInitials(e.name)}
                      </div>
                    )}
                    <span className="text-sm font-medium truncate max-w-[120px]">
                      {e.name}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-white/80">
                    {e.points} pt
                  </span>
                </div>
              ))
            )}
          </div>

          <p className="mt-6 text-xs text-white/60">
            Earn points by completing shared hobby items!
          </p>
        </section>
      </div>

      {/* Row 3 — Feed / Checklists */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Social feed */}
        <section className="lg:col-span-5 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-pink-500/10 text-pink-600">
              <Clock className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Colleague Social Feed
            </h3>
          </div>

          <div className="mt-4 space-y-4">
            {socialLoading ? (
              <p className="text-xs text-muted-foreground">Loading feed…</p>
            ) : socialFeed.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No recent activity from your colleagues yet.
              </p>
            ) : (
              socialFeed.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  {item.avatar_url ? (
                    <img
                      src={item.avatar_url}
                      alt={item.full_name}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {getInitials(item.full_name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{item.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.action}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {timeAgo(item.timestamp)}
                    </p>
                  </div>
                  <span
                    className={`whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-bold ${
                      item.points_delta >= 0
                        ? 'bg-emerald-500/10 text-emerald-700'
                        : 'bg-rose-500/10 text-rose-600'
                    }`}
                  >
                    {item.points_delta >= 0 ? '+' : ''}
                    {item.points_delta} pts
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Upcoming checklists */}
        <section className="lg:col-span-7 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider">
              My Upcoming Attending Checklists ({upcoming.length})
            </h3>
          </div>

          <div className="mt-4 space-y-4">
            {upcoming.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                You have no upcoming activities. Join one to get started.
                <div className="mt-3">
                  <button
                    onClick={() => navigate('/app/discover')}
                    className="text-primary hover:underline"
                  >
                    Discover activities →
                  </button>
                </div>
              </div>
            ) : (
              upcoming.map(({ activity }) => (
                <div
                  key={activity.id}
                  className="rounded-xl border p-5 transition hover:border-primary/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex items-center rounded-full bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700">
                        {activity.category?.name ?? 'Hobby'}
                      </span>
                      <h4 className="mt-2 text-lg font-bold">{activity.title}</h4>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {activity.scheduled_at
                          ? new Date(activity.scheduled_at).toLocaleString(undefined, {
                              weekday: 'long',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Schedule TBD'}
                      </p>
                    </div>
                    <span className="whitespace-nowrap text-sm font-bold text-emerald-600">
                      +{activity.points_reward ?? activity.points ?? 40} pts
                    </span>
                  </div>

                  <button
                    onClick={() => navigate(`/app/activities/${activity.id}`)}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
                  >
                    <MapPin className="h-4 w-4" />
                    Check in &amp; Earn
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 flex items-center justify-between border-t pt-4">
            <p className="text-xs text-muted-foreground">
              To coordinate with colleagues, meet up at the registered locations.
            </p>
            <button
              onClick={() => navigate('/app/discover')}
              className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              View Catalog <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                             Sub-components                                  */
/* -------------------------------------------------------------------------- */

function Chip({
  icon: Icon,
  label,
  badge,
  variant = 'default',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
  variant?: 'default' | 'success' | 'violet';
}) {
  const styles: Record<string, string> = {
    default: 'border bg-background text-foreground',
    success: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
    violet: 'border border-violet-200 bg-violet-50 text-violet-700',
  };
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold ${styles[variant]}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
      {badge && (
        <span className="rounded-md bg-amber-400/90 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-950">
          {badge}
        </span>
      )}
    </span>
  );
}