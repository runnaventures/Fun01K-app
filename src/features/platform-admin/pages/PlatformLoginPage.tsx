// src/features/platform-admin/pages/PlatformLoginPage.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';

export default function PlatformLoginPage() {
  const navigate = useNavigate();
  const { signIn, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  // Auto-redirect if already logged in as platform user
  useEffect(() => {
    if (user) {
      checkPlatformAccess(user.id);
    }
  }, [user]);

  const checkPlatformAccess = async (userId: string) => {
    try {
      // Get the platform organization dynamically
      const { data: platformOrg, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', 'platform')
        .maybeSingle();

      if (orgError || !platformOrg) {
        console.error('Platform organization not found:', orgError);
        setError('Platform organization not configured');
        await supabase.auth.signOut();
        return;
      }

      // Check if user is a member of the platform org
      const { data: member, error: memberError } = await supabase
        .from('organization_members')
        .select('roles')
        .eq('profile_id', userId)
        .eq('organization_id', platformOrg.id)
        .maybeSingle();

      if (memberError) {
        console.error('Error checking member:', memberError);
        setError('Access verification failed');
        await supabase.auth.signOut();
        return;
      }

      const roles = member?.roles || [];
      if (roles.includes('platform_owner') || roles.includes('platform_admin')) {
        navigate('/platform');
      } else {
        await supabase.auth.signOut();
        setError('You do not have platform access');
      }
    } catch (error) {
      console.error('Error checking platform access:', error);
      await supabase.auth.signOut();
      setError('Access verification failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (attemptCount >= 5) {
      setError('Too many login attempts. Please try again later.');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setAttemptCount((prev) => prev + 1);
        setError(error.message || 'Failed to sign in');
        setIsLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await checkPlatformAccess(user.id);
      }
    } catch (err) {
      setAttemptCount((prev) => prev + 1);
      setError('An unexpected error occurred');
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 bg-card rounded-lg border shadow-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
              <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Administration</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Secure access for platform administrators
          </p>
          {attemptCount > 0 && attemptCount < 5 && (
            <p className="text-xs text-muted-foreground mt-2">
              Login attempts: {attemptCount}/5
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded-md text-destructive text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="admin@yourcompany.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? 'Verifying access...' : 'Access Platform'}
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t text-center">
          <div className="text-xs text-muted-foreground">
            This area is restricted to authorized personnel only
          </div>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-2 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Return to employee login
          </button>
        </div>
      </div>
    </div>
  );
}