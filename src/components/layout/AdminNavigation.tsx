import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface AdminNavigationProps {
  type: 'company' | 'platform';
}

interface NavItem {
  label: string;
  href: string;
}

const companyNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Employees', href: '/admin/employees' },
  { label: 'Teams', href: '/admin/teams' },
  { label: 'Departments', href: '/admin/departments' },
  { label: 'Categories', href: '/admin/categories' },
  { label: 'Activities', href: '/admin/activities' },
  { label: 'Challenges', href: '/admin/challenges' },
  { label: 'Rewards', href: '/admin/rewards' },
  { label: 'Locations', href: '/admin/locations' },
  { label: 'Analytics', href: '/admin/analytics' },
  { label: 'Settings', href: '/admin/settings' },
  { label: 'Audit', href: '/admin/audit' },
];

const platformNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/platform' },
  { label: 'Organizations', href: '/platform/organizations' },
  { label: 'Users', href: '/platform/users' },
  { label: 'Activities', href: '/platform/activities' },
  { label: 'Rewards', href: '/platform/rewards' },
  { label: 'Analytics', href: '/platform/analytics' },
  { label: 'Moderation', href: '/platform/moderation' },
  { label: 'Fraud', href: '/platform/fraud' },
  { label: 'Settings', href: '/platform/settings' },
  { label: 'Audit', href: '/platform/audit' },
];

export function AdminNavigation({ type }: AdminNavigationProps) {
  const location = useLocation();
  const { signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = type === 'company' ? companyNavItems : platformNavItems;
  const basePath = type === 'company' ? '/admin' : '/platform';
  const brandName = type === 'company' ? 'Fun01K Admin' : 'Fun01K Platform';

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4"> {/* Reduced gap from gap-8 to gap-4 */}
          <Link to={basePath} className="flex items-center gap-2 text-xl font-bold text-foreground flex-shrink-0">
            <img 
              src="/images/logo.png" 
              alt="Fun01K" 
              className="h-8 w-auto"  // Reduced from h-10 back to h-8
            />
            <span className="hidden sm:inline">{brandName}</span> {/* Hide text on small screens */}
          </Link>
          <nav className="hidden lg:flex items-center gap-0.5 overflow-x-auto"> {/* Reduced gap */}
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap', // Smaller padding and font
                  location.pathname === item.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            to="/app"
            className="hidden sm:inline-block text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            Switch to Employee
          </Link>
          <button
            onClick={signOut}
            className="hidden sm:inline-block text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            Sign out
          </button>
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-md hover:bg-muted transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isMobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t bg-background">
          <div className="container px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  'block px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  location.pathname === item.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t pt-4 mt-4 space-y-1">
              <Link
                to="/app"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Switch to Employee
              </Link>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  signOut();
                }}
                className="block w-full text-left px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}