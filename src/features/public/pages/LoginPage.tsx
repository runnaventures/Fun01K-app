// src/features/auth/pages/LoginPage.tsx

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { MarketingNavigation } from '@/features/public/components/Navigation';
import { MarketingFooter } from '@/features/public/components/Footer';
import { supabase } from '@/lib/supabase';

type UserRole = 'employee' | 'admin';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, user, userRole, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const hasRedirected = useRef(false);

  // Check if user is already logged in and redirect appropriately
  useEffect(() => {
    if (user && !authLoading && !hasRedirected.current) {
      hasRedirected.current = true;
      redirectBasedOnRole();
    }
  }, [user, authLoading]);

  const redirectBasedOnRole = () => {
    console.log('Redirecting based on role:', userRole);
    
    if (userRole === 'platform_owner' || userRole === 'platform_admin') {
      window.location.href = '/platform';
    } else if (userRole === 'admin') {
      window.location.href = '/admin';
    } else {
      window.location.href = '/app';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message || 'Failed to sign in');
        setIsLoading(false);
        return;
      }

      // ✅ Use window.location for immediate redirect
      // Wait a moment for the session to be fully established
      setTimeout(() => {
        if (userRole === 'platform_owner' || userRole === 'platform_admin') {
          window.location.href = '/platform';
        } else if (userRole === 'admin') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/app';
        }
      }, 300);
      
    } catch (err) {
      setError('An unexpected error occurred');
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    { 
      value: 'employee', 
      label: '👤 Employee', 
      description: 'Access activities, challenges, and rewards' 
    },
    { 
      value: 'admin', 
      label: '🛡️ Company Admin', 
      description: 'Manage your organization' 
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MarketingNavigation />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <Container maxWidth="sm">
          <div className="rounded-lg border bg-card p-8 shadow-sm">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome Back
              </h1>
              <p className="text-muted-foreground mt-2">
                Sign in to your account to continue
              </p>
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
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="you@example.com"
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

              <div>
                <label className="block text-sm font-medium mb-2">
                  I want to sign in as
                </label>
                <div className="grid gap-2">
                  {roleOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        role === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-input hover:bg-muted/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={option.value}
                        checked={role === option.value}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                        className="h-4 w-4 text-primary"
                      />
                      <div>
                        <div className="font-medium text-sm">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </div>

            <div className="mt-2 text-center text-sm">
              <Link to="/auth/reset-password" className="text-muted-foreground hover:text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
          </div>
        </Container>
      </main>

      <MarketingFooter />
    </div>
  );
}