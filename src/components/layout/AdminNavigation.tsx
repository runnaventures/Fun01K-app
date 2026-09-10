// src/components/layout/AdminNavigation.tsx

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { useOrganization } from '@/app/providers/OrganizationProvider';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  LayoutDashboard, 
  Calendar, 
  Gift, 
  Users, 
  Settings,
  LogOut,
  User,
  Menu,
  X,
  ChevronDown,
  Home,
  Building2,
  Plug,
  Building
} from 'lucide-react';

interface AdminNavigationProps {
  type: 'company' | 'platform';
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const companyNavItems: NavItem[] = [
  { label: 'Home', href: '/admin', icon: <Home className="w-4 h-4" /> },
  { label: 'Team', href: '/admin/employees', icon: <Users className="w-4 h-4" /> },
  { label: 'Activities', href: '/admin/activities', icon: <Calendar className="w-4 h-4" /> },
  { label: 'Rewards', href: '/admin/rewards', icon: <Gift className="w-4 h-4" /> },
  { label: 'Settings', href: '/admin/settings', icon: <Settings className="w-4 h-4" /> },
];

const platformNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/platform', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Organizations', href: '/platform/organizations', icon: <Building2 className="w-4 h-4" /> },
  { label: 'Users', href: '/platform/users', icon: <Users className="w-4 h-4" /> },
  { label: 'Activities', href: '/platform/activities', icon: <Calendar className="w-4 h-4" /> },
  { label: 'Rewards', href: '/platform/rewards', icon: <Gift className="w-4 h-4" /> },
  { label: 'Integrations', href: '/platform/integrations', icon: <Plug className="w-4 h-4" /> },
  { label: 'Settings', href: '/platform/settings', icon: <Settings className="w-4 h-4" /> },
];

export function AdminNavigation({ type }: AdminNavigationProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { organizationMember } = useOrganization();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [companyCode, setCompanyCode] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const navItems = type === 'company' ? companyNavItems : platformNavItems;
  const basePath = type === 'company' ? '/admin' : '/platform';
  const profilePath = type === 'company' ? '/admin/profile' : '/platform/profile';

  // Fetch company info including logo
  useEffect(() => {
    const fetchCompanyInfo = async () => {
      if (!organizationMember?.organization_id) return;

      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('name, company_code, logo_url')
          .eq('id', organizationMember.organization_id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching company info:', error);
          return;
        }

        if (data) {
          setCompanyName(data.name || '');
          setCompanyCode(data.company_code || '');
          setCompanyLogo(data.logo_url || null);
        }
      } catch (error) {
        console.error('Error fetching company info:', error);
      }
    };

    fetchCompanyInfo();
  }, [organizationMember?.organization_id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isDropdownOpen) {
        const target = e.target as HTMLElement;
        if (!target.closest('.company-dropdown')) {
          setIsDropdownOpen(false);
        }
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isDropdownOpen]);

  const displayCode = type === 'company' && companyCode ? companyCode : '';

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    await signOut();
  };

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    if (type === 'company') {
      navigate('/admin/profile');
    } else {
      navigate('/platform/profile');
    }
  };

  const isActiveRoute = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  // Get user initials
  const getUserInitials = () => {
    const email = user?.email || '';
    if (email) {
      const parts = email.split('@')[0].split('.');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
      {/* Top Bar - Logo & Company */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo & Platform Name */}
          <div className="flex items-center gap-6">
            <Link to={basePath} className="flex items-center gap-3 shrink-0">
              <img 
                src="/images/logo.png" 
                alt="Fun01K" 
                className="h-8 w-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span className="text-lg font-bold text-slate-800">Fun01K</span>
            </Link>
          </div>

          {/* Right: Company Logo & Name - Clickable Dropdown */}
          <div className="flex items-center gap-4">
            {/* Company Dropdown */}
            <div className="relative company-dropdown">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 hover:bg-slate-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer group"
              >
                {companyLogo ? (
                  <img 
                    src={companyLogo} 
                    alt={companyName || 'Company'} 
                    className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {companyName?.charAt(0) || 'C'}
                  </div>
                )}
                <div className="text-left hidden md:block">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800 leading-tight group-hover:text-primary transition-colors">
                      {companyName || 'My Company'}
                    </p>
                  </div>
                  {displayCode && (
                    <p className="text-xs text-slate-500 leading-tight">
                      Code: {displayCode}
                    </p>
                  )}
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 text-slate-400 transition-transform duration-200",
                  isDropdownOpen && "rotate-180"
                )} />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-lg py-1.5 overflow-hidden z-50">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                        {getUserInitials()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {user?.email}
                        </p>
                        <p className="text-xs text-slate-500">
                          {type === 'company' ? 'Company Admin' : 'Platform Admin'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Company Profile Link */}
                  {type === 'company' && (
                    <button
                      onClick={handleProfileClick}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Building className="w-4 h-4" />
                      Company Profile
                    </button>
                  )}

                  {/* Sign Out */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100 mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button - ONLY visible on mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-slate-600" />
              ) : (
                <Menu className="w-5 h-5 text-slate-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Bar - Desktop only (hidden on mobile) */}
      <div className="hidden lg:block border-t border-slate-100 bg-slate-50/50 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 overflow-x-auto py-1.5">
          {navItems.map((item) => {
            const isActive = isActiveRoute(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap',
                  isActive
                    ? 'bg-primary text-white shadow-sm shadow-primary/20'
                    : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Mobile Navigation Menu - ONLY visible on mobile */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white shadow-lg max-h-[80vh] overflow-y-auto">
          <nav className="px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActiveRoute(item.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
            <div className="pt-2 mt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleProfileClick();
                }}
                className="flex items-center gap-3 px-3 py-2.5 w-full text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              >
                {companyLogo ? (
                  <img 
                    src={companyLogo} 
                    alt={companyName || 'Company'} 
                    className="w-6 h-6 rounded object-cover"
                  />
                ) : (
                  <Building className="w-4 h-4" />
                )}
                <span className="flex-1 text-left">{companyName || 'My Company'}</span>
                {displayCode && <span className="text-xs text-slate-400">Code: {displayCode}</span>}
              </button>
              <div className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-500">
                <User className="w-4 h-4" />
                {user?.email}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 w-full text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}