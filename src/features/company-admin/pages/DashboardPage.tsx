// src/features/company-admin/pages/DashboardPage.tsx

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useOrganization } from '@/app/providers/OrganizationProvider';
import { useEmployees } from '@/features/company-admin/queries/employeeQueries';
import { useActivities } from '@/features/shared/activities/queries/activityQueries';
import { useRewards } from '@/features/company-admin/queries/rewardQueries';
import { usePointsAccount } from '@/features/employee/queries/pointsQueries';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';
import { formatPoints, getInitials } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
// ✅ Add missing imports
import { 
  Users, 
  Calendar, 
  Gift, 
  TrendingUp,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { organizationMember } = useOrganization();
  const navigate = useNavigate();
  const organizationId = organizationMember?.organization_id || '';

  const { data: employees, isLoading: employeesLoading } = useEmployees(organizationId);
  const { data: activities, isLoading: activitiesLoading } = useActivities(organizationId);
  const { data: rewards, isLoading: rewardsLoading } = useRewards(organizationId);
  const { data: account } = usePointsAccount(user?.id || '');

  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [pointAmount, setPointAmount] = useState<number>(50);
  const [feedbackPreset, setFeedbackPreset] = useState<string>('Organizer Bonus');

  const isLoading = employeesLoading || activitiesLoading || rewardsLoading;

  if (isLoading) {
    return <LoadingScreen />;
  }

  const totalEmployees = employees?.length || 0;
  const activeEmployees = employees?.filter((e: any) => e.status === 'active').length || 0;
  const invitedEmployees = employees?.filter((e: any) => e.status === 'invited').length || 0;
  const totalActivities = activities?.length || 0;
  const activeActivities = activities?.filter((a: any) => a.status === 'active' || a.status === 'published').length || 0;
  const totalRewards = rewards?.length || 0;
  const totalPoints = account?.balance || 0;
  const lifetimeEarned = account?.lifetime_earned || 0;

  const sortedEmployees = employees?.slice().sort((a: any, b: any) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (a.status !== 'active' && b.status === 'active') return 1;
    return 0;
  }) || [];

  const handlePointAdjustment = () => {
    if (!selectedEmployee) {
      alert('Please select an employee');
      return;
    }
    alert(`Adjusting ${pointAmount} points for employee ${selectedEmployee}`);
  };

  const statusColors: Record<string, string> = {
    active: 'text-emerald-600 bg-emerald-50',
    invited: 'text-amber-600 bg-amber-50',
    pending: 'text-blue-600 bg-blue-50',
    inactive: 'text-gray-600 bg-gray-50',
  };

  const statusLabels: Record<string, string> = {
    active: 'Active',
    invited: 'Invited',
    pending: 'Pending',
    inactive: 'Inactive',
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-medium text-indigo-600 uppercase tracking-wider">Admin Desk</span>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">Active</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800">Administration Office Desk</h2>
            <p className="text-sm text-slate-500 max-w-2xl mt-1">
              Use this workspace to publish social activities, customize rewards options, and track employee participation. 
              Any activity created here will immediately appear in the employee's catalog for selection in real-time.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Live
            </span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Team</p>
              <p className="text-2xl font-bold text-slate-800 mt-0.5">{totalEmployees}</p>
              <p className="text-xs text-slate-500 mt-0.5">{activeEmployees} active members</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Activities</p>
              <p className="text-2xl font-bold text-slate-800 mt-0.5">{totalActivities}</p>
              <p className="text-xs text-slate-500 mt-0.5">{activeActivities} active</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Rewards</p>
              <p className="text-2xl font-bold text-slate-800 mt-0.5">{totalRewards}</p>
              <p className="text-xs text-slate-500 mt-0.5">Available for redemption</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Gift className="w-5 h-5" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Points Issued</p>
              <p className="text-2xl font-bold text-slate-800 mt-0.5">{formatPoints(totalPoints)}</p>
              <p className="text-xs text-slate-500 mt-0.5">Lifetime earned: {formatPoints(lifetimeEarned)}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Fulfillment Desk */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Fulfillment Desk</h3>
            <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">
              {invitedEmployees === 0 ? 'All claims solved' : `${invitedEmployees} pending invites`}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>{invitedEmployees} Pending Invites</span>
            <span className="text-slate-300">•</span>
            <span>{totalRewards} Rewards Available</span>
          </div>
        </div>
      </div>

      {/* Direct Point Incentives */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-800 mb-4">Direct Point Incentives</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Select Employee</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              <option value="">Please select an item in the list.</option>
              {employees?.map((emp: any) => (
                <option key={emp.id} value={emp.id}>
                  {emp.profiles?.first_name} {emp.profiles?.last_name} ({emp.profiles?.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Amount (+ / -)</label>
            <input
              type="number"
              value={pointAmount}
              onChange={(e) => setPointAmount(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Feedback Preset</label>
            <select
              value={feedbackPreset}
              onChange={(e) => setFeedbackPreset(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              <option value="Organizer Bonus">Organizer Bonus</option>
              <option value="Activity Completion">Activity Completion</option>
              <option value="Recognition Award">Recognition Award</option>
              <option value="Custom Adjustment">Custom Adjustment</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handlePointAdjustment}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Apply Token Adjustment
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          Balance modification triggers email alerts
        </p>
      </div>

      {/* Employee Activity Standings */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-800">Employee Activity Standings</h3>
            <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full font-medium">
              {totalEmployees} Employee{totalEmployees !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/30">
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Department</th>
              </tr>
            </thead>
            <tbody>
              {sortedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    No employees found. Invite your first employee to get started.
                  </td>
                </tr>
              ) : (
                sortedEmployees.map((employee: any) => {
                  const profile = employee.profiles;
                  const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || profile?.email || 'Unknown';
                  const isAdmin = employee.roles?.includes('company_admin') || employee.roles?.includes('company_owner');

                  return (
                    <tr key={employee.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium text-xs">
                            {getInitials(fullName)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{fullName}</p>
                            <p className="text-xs text-slate-500">{profile?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[employee.status] || 'bg-gray-50 text-gray-600'}`}>
                          {statusLabels[employee.status] || employee.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-slate-700">
                        {isAdmin ? 'Admin' : profile?.job_title || 'Employee'}
                        {isAdmin && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded font-medium">Admin</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-slate-500">
                        {profile?.department_id || '-'}
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