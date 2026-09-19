// src/features/employee/pages/RewardsPage.tsx

import { useMemo, useState } from 'react';
import {
  Gift,
  Coffee,
  Shirt,
  Compass,
  GraduationCap,
  Calendar,
  Sparkles,
  Heart,
  Coins,
  Search,
  Check,
  Loader2,
  History,
  ChevronDown,
  MapPin,
  LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useOrganization } from '@/app/providers/OrganizationProvider';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';
import { cn } from '@/lib/utils';
import {
  useAvailableRewards,
  usePointsBalance,
  useMyRedemptions,
  useRedeemReward,
  type EmployeeReward,
  type Redemption,
} from '@/features/employee/queries/employeeRewardQueries';
import { useSelfCheckinBudget } from '@/features/shared/activities/hooks/useEmployeePlaces';

// ─── Constants ────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  gift_card: 'Gift Card',
  merchandise: 'Merchandise',
  experience: 'Experience',
  training: 'Training',
  pto: 'PTO',
  company_benefit: 'Company Benefit',
  charitable: 'Charitable',
};

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  gift_card: Coffee,
  merchandise: Shirt,
  experience: Compass,
  training: GraduationCap,
  pto: Calendar,
  company_benefit: Sparkles,
  charitable: Heart,
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending Fulfillment',
  fulfilled: 'Fulfilled',
  delivered: 'Delivered',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  fulfilled: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
};

// ─── Page ─────────────────────────────────────────────────────────────

export default function EmployeeRewardsPage() {
  const { user } = useAuth();
  const { organizationMember } = useOrganization();
  const organizationId = organizationMember?.organization_id;

  const profileId = user?.id;

  const { data: rewards = [], isLoading: loadingRewards } = useAvailableRewards(organizationId);
  const { data: balance = { balance: 0, lifetimeRedeemed: 0 } } = usePointsBalance(profileId);
  const { data: redemptions = [] } = useMyRedemptions(profileId);
  const redeemMutation = useRedeemReward(profileId, organizationId);

  // Self check-in budget for this employee this period
  const { budget } = useSelfCheckinBudget(profileId, organizationId);

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All Categories');
  const [confirmingReward, setConfirmingReward] = useState<EmployeeReward | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rewards.filter((r) => {
      const matchSearch =
        !term ||
        r.title.toLowerCase().includes(term) ||
        (r.description || '').toLowerCase().includes(term);
      const matchCategory =
        filterCategory === 'All Categories' ||
        CATEGORY_LABELS[r.category] === filterCategory;
      return matchSearch && matchCategory;
    });
  }, [rewards, search, filterCategory]);

  const handleRedeemConfirm = async () => {
    if (!confirmingReward) return;
    try {
      await redeemMutation.mutateAsync(confirmingReward.id);
      setSuccessMessage(`Successfully redeemed "${confirmingReward.title}"!`);
      setConfirmingReward(null);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      const msg = String(err?.message || err);
      let human = 'Could not redeem this reward.';
      if (msg.includes('insufficient_points')) human = 'You do not have enough points.';
      else if (msg.includes('out_of_stock')) human = 'This reward is out of stock.';
      else if (msg.includes('reward_not_found')) human = 'Reward no longer exists.';
      alert(human);
      setConfirmingReward(null);
    }
  };

  if (loadingRewards) return <LoadingScreen />;

  const balanceValue = balance.balance;

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 ring-1 ring-amber-100">
            <Gift className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Company Exchange &amp; Wellness rewards
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Utilize your earned point balance to redeem meal coupons, corporate
              devices, or experience bundles.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
              Your Spendable Liquid Wealth
            </p>
            <p className="mt-0.5 text-2xl font-extrabold tracking-tight text-emerald-700">
              {balanceValue}{' '}
              <span className="text-sm font-bold text-emerald-600">pt</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <History className="h-4 w-4" />
            My Redemptions
            {redemptions.length > 0 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                {redemptions.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ─── Self Check-In Budget ──────────────────────────────── */}
      {budget && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Self Check-In Budget
                </p>
                <p className="mt-0.5 text-xl font-extrabold text-slate-900">
                  {budget.remaining}{' '}
                  <span className="text-sm font-bold text-slate-400">
                    / {budget.allowance} pts remaining
                  </span>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Earn 5 pts per self check-in at any discovered place. Featured
                  venues earn full points regardless.
                  {budget.periodEnd && (
                    <>
                      {' '}
                      Resets {new Date(budget.periodEnd).toLocaleDateString()}.
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Used this period
              </p>
              <p className="mt-0.5 text-lg font-extrabold text-slate-700">
                {budget.used} pts
              </p>
            </div>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all"
              style={{
                width: `${
                  budget.allowance > 0
                    ? Math.round((budget.used / budget.allowance) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      )}

      {/* ─── Success banner ─────────────────────────────────────── */}
      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700">
          ✅ {successMessage}
        </div>
      )}

      {/* ─── Search + category filter ───────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rewards..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div className="relative">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-sm font-semibold text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            {['All Categories', ...Object.values(CATEGORY_LABELS)].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* ─── Rewards grid ───────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center">
          <Gift className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-lg font-bold text-slate-800">No rewards available</p>
          <p className="mt-1 text-sm text-slate-500">
            Check back soon — new rewards are added regularly.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((reward) => {
            const Icon = CATEGORY_ICONS[reward.category] || Gift;
            const canAfford = balanceValue >= reward.points_required;
            const inStock = reward.stock === null || reward.stock > 0;
            const redeemable = canAfford && inStock;
            const progress = Math.min(
              100,
              Math.round((balanceValue / Math.max(1, reward.points_required)) * 100)
            );

            return (
              <div
                key={reward.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                {/* Image */}
                <div className="relative h-44 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                  {reward.image_url ? (
                    <img
                      src={reward.image_url}
                      alt={reward.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Icon className="h-16 w-16 text-slate-300" />
                    </div>
                  )}
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-800">
                    {reward.points_required} pt
                  </span>
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                    <Icon className="h-4 w-4" />
                  </div>

                  <h3 className="line-clamp-2 text-base font-bold text-slate-900">
                    {reward.title}
                  </h3>
                  <p className="line-clamp-3 text-xs leading-relaxed text-slate-500">
                    {reward.description || 'No description provided.'}
                  </p>

                  {/* Stock + progress */}
                  <div className="mt-auto space-y-2 pt-2">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <span>
                        Stock: {reward.stock !== null ? `${reward.stock} left` : '∞'}
                      </span>
                      <span className={cn(canAfford ? 'text-emerald-600' : 'text-slate-500')}>
                        {balanceValue} / {reward.points_required} PTS
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          canAfford ? 'bg-emerald-500' : 'bg-slate-400'
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* CTA */}
                  <button
                    type="button"
                    disabled={!redeemable || redeemMutation.isPending}
                    onClick={() => setConfirmingReward(reward)}
                    className={cn(
                      'mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors',
                      redeemable
                        ? 'bg-emerald-500 text-white shadow-sm hover:bg-emerald-600'
                        : 'cursor-not-allowed border border-slate-200 bg-slate-50 text-slate-400'
                    )}
                  >
                    {redeemMutation.isPending && confirmingReward?.id === reward.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Redeeming…
                      </>
                    ) : !inStock ? (
                      <>
                        <Gift className="h-4 w-4" />
                        Out of Stock
                      </>
                    ) : canAfford ? (
                      <>
                        <Gift className="h-4 w-4" />
                        Redeem Voucher
                      </>
                    ) : (
                      <>
                        <Coins className="h-4 w-4" />
                        Need {reward.points_required - balanceValue} pts
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── My Redemptions panel ──────────────────────────────── */}
      {showHistory && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-extrabold uppercase tracking-wider text-slate-900">
              My Redemptions
            </h2>
          </div>

          {redemptions.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              You haven't redeemed any rewards yet.
            </p>
          ) : (
            <div className="space-y-2">
              {redemptions.map((r: Redemption) => (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {r.reward?.image_url ? (
                      <img
                        src={r.reward.image_url}
                        alt={r.reward.title || ''}
                        className="h-12 w-12 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                        <Gift className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {r.reward?.title || 'Reward'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {new Date(r.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-700">
                      −{r.points_spent} pts
                    </span>
                    <span
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider',
                        STATUS_STYLE[r.status] || STATUS_STYLE.pending
                      )}
                    >
                      {STATUS_LABEL[r.status] || r.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Confirm dialog ─────────────────────────────────────── */}
      {confirmingReward && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => setConfirmingReward(null)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-4 text-white">
              <h3 className="text-lg font-extrabold">Confirm Redemption</h3>
              <p className="mt-0.5 text-xs text-white/80">
                This action will deduct points from your balance.
              </p>
            </div>
            <div className="space-y-4 p-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-900">
                  {confirmingReward.title}
                </p>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Cost</span>
                  <span className="font-bold text-slate-800">
                    {confirmingReward.points_required} pts
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Your balance after</span>
                  <span className="font-bold text-emerald-600">
                    {balanceValue - confirmingReward.points_required} pts
                  </span>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmingReward(null)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRedeemConfirm}
                  disabled={redeemMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-600 disabled:opacity-50"
                >
                  {redeemMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Redeeming…
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Confirm
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}