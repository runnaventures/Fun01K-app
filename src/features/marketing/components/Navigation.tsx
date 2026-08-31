import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';

interface NavItem {
  label: string;
  href: string;
}

interface MarketingNavigationProps {
  onLoginClick?: () => void;
  onSignupClick?: () => void;
}

const navItems: NavItem[] = [
  { label: 'Product', href: '/#product' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export function MarketingNavigation({ onLoginClick, onSignupClick }: MarketingNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogin = () => {
    if (onLoginClick) {
      onLoginClick();
    }
  };

  const handleSignup = () => {
    if (onSignupClick) {
      onSignupClick();
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Container>
        <div className="flex h-16 items-center justify-between">
          {/* Logo - Removed dark background */}
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src="/images/logo.png" 
              alt="Fun01K" 
              className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="text-lg font-bold tracking-tight">Fun01K</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogin}
              className="font-medium"
            >
              Sign In
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSignup}
              className="font-medium shadow-xs hover:shadow-sm transition-shadow"
            >
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-md hover:bg-muted transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
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

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-border/40 py-4 space-y-1 animate-fade-in">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-border/40 pt-4 mt-2 space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start font-medium"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogin();
                }}
              >
                Sign In
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="w-full justify-start font-medium"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleSignup();
                }}
              >
                Get Started
              </Button>
            </div>
          </div>
        )}
      </Container>
    </header>
  );
}