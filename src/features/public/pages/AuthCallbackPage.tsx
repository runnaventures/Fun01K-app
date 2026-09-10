// src/features/auth/pages/AuthCallbackPage.tsx

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          navigate('/login');
          return;
        }

        if (!data.session) {
          navigate('/login');
          return;
        }

        const userId = data.session.user.id;

        try {
          // Get the platform organization dynamically
          const { data: platformOrg } = await supabase
            .from('organizations')
            .select('id')
            .eq('slug', 'platform')
            .maybeSingle();

          // Check if user is a platform admin
          if (platformOrg) {
            const { data: platformMember } = await supabase
              .from('organization_members')
              .select('roles')
              .eq('profile_id', userId)
              .eq('organization_id', platformOrg.id)
              .maybeSingle();

            if (platformMember?.roles) {
              if (platformMember.roles.includes('platform_owner') || 
                  platformMember.roles.includes('platform_admin')) {
                navigate('/platform');
                return;
              }
            }
          }

          // Check if user is a company admin (any other organization)
          const { data: companyMember } = await supabase
            .from('organization_members')
            .select('roles, organization_id')
            .eq('profile_id', userId)
            .neq('organization_id', platformOrg?.id || '00000000-0000-0000-0000-000000000000')
            .maybeSingle();

          if (companyMember?.roles) {
            if (companyMember.roles.includes('company_admin') || 
                companyMember.roles.includes('company_owner')) {
              navigate('/admin');
              return;
            }
          }

          // Default to employee dashboard
          navigate('/app');
        } catch (err) {
          console.error('Error checking user role:', err);
          navigate('/app');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="mt-4 text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
}