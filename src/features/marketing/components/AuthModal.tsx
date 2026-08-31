import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { Button } from '@/components/ui/Button';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companySlug, setCompanySlug] = useState('');
  const [adminName, setAdminName] = useState('');
  const [registrationType, setRegistrationType] = useState<'company' | 'individual'>('company');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setSuccess(false);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    }
  }, [isOpen]);

  // Reset to login mode when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message || 'Failed to sign in');
        return;
      }
      onClose();
      navigate('/app');
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (registrationType === 'company') {
      if (!companyName) {
        setError('Company name is required');
        return;
      }
      if (!adminName) {
        setError('Administrator name is required');
        return;
      }
    } else {
      if (!firstName || !lastName) {
        setError('First and last name are required');
        return;
      }
    }

    setIsLoading(true);

    try {
      let metadata: Record<string, any> = {};
      
      if (registrationType === 'company') {
        const nameParts = adminName.trim().split(' ');
        const first = nameParts[0] || '';
        const last = nameParts.slice(1).join(' ') || '';
        
        metadata = {
          first_name: first,
          last_name: last,
          registration_type: 'company',
          company_name: companyName,
          company_slug: companySlug || companyName.toLowerCase().replace(/\s+/g, '-'),
          role: 'company_owner',
        };
      } else {
        metadata = {
          first_name: firstName,
          last_name: lastName,
          registration_type: 'individual',
          role: 'employee',
        };
      }

      const { data, error } = await signUp(email, password, metadata);

      if (error) {
        setError(error.message || 'Failed to sign up');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-background rounded-2xl shadow-xl border max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === 'login' 
                ? 'Sign in to your Fun01K account' 
                : 'Start building a more engaged workplace'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded-md text-destructive text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500 rounded-md text-green-600 text-sm text-center">
              Account created successfully! Please check your email to verify.
            </div>
          )}

          {mode === 'login' ? (
            // Login Form
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium mb-1">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="block text-sm font-medium mb-1">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-primary hover:underline font-medium"
                >
                  Sign up
                </button>
              </p>
            </form>
          ) : (
            // Signup Form
            <form onSubmit={handleSignup} className="space-y-4">
              {/* Registration Type */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRegistrationType('company')}
                  className={`p-3 rounded-lg border text-center transition-colors ${
                    registrationType === 'company'
                      ? 'border-primary bg-primary/5'
                      : 'border-input hover:bg-muted/50'
                  }`}
                >
                  <div className="text-lg mb-0.5">🏢</div>
                  <div className="text-xs font-medium">Company</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRegistrationType('individual')}
                  className={`p-3 rounded-lg border text-center transition-colors ${
                    registrationType === 'individual'
                      ? 'border-primary bg-primary/5'
                      : 'border-input hover:bg-muted/50'
                  }`}
                >
                  <div className="text-lg mb-0.5">👤</div>
                  <div className="text-xs font-medium">Individual</div>
                </button>
              </div>

              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium mb-1">
                  Email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="you@example.com"
                />
              </div>

              {registrationType === 'company' ? (
                <>
                  <div>
                    <label htmlFor="admin-name" className="block text-sm font-medium mb-1">
                      Administrator Name
                    </label>
                    <input
                      id="admin-name"
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label htmlFor="company-name" className="block text-sm font-medium mb-1">
                      Company Name
                    </label>
                    <input
                      id="company-name"
                      type="text"
                      value={companyName}
                      onChange={(e) => {
                        const name = e.target.value;
                        setCompanyName(name);
                        if (!companySlug) {
                          setCompanySlug(generateSlug(name));
                        }
                      }}
                      required
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Acme Inc."
                    />
                  </div>
                  <div>
                    <label htmlFor="company-slug" className="block text-sm font-medium mb-1">
                      Company URL <span className="text-xs text-muted-foreground">(Optional)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">fun01k.com/</span>
                      <input
                        id="company-slug"
                        type="text"
                        value={companySlug}
                        onChange={(e) => setCompanySlug(generateSlug(e.target.value))}
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="acme-inc"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="first-name" className="block text-sm font-medium mb-1">
                      First Name
                    </label>
                    <input
                      id="first-name"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label htmlFor="last-name" className="block text-sm font-medium mb-1">
                      Last Name
                    </label>
                    <input
                      id="last-name"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Doe"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium mb-1">
                  Password
                </label>
                <input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                />
                <p className="text-xs text-muted-foreground mt-1">Must be at least 6 characters</p>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}