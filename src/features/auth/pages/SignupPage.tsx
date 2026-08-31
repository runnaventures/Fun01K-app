import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { MarketingNavigation } from '@/features/marketing/components/Navigation';
import { MarketingFooter } from '@/features/marketing/components/Footer';

type RegistrationType = 'company' | 'individual';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [registrationType, setRegistrationType] = useState<RegistrationType>('company');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Company fields
  const [companyName, setCompanyName] = useState('');
  const [companySlug, setCompanySlug] = useState('');
  const [adminName, setAdminName] = useState('');
  
  // Individual fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
          company_code: companyCode || '',
        };
      }

      const { data, error } = await signUp(email, password, metadata);

      if (error) {
        setError(error.message || 'Failed to sign up');
        return;
      }

      setSuccess(true);
      
      setTimeout(() => {
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

  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <MarketingNavigation />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <Container maxWidth="sm">
            <div className="rounded-lg border bg-card p-8 shadow-sm text-center">
              <div className="text-4xl mb-4">🎉</div>
              <h1 className="text-2xl font-bold mb-2">Account Created!</h1>
              <p className="text-muted-foreground mb-4">
                {registrationType === 'company' 
                  ? `${companyName} has been registered. Please check your email to verify your account.`
                  : 'Your account has been created. Please check your email to verify your account.'}
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecting to login...
              </p>
            </div>
          </Container>
        </main>
        <MarketingFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MarketingNavigation />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <Container maxWidth="lg">
          <div className="rounded-lg border bg-card p-8 shadow-sm">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Create Account</h1>
              <p className="text-muted-foreground mt-2">
                Join Fun01K and start building a more engaged workplace
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded-md text-destructive text-sm">
                {error}
              </div>
            )}

            {/* Registration Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                I want to register as
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRegistrationType('company')}
                  className={`p-4 rounded-lg border text-center transition-colors ${
                    registrationType === 'company'
                      ? 'border-primary bg-primary/5'
                      : 'border-input hover:bg-muted/50'
                  }`}
                >
                  <div className="text-2xl mb-1">🏢</div>
                  <div className="font-medium text-sm">Company</div>
                  <div className="text-xs text-muted-foreground">Create your organization</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRegistrationType('individual')}
                  className={`p-4 rounded-lg border text-center transition-colors ${
                    registrationType === 'individual'
                      ? 'border-primary bg-primary/5'
                      : 'border-input hover:bg-muted/50'
                  }`}
                >
                  <div className="text-2xl mb-1">👤</div>
                  <div className="font-medium text-sm">Individual</div>
                  <div className="text-xs text-muted-foreground">Join an organization</div>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Common Fields */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Email <span className="text-destructive">*</span>
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

              {/* Company Registration Fields */}
              {registrationType === 'company' && (
                <>
                  <div>
                    <label htmlFor="adminName" className="block text-sm font-medium mb-1">
                      Administrator Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="adminName"
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="John Doe"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This will be your name as the company administrator
                    </p>
                  </div>

                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium mb-1">
                      Company Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="companyName"
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
                      className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Acme Inc."
                    />
                  </div>

                  <div>
                    <label htmlFor="companySlug" className="block text-sm font-medium mb-1">
                      Company URL <span className="text-xs text-muted-foreground">(Optional)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">fun01k.com/</span>
                      <input
                        id="companySlug"
                        type="text"
                        value={companySlug}
                        onChange={(e) => setCompanySlug(generateSlug(e.target.value))}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="acme-inc"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Customize your company's URL. Only letters, numbers, and hyphens allowed.
                    </p>
                  </div>
                </>
              )}

              {/* Individual Registration Fields */}
              {registrationType === 'individual' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                        First Name <span className="text-destructive">*</span>
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                        Last Name <span className="text-destructive">*</span>
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="companyCode" className="block text-sm font-medium mb-1">
                      Company Code <span className="text-xs text-muted-foreground">(Optional)</span>
                    </label>
                    <input
                      id="companyCode"
                      type="text"
                      value={companyCode}
                      onChange={(e) => setCompanyCode(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Enter company code if you have one"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      If you were invited to join an organization, enter the code here.
                    </p>
                  </div>
                </>
              )}

              {/* Password Fields */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1">
                  Password <span className="text-destructive">*</span>
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
                <p className="text-xs text-muted-foreground mt-1">
                  Must be at least 6 characters
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                  Confirm Password <span className="text-destructive">*</span>
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="••••••••"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </div>
        </Container>
      </main>

      <MarketingFooter />
    </div>
  );
}