// src/app/layouts/EmployeeLayout.tsx

import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { useOrganization } from '../providers/OrganizationProvider';
import { usePointsAccount } from '@/features/employee/queries/pointsQueries';
import {
  useUpcomingReminders,
  groupReminders,
  formatTimeUntil,
  urgencyStyles,
  type Reminder,
} from '@/features/employee/hooks/useUpcomingReminders';
import { cn, getInitials } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import { Footer } from '@/components/layout/Footer';
import {
  Home,
  Calendar,
  Gift,
  Wallet,
  LogOut,
  ChevronDown,
  Mail,
  Crown,
  Bell,
  Menu,
  X,
  MapPin,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

function getLevel(points: number): number {
  return Math.max(1, Math.floor(points / 150) + 1);
}

export default function EmployeeLayout() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { organizationMember } = useOrganization();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const remindersRef = useRef<HTMLDivElement>(null);

  const userId = user?.id || '';
  const { data: account } = usePointsAccount(userId);
  const points = account?.balance ?? 0;
  const level = getLevel(points);

  const { reminders, isLoading: remindersLoading } = useUpcomingReminders(userId);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (profileRef.current && !profileRef.current.contains(target)) {
        setIsProfileOpen(false);
      }
      if (remindersRef.current && !remindersRef.current.contains(target)) {
        setIsRemindersOpen(false);
      }
    }
    if (isProfileOpen || isRemindersOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen, isRemindersOpen]);

  const navItems: NavItem[] = [
    { label: 'Home', href: '/app', icon: <Home className="w-5 h-5" /> },
    { label: 'Activities', href: '/app/activities', icon: <Calendar className="w-5 h-5" /> },
    { label: 'Rewards', href: '/app/rewards', icon: <Gift className="w-5 h-5" /> },
    { label: 'Wallet', href: '/app/wallet', icon: <Wallet className="w-5 h-5" /> },
  ];

  const firstName = (user?.user_metadata?.first_name as string) || '';
  const lastName = (user?.user_metadata?.last_name as string) || '';
  const fullName =
    `${firstName} ${lastName}`.trim() ||
    user?.email?.split('@')[0] ||
    'User';
  const avatarUrl = (user?.user_metadata?.avatar_url as string) || null;

  const handleSignOut = async () => {
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    await signOut();
  };

  const handleGoToProfile = () => {
    setIsProfileOpen(false);
    navigate('/app/profile');
  };

  const reminderCount = reminders.length;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F3]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between gap-3 px-4">
          {/* Logo */}
          <button
            onClick={() => navigate('/app')}
            className="flex items-center gap-3 hover:opacity-90 transition-opacity shrink-0"
          >
            <img
              src="/images/logo.png"
              alt="Fun01K"
              className="h-8 w-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="text-lg font-bold hidden sm:inline">Fun01K</span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/app'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all',
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right side: Reminders bell + Level chip + Profile dropdown */}
          <div className="flex items-center gap-2">
            {/* Reminders bell */}
            <div className="relative" ref={remindersRef}>
              <button
                onClick={() => setIsRemindersOpen((v) => !v)}
                className={cn(
                  'relative flex h-9 w-9 items-center justify-center rounded-full border hover:bg-muted transition-colors',
                  isRemindersOpen && 'bg-muted'
                )}
                aria-label="Reminders"
                aria-haspopup="menu"
                aria-expanded={isRemindersOpen}
              >
                <Bell className="h-4 w-4" />
                {reminderCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                    {reminderCount > 9 ? '9+' : reminderCount}
                  </span>
                )}
              </button>

              {/* Reminders dropdown — grouped, richly styled */}
              {isRemindersOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-[420px] max-w-[calc(100vw-2rem)] rounded-2xl border bg-popover shadow-2xl overflow-hidden z-50"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-foreground" />
                      <p className="text-sm font-bold">Reminders</p>
                    </div>
                    {reminderCount > 0 ? (
                      <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-[11px] font-bold text-rose-600">
                        {reminderCount} upcoming
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">All clear</span>
                    )}
                  </div>

                  {/* Body */}
                  {remindersLoading ? (
                    <div className="p-6 text-center">
                      <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
                      <p className="text-xs text-muted-foreground">Loading…</p>
                    </div>
                  ) : reminders.length === 0 ? (
                    <div className="px-6 py-10 text-center">
                      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                        <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                      </div>
                      <p className="text-sm font-semibold">You're all caught up</p>
                      <p className="mx-auto mt-1 max-w-[240px] text-xs text-muted-foreground">
                        No activities starting in the next 24 hours. Join one to see
                        reminders here.
                      </p>
                      <button
                        onClick={() => {
                          setIsRemindersOpen(false);
                          navigate('/app/discover');
                        }}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Discover activities
                      </button>
                    </div>
                  ) : (
                    <div className="max-h-[420px] overflow-y-auto">
                      {groupReminders(reminders).map((group) => (
                        <div key={group.urgency}>
                          {/* Group header */}
                          <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                            <span
                              className={cn(
                                'h-1.5 w-1.5 rounded-full',
                                urgencyStyles(group.urgency).dot
                              )}
                            />
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              {group.label}
                            </p>
                          </div>

                          {/* Group items */}
                          <div className="px-2 pb-1">
                            {group.items.map((reminder: Reminder) => {
                              const styles = urgencyStyles(group.urgency);
                              return (
                                <div
                                  key={reminder.id}
                                  className="group relative flex items-start gap-3 rounded-xl px-2 py-2.5 hover:bg-muted/60 transition-colors"
                                >
                                  {/* Urgency bar */}
                                  <span
                                    className={cn(
                                      'mt-1 h-9 w-1 shrink-0 rounded-full',
                                      styles.bar
                                    )}
                                  />

                                  {/* Content */}
                                  <button
                                    onClick={() => {
                                      setIsRemindersOpen(false);
                                      navigate(`/app/activities/${reminder.activityId}`);
                                    }}
                                    className="min-w-0 flex-1 text-left"
                                  >
                                    <p className="text-sm font-semibold line-clamp-1">
                                      {reminder.title}
                                    </p>
                                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                                      <span className="font-medium text-foreground/80">
                                        {formatTimeUntil(reminder.scheduledAt)}
                                      </span>
                                      {reminder.location && (
                                        <>
                                          <span>·</span>
                                          <span className="inline-flex items-center gap-1 truncate max-w-[140px]">
                                            <MapPin className="h-3 w-3 shrink-0" />
                                            {reminder.location}
                                          </span>
                                        </>
                                      )}
                                      {reminder.pointsReward > 0 && (
                                        <>
                                          <span>·</span>
                                          <span className="font-semibold text-emerald-600">
                                            +{reminder.pointsReward} pts
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </button>

                                  {/* Action button for "starting soon" items */}
                                  {group.urgency === 'soon' && (
                                    <button
                                      onClick={() => {
                                        setIsRemindersOpen(false);
                                        navigate(
                                          `/app/activities/${reminder.activityId}`
                                        );
                                      }}
                                      className={cn(
                                        'shrink-0 self-center rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors',
                                        styles.button
                                      )}
                                    >
                                      Check in
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="border-t bg-muted/20">
                    <button
                      onClick={() => {
                        setIsRemindersOpen(false);
                        navigate('/app/activities');
                      }}
                      className="flex w-full items-center justify-center gap-1.5 px-4 py-3 text-xs font-semibold text-primary hover:bg-muted/40 transition-colors"
                    >
                      View all activities
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Level chip — static badge */}
            <span
              className="hidden md:inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700"
              title={`Level ${level}`}
            >
              <Crown className="h-3.5 w-3.5" />
              <span>Lvl {level}</span>
            </span>

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
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
                <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate">
                  {fullName}
                </span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform',
                    isProfileOpen && 'rotate-180'
                  )}
                />
              </button>

              {isProfileOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-64 rounded-xl border bg-popover shadow-lg overflow-hidden z-50"
                >
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

                  <div className="py-1">
                    <button
                      onClick={handleGoToProfile}
                      role="menuitem"
                      className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      <Home className="h-4 w-4 text-muted-foreground" />
                      View profile
                    </button>
                  </div>

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
              className="lg:hidden p-2 rounded-md hover:bg-muted transition-colors"
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
          <div className="lg:hidden border-t bg-background">
            <div className="container px-4 py-4 space-y-1">
              {/* Mobile: Level chip + reminder count */}
              <div className="flex flex-wrap items-center gap-2 pb-3 mb-3 border-b">
                <span className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
                  <Crown className="h-3.5 w-3.5" />
                  Lvl {level}
                </span>
                {reminderCount > 0 && (
                  <span className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">
                    <Bell className="h-3.5 w-3.5" />
                    {reminderCount} reminder{reminderCount === 1 ? '' : 's'}
                  </span>
                )}
              </div>

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
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>

              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === '/app'}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all',
                      isActive
                        ? 'bg-slate-900 text-white'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate('/app/profile');
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                <Home className="w-5 h-5" />
                View profile
              </button>

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

      <main className="flex-1 container mx-auto px-4 py-8">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}