import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/app' },
  { label: 'Discover', href: '/app/discover' },
  { label: 'Activities', href: '/app/activities' },
  { label: 'Challenges', href: '/app/challenges' },
  { label: 'Feed', href: '/app/feed' },
  { label: 'Rewards', href: '/app/rewards' },
  { label: 'Wallet', href: '/app/wallet' },
  { label: 'Leaderboard', href: '/app/leaderboard' },
];

export function Navigation() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to="/app" className="flex items-center gap-2 text-xl font-bold text-foreground">
            <img 
              src="/images/logo.png" 
              alt="Fun01K" 
              className="h-10 w-auto"  // Increased from h-8 to h-10
            />
            <span>Fun01K</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
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
        <div className="flex items-center gap-4">
          <Link
            to="/app/profile"
            className="hidden sm:inline-flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors whitespace-nowrap"
          >
            <span>{user?.email}</span>
          </Link>
          <button
            onClick={signOut}
            className="hidden sm:inline-block text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            Sign out
          </button>
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-md hover:bg-muted transition-colors"
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
        <div className="md:hidden border-t bg-background">
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
                to="/app/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {user?.email || 'Profile'}
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