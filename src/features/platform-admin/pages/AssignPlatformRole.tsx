// src/features/platform-admin/pages/AssignPlatformRole.tsx

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/app/providers/AuthProvider';

type PlatformRole = 'platform_owner' | 'platform_admin' | 'support_admin';

export default function AssignPlatformRole() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<PlatformRole>('platform_admin');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isPlatformOwner, setIsPlatformOwner] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [recentAssignments, setRecentAssignments] = useState<any[]>([]);

  // Check if current user is platform owner
  useEffect(() => {
    const checkPlatformAccess = async () => {
      if (!user) {
        setIsChecking(false);
        return;
      }

      try {
        // Get platform organization
        const { data: platformOrg } = await supabase
          .from('organizations')
          .select('id')
          .eq('slug', 'platform')
          .maybeSingle();

        if (!platformOrg) {
          setIsChecking(false);
          return;
        }

        // Check if user is platform owner
        const { data: member } = await supabase
          .from('organization_members')
          .select('roles')
          .eq('profile_id', user.id)
          .eq('organization_id', platformOrg.id)
          .maybeSingle();

        if (member?.roles?.includes('platform_owner')) {
          setIsPlatformOwner(true);
          // Fetch recent assignments
          fetchRecentAssignments();
        }
      } catch (error) {
        console.error('Error checking platform access:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkPlatformAccess();
  }, [user]);

  const fetchRecentAssignments = async () => {
    try {
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('action', 'assign_platform_role')
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        setRecentAssignments(data);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // First, find the user by email from auth.users
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .maybeSingle();

      if (userError || !userData) {
        setMessage({ 
          type: 'error', 
          text: 'User not found. Make sure they have signed up first.' 
        });
        setIsLoading(false);
        return;
      }

      // Get platform organization
      const { data: platformOrg, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', 'platform')
        .maybeSingle();

      if (orgError || !platformOrg) {
        setMessage({ type: 'error', text: 'Platform organization not found.' });
        setIsLoading(false);
        return;
      }

      // Assign platform role
      const { error: assignError } = await supabase
        .from('organization_members')
        .upsert({
          profile_id: userData.id,
          organization_id: platformOrg.id,
          roles: [role],
          updated_at: new Date().toISOString(),
        })
        .select();

      if (assignError) {
        setMessage({ type: 'error', text: assignError.message });
      } else {
        // Log the audit trail
        await supabase
          .from('audit_logs')
          .insert({
            user_id: user?.id,
            action: 'assign_platform_role',
            resource_type: 'user',
            resource_id: userData.id,
            details: {
              assigned_by: user?.email,
              assigned_to: userData.email,
              role: role,
              timestamp: new Date().toISOString(),
            },
          });

        setMessage({ 
          type: 'success', 
          text: `✅ Successfully assigned ${role} role to ${email}` 
        });
        setEmail('');
        // Refresh recent assignments
        fetchRecentAssignments();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    { value: 'platform_owner', label: 'Platform Owner', description: 'Full system access, can manage everything' },
    { value: 'platform_admin', label: 'Platform Admin', description: 'Can manage organizations, users, and content' },
    { value: 'support_admin', label: 'Support Admin', description: 'Limited access for support tickets' },
  ];

  // Loading state
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Access denied
  if (!isPlatformOwner) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground mt-2">
            Only platform owners can assign platform roles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Platform Role Management</h1>
        <p className="text-muted-foreground">
          Assign platform roles to users. This grants elevated system access.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assign Form */}
        <div className="lg:col-span-1">
          <div className="p-6 border rounded-lg">
            <h2 className="font-semibold mb-4">Assign Role</h2>

            {message && (
              <div className={`mb-4 p-3 rounded-md text-sm ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  User Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="user@example.com"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  User must have already signed up
                </p>
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium mb-1">
                  Role
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as PlatformRole)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  {roleOptions.find(r => r.value === role)?.description}
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Assigning...' : 'Assign Role'}
              </Button>
            </form>
          </div>
        </div>

        {/* Info Panel & Recent Assignments */}
        <div className="lg:col-span-2 space-y-6">
          {/* About Roles */}
          <div className="p-6 border rounded-lg">
            <h2 className="font-semibold mb-4">About Platform Roles</h2>
            <div className="space-y-3">
              <div className="p-3 bg-muted/30 rounded-md">
                <h3 className="font-medium text-sm">🔑 Platform Owner</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Full system access. Can assign all roles, manage organizations, 
                  view all data, and configure platform settings.
                </p>
              </div>
              <div className="p-3 bg-muted/30 rounded-md">
                <h3 className="font-medium text-sm">🛡️ Platform Admin</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Can manage organizations, users, content, and platform settings.
                  Cannot assign platform owner role.
                </p>
              </div>
              <div className="p-3 bg-muted/30 rounded-md">
                <h3 className="font-medium text-sm">🆘 Support Admin</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Limited access for handling support tickets and user issues.
                  Cannot manage platform settings or assign roles.
                </p>
              </div>
            </div>
          </div>

          {/* Recent Assignments - Audit Trail */}
          <div className="p-6 border rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Recent Assignments</h2>
              <button
                onClick={fetchRecentAssignments}
                className="text-xs text-primary hover:underline"
              >
                Refresh
              </button>
            </div>

            {recentAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No assignments yet</p>
            ) : (
              <div className="space-y-2">
                {recentAssignments.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
                    <div>
                      <div className="text-sm font-medium">
                        {log.details?.assigned_to || 'Unknown user'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {log.details?.role || 'Unknown role'} • 
                        Assigned by {log.details?.assigned_by || 'Unknown'}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      {new Date(log.created_at).toLocaleDateString()}
                      <br />
                      {new Date(log.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs text-amber-700">
          ⚠️ Platform roles grant significant system access. Only assign to trusted personnel. 
          All assignments are logged in the audit trail.
        </p>
      </div>
    </div>
  );
}