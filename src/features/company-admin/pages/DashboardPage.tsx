// src/features/company-admin/pages/DashboardPage.tsx

import { useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useOrganization } from '@/app/providers/OrganizationProvider';
import { useEmployees } from '@/features/company-admin/queries/employeeQueries';
import { useActivities } from '@/features/shared/activities/queries/activityQueries';
import { useRewards } from '@/features/company-admin/queries/rewardQueries';
import { usePointsAccount } from '@/features/employee/queries/pointsQueries';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';
import { getInitials } from '@/lib/utils';
import {
  CheckCircle2,
  Clock,
  Coins,
  Users,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuth();
  const { organizationMember } = useOrganization();
  const organizationId = organizationMember?.organization_id || '';

  const { data: employees, isLoading: employeesLoading } = useEmployees(organizationId);
  const { data: activities, isLoading: activitiesLoading } = useActivities(organizationId);
  const { data: rewards, isLoading: rewardsLoading } = useRewards(organizationId);
  const { data: account } = usePointsAccount(user?.id || '');

  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [pointAmount, setPointAmount] = useState(50);
  const [feedbackPreset, setFeedbackPreset] = useState('Organizer Bonus');

  const isLoading =
    employeesLoading || activitiesLoading || rewardsLoading;

  if (isLoading) return <LoadingScreen />;

  const employeeList = (employees as any[]) || [];
  const rewardList = (rewards as any[]) || [];
  const totalEmployees = employeeList.length;
  const engagedEmployees = employeeList.filter(
    (e: any) => e.status === 'active'
  ).length;
  const pendingInvites = employeeList.filter(
    (e: any) => e.status === 'invited' || e.status === 'pending'
  ).length;
  const _totalActivities = (activities as any[])?.length || 0;
  const totalRewards = rewardList.length;
  const _account = account as any;

  const handlePointAdjustment = () => {
    if (!selectedEmployee) {
      alert('Please select an employee');
      return;
    }
    alert(`Adjusting ${pointAmount} points for employee ${selectedEmployee}`);
  };

  return (
    <div className="space-y-6">
      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ TOP ROW: Fulfillment + Incentives â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Fulfillment Desk (dark) */}
        <FulfillmentDesk
          className="lg:col-span-2"
          pendingInvites={pendingInvites}
          totalRewards={totalRewards}
        />

        {/* Direct Point Incentives (white) */}
        <DirectPointIncentives
          employees={employeeList}
          selectedEmployee={selectedEmployee}
          onSelectEmployee={setSelectedEmployee}
          pointAmount={pointAmount}
          onAmountChange={setPointAmount}
          feedbackPreset={feedbackPreset}
          onPresetChange={setFeedbackPreset}
          onSubmit={handlePointAdjustment}
        />
      </div>

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ BOTTOM: Employee Activity Standings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <EmployeeStandings
        employees={employeeList}
        engagedCount={engagedEmployees}
      />
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Fulfillment Desk â€” dark card
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function FulfillmentDesk({
  className,
  pendingInvites,
  totalRewards,
}: {
  className?: string;
  pendingInvites: number;
  totalRewards: number;
}) {
  const hasClaims = pendingInvites > 0;

  return (
    <div
      className={cn(
        'relative flex flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 text-white shadow-md',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400 ring-1 ring-rose-400/30">
          <Clock className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold uppercase tracking-wider">
            Fulfillment Desk
          </h2>
          <p className="text-[11px] font-medium uppercase tracking-wider text-white/40">
            {hasClaims ? `${pendingInvites} unresolved` : 'Voucher pool settled'}
          </p>
        </div>
      </div>

      {/* Center state */}
      <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
          <CheckCircle2 className="h-10 w-10 text-white/40" />
        </div>
        <p className="text-base font-semibold">
          {hasClaims ? `${pendingInvites} reward claims waiting` : 'All reward claims solved!'}
        </p>
        <p className="mt-1 text-sm text-white/50">
          {hasClaims
            ? 'Review and approve outstanding redemptions'
            : 'Voucher pool settled.'}
        </p>
      </div>

      {/* Footer metric */}
      <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs">
        <span className="font-bold uppercase tracking-wider text-white/40">
          Unresolved Redemptions
        </span>
        <span className="font-semibold text-white/80">
          {hasClaims ? `${pendingInvites} Claims` : `0 Claims`}
        </span>
      </div>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Direct Point Incentives â€” white card
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function DirectPointIncentives({
  employees,
  selectedEmployee,
  onSelectEmployee,
  pointAmount,
  onAmountChange,
  feedbackPreset,
  onPresetChange,
  onSubmit,
}: {
  employees: any[];
  selectedEmployee: string;
  onSelectEmployee: (v: string) => void;
  pointAmount: number;
  onAmountChange: (v: number) => void;
  feedbackPreset: string;
  onPresetChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
          <Coins className="h-5 w-5" />
        </div>
        <h2 className="text-base font-bold uppercase tracking-wider text-slate-800">
          Direct Point Incentives
        </h2>
      </div>

      {/* Select Employee */}
      <div>
        <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Select Employee
        </label>
        <div className="relative">
          <select
            value={selectedEmployee}
            onChange={(e) => onSelectEmployee(e.target.value)}
            className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition-colors focus:border-slate-400 focus:bg-white focus:outline-none"
          >
            <option value="">-- Choose employee --</option>
            {employees.map((emp: any) => (
              <option key={emp.id} value={emp.id}>
                {emp.profiles?.first_name} {emp.profiles?.last_name}
                {emp.profiles?.email ? ` (${emp.profiles.email})` : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* Amount + Preset side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Amount (+ / -)
          </label>
          <input
            type="number"
            value={pointAmount}
            onChange={(e) => onAmountChange(parseInt(e.target.value) || 0)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-bold text-slate-900 transition-colors focus:border-slate-400 focus:bg-white focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Feedback Preset
          </label>
          <div className="relative">
            <select
              value={feedbackPreset}
              onChange={(e) => onPresetChange(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition-colors focus:border-slate-400 focus:bg-white focus:outline-none"
            >
              <option value="Organizer Bonus">Organizer Bonus</option>
              <option value="Activity Completion">Activity Completion</option>
              <option value="Recognition Award">Recognition Award</option>
              <option value="Custom Adjustment">Custom Adjustment</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={onSubmit}
        className="w-full rounded-xl bg-slate-200 py-3 text-sm font-bold uppercase tracking-wider text-slate-500 transition-colors hover:bg-slate-300 hover:text-slate-700"
      >
        Apply Token Adjustments
      </button>

      {/* Footer hint */}
      <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
        <Sparkles className="h-3.5 w-3.5" />
        Balance modification triggers email alerts
      </p>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Employee Activity Standings â€” table
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function EmployeeStandings({
  employees,
  engagedCount,
}: {
  employees: any[];
  engagedCount: number;
}) {
  const statusStyle: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
    invited: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
    pending: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100',
    inactive: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
            <Users className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Employee Activity Standings
          </h2>
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {engagedCount} Engaged {engagedCount === 1 ? 'Employee' : 'Employees'}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/60">
              <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Active Tokens
              </th>
              <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                All-Time Earned
              </th>
              <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Claimed Vouchers
              </th>
              <th className="px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Joined / Done
              </th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-sm text-slate-500"
                >
                  No employees found. Invite your first employee to get started.
                </td>
              </tr>
            ) : (
              employees.map((emp: any) => {
                const profile = emp.profiles;
                const fullName =
                  `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() ||
                  profile?.email ||
                  'Unknown';
                const tokens = emp.points ?? 0;
                const lifetime = emp.lifetime_earned ?? tokens;
                const vouchers = emp.claimed_vouchers ?? 0;
                const joined = emp.joined_count ?? 0;
                const done = emp.completed_count ?? 0;

                return (
                  <tr
                    key={emp.id}
                    className="border-t border-slate-100 transition-colors hover:bg-slate-50/50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                          {getInitials(fullName)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {fullName}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {profile?.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                      {tokens.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                      {lifetime.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                      {vouchers}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-slate-700">
                      {joined} / {done}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}