// src/app/layouts/EmployeeLayout.tsx

import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { useOrganization } from '../providers/OrganizationProvider';
import { cn, getInitials } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import { Footer } from '@/components/layout/Footer';
import {
  LayoutDashboard,
  Calendar,
  Gift,
  Wallet,
  User,
  LogOut,
  ChevronDown,
  Mail,
  Building2,
  Menu,
  X,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export default function EmployeeLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { organizationMember } = useOrganization();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen]);

  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/app', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Activities', href: '/app/activities', icon: <Calendar className="w-5 h-5" /> },
    { label: 'Rewards', href: '/app/rewards', icon: <Gift className="w-5 h-5" /> },
    { label: 'Wallet', href: '/app/wallet', icon: <Wallet className="w-5 h-5" /> },
    { label: 'Profile', href: '/app/profile', icon: <User className="w-5 h-5" /> },
  ];

  // Derive display name / avatar from user metadata (fallback to email prefix)
  const firstName = (user?.user_metadata?.first_name as string) || '';
  const lastName = (user?.user_metadata?.last_name as string) || '';
  const fullName =
    `${firstName} ${lastName}`.trim() ||
    user?.email?.split('@')[0] ||
    'User';
  const avatarUrl = (user?.user_metadata?.avatar_url as string) || null;
  const departmentId =
    (organizationMember as any)?.department_id ??
    (organizationMember as any)?.profiles?.department_id ??
    null;

  const handleSignOut = async () => {
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    await signOut();
  };

  const handleGoToProfile = () => {
    setIsProfileOpen(false);
    navigate('/app/profile');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F3]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <button
            onClick={() => navigate('/app')}
            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
          >
            <img
              src="/images/logo.png"
              alt="Fun01K"
              className="h-8 w-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="text-lg font-bold">Fun01K</span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/app'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right side: Profile dropdown */}
          <div className="flex items-center gap-2">
            {/* Desktop: avatar button + dropdown */}
            <div className="relative hidden sm:block" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border px-2 py-1 hover:bg-muted transition-colors"
                aria-haspopup="menu"
                aria-expanded={isProfileOpen}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {getInitials(fullName)}
                  </div>
                )}
                <span className="hidden lg:inline text-sm font-medium max-w-[120px] truncate">
                  {fullName}
                </span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform',
                    isProfileOpen && 'rotate-180'
                  )}
                />
              </button>

              {/* Dropdown menu */}
              {isProfileOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-64 rounded-xl border bg-popover shadow-lg overflow-hidden z-50"
                >
                  {/* Profile header */}
                  <div className="flex items-center gap-3 p-4 border-b">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={fullName}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {getInitials(fullName)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{fullName}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="truncate">{user?.email}</span>
                      </p>
                    </div>
                  </div>

                  {/* Department (if any) */}
                  {departmentId && (
                    <div className="px-4 py-3 border-b bg-muted/30">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Department
                      </p>
                      <p className="mt-1 text-sm font-medium flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        {departmentId}
                      </p>
                    </div>
                  )}

                  {/* Menu items */}
                  <div className="py-1">
                    <button
                      onClick={handleGoToProfile}
                      role="menuitem"
                      className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      View profile
                    </button>
                  </div>

                  {/* Sign out (under profile) */}
                  <div className="border-t">
                    <button
                      onClick={handleSignOut}
                      role="menuitem"
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile: menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md hover:bg-muted transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <div className="container px-4 py-4 space-y-1">
              {/* Mobile profile header */}
              <div className="flex items-center gap-3 pb-4 mb-2 border-b">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {getInitials(fullName)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
              </div>

              {/* Nav links */}
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === '/app'}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}

              {/* Mobile sign out */}
              <div className="border-t pt-4 mt-4">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}