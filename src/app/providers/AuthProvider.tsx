// src/app/providers/AuthProvider.tsx

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/db';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  userRole: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (
    email: string,
    password: string,
    metadata?: Record<string, any>
  ) => Promise<{ error: any | null; data: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: any | null }>;
  getUserRole: () => Promise<string | null>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cache role to prevent repeated fetches
let cachedRole: string | null = null;
let cachedUserId: string | null = null;
let isRedirecting = false;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(cachedRole);
  const isInitialized = useRef(false);
  const isFetchingRole = useRef(false);
  const hasRedirected = useRef(false);

  const redirectBasedOnRole = (role: string | null) => {
    if (!role || isRedirecting || hasRedirected.current) return;

    isRedirecting = true;
    hasRedirected.current = true;

    console.log('Redirecting based on role:', role);

    const currentPath = window.location.pathname;

    if (
      currentPath === '/login' ||
      currentPath === '/auth/callback' ||
      currentPath.startsWith('/auth/')
    ) {
      isRedirecting = false;
      return;
    }

    if (role === 'platform_owner' || role === 'platform_admin') {
      if (currentPath !== '/platform' && !currentPath.startsWith('/platform/')) {
        navigate('/platform', { replace: true });
      }
    } else if (
      role === 'admin' ||
      role === 'company_owner' ||
      role === 'company_admin' ||
      role === 'manager'
    ) {
      if (currentPath !== '/admin' && !currentPath.startsWith('/admin/')) {
        navigate('/admin', { replace: true });
      }
    } else {
      if (currentPath !== '/app' && !currentPath.startsWith('/app/')) {
        navigate('/app', { replace: true });
      }
    }

    setTimeout(() => {
      isRedirecting = false;
    }, 500);
  };

  const getUserRoleFromSession = async (user: User) => {
    if (isFetchingRole.current) {
      console.log('Role fetch already in progress, skipping...');
      return cachedRole || 'employee';
    }

    if (cachedUserId === user.id && cachedRole) {
      console.log('Using cached role:', cachedRole);
      setUserRole(cachedRole);
      return cachedRole;
    }

    isFetchingRole.current = true;

    try {
      console.log('Fetching role for user:', user.id);

      const { data: profile, error: profileError } = await db.profiles.getById(
        user.id
      );

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      if (!profile) {
        console.log('No profile found for user, creating one...');
        const { error: createError } = await db.profiles.create({
          id: user.id,
          email: user.email,
          first_name: user.user_metadata?.first_name || 'User',
          last_name: user.user_metadata?.last_name || '',
          timezone: user.user_metadata?.timezone || 'UTC',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (createError) {
          console.error('Error creating profile:', createError);
        }
      }

      const { data: member, error } = await db.organizationMembers.getRolesByProfileId(
        user.id
      );

      console.log('Role data:', member);
      console.log('Role error:', error);

      if (error) {
        console.error('Error fetching role:', error);
        setUserRole('employee');
        cachedRole = 'employee';
        cachedUserId = user.id;
        return 'employee';
      }

      let roles: string[] = [];
      if (member && typeof member === 'object') {
        if (Array.isArray(member)) {
          roles = member.length > 0 ? member[0]?.roles || [] : [];
        } else if ((member as any).roles) {
          roles = (member as any).roles;
        }
      }

      if (roles.length > 0) {
        console.log('Found roles:', roles);

        if (roles.includes('platform_owner') || roles.includes('platform_admin')) {
          console.log('Setting role to platform_owner');
          setUserRole('platform_owner');
          cachedRole = 'platform_owner';
          cachedUserId = user.id;
          return 'platform_owner';
        }

        if (
          roles.includes('company_owner') ||
          roles.includes('company_admin') ||
          roles.includes('manager')
        ) {
          console.log('Setting role to admin');
          setUserRole('admin');
          cachedRole = 'admin';
          cachedUserId = user.id;
          return 'admin';
        }
      }

      console.log('Setting role to employee');
      setUserRole('employee');
      cachedRole = 'employee';
      cachedUserId = user.id;
      return 'employee';
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('employee');
      cachedRole = 'employee';
      cachedUserId = user.id;
      return 'employee';
    } finally {
      isFetchingRole.current = false;
    }
  };

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const initSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          setUser(null);
          setSession(null);
          setIsLoading(false);
          return;
        }

        if (session) {
          console.log('Session found:', session.user.email);
          setSession(session);
          setUser(session.user);
          const role = await getUserRoleFromSession(session.user);
          if (role && !hasRedirected.current) {
            redirectBasedOnRole(role);
          }
        } else {
          console.log('No session found');
          setUser(null);
          setSession(null);
          cachedRole = null;
          cachedUserId = null;
        }
      } catch (error) {
        console.error('Error initializing session:', error);
        setUser(null);
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    let authTimeout: ReturnType<typeof setTimeout> | null = null;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (authTimeout) {
          clearTimeout(authTimeout);
        }

        authTimeout = setTimeout(async () => {
          console.log('Auth state changed:', event, session?.user?.email);

          if (
            event === 'SIGNED_IN' ||
            event === 'TOKEN_REFRESHED' ||
            event === 'USER_UPDATED'
          ) {
            if (session) {
              setSession(session);
              setUser(session.user);
              const role = await getUserRoleFromSession(session.user);
              if (role && event === 'SIGNED_IN') {
                hasRedirected.current = false;
                redirectBasedOnRole(role);
              }
            }
          } else if (event === 'SIGNED_OUT') {
            setSession(null);
            setUser(null);
            setUserRole(null);
            cachedRole = null;
            cachedUserId = null;
            hasRedirected.current = false;
            isRedirecting = false;
          }
          setIsLoading(false);
        }, 100);
      }
    );

    return () => {
      if (authTimeout) {
        clearTimeout(authTimeout);
      }
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Signing in:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Sign in response:', { data, error });

      if (!error && data.user) {
        hasRedirected.current = false;
        const role = await getUserRoleFromSession(data.user);
        if (role) {
          redirectBasedOnRole(role);
        }
      }
      return { error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    metadata?: Record<string, any>
  ) => {
    try {
      console.log('Signing up with metadata:', metadata);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      console.log('Sign up response:', { data, error });

      if (error) {
        console.error('Sign up error:', error);
        return { data, error };
      }

      if (metadata?.registration_type === 'company' && data.user) {
        console.log('Company registration detected, waiting for trigger...');
        await new Promise((resolve) => setTimeout(resolve, 1000));
        hasRedirected.current = false;
        const role = await getUserRoleFromSession(data.user);
        if (role) {
          redirectBasedOnRole(role);
        }
      }

      return { data, error };
    } catch (error) {
      console.error('Sign up catch error:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUserRole(null);
      setUser(null);
      setSession(null);
      cachedRole = null;
      cachedUserId = null;
      hasRedirected.current = false;
      isRedirecting = false;
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const getUserRole = async (): Promise<string | null> => {
    if (!user) return null;
    const role = await getUserRoleFromSession(user);
    return role;
  };

  const refreshUser = async () => {
    if (!user) return;
    cachedRole = null;
    cachedUserId = null;
    await getUserRoleFromSession(user);
  };

  const value = {
    session,
    user,
    isLoading,
    userRole,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    getUserRole,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}