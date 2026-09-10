// src/features/marketing/components/AuthModal.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

// Department options for employees
const DEPARTMENTS = [
  'Product Design',
  'Engineering',
  'Marketing',
  'Sales',
  'Human Resources',
  'Finance',
  'Operations',
  'Customer Support',
  'Research & Development',
  'Legal',
  'Administration',
  'Information Technology',
  'Business Development',
  'Quality Assurance',
  'Supply Chain',
  'Project Management',
];

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const navigate = useNavigate();
  const { signIn, signUp, userRole } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  
  // ====== LOGIN FIELDS ======
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // ====== SIGNUP FIELDS ======
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Registration type: 'company' or 'individual'
  const [registrationType, setRegistrationType] = useState<'company' | 'individual'>('company');
  
  // ====== COMPANY REGISTRATION FIELDS ======
  const [companyName, setCompanyName] = useState('');
  const [companySlug, setCompanySlug] = useState('');
  const [adminName, setAdminName] = useState('');
  const [companyIndustry, setCompanyIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyPassword, setCompanyPassword] = useState('');
  const [companyConfirmPassword, setCompanyConfirmPassword] = useState('');
  
  // ====== EMPLOYEE REGISTRATION FIELDS ======
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [employeePassword, setEmployeePassword] = useState('');
  const [employeeConfirmPassword, setEmployeeConfirmPassword] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  
  // Company registration for employees (when they don't have an ID)
  const [showCompanyRegistration, setShowCompanyRegistration] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyCode, setNewCompanyCode] = useState('');
  const [isGeneratingId, setIsGeneratingId] = useState(false);
  
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
      setCompanyPassword('');
      setCompanyConfirmPassword('');
      setEmployeePassword('');
      setEmployeeConfirmPassword('');
      setEmployeeEmail('');
      setShowCompanyRegistration(false);
    }
  }, [isOpen]);

  // Reset to login mode when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // ✅ FIXED: Redirect based on role using window.location
  const redirectBasedOnRole = () => {
    console.log('Redirecting based on role:', userRole);
    
    if (userRole === 'platform_owner' || userRole === 'platform_admin') {
      window.location.href = '/platform';
    } else if (userRole === 'admin') {
      window.location.href = '/admin';
    } else {
      window.location.href = '/app';
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message || 'Failed to sign in');
        setIsLoading(false);
        return;
      }

      // ✅ Close modal
      onClose();
      
      // ✅ Use window.location for immediate redirect
      setTimeout(() => {
        redirectBasedOnRole();
      }, 300);
      
    } catch (err) {
      setError('An unexpected error occurred');
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  // Generate company code using the database function
  const generateCompanyCode = async (companyName: string): Promise<string> => {
    try {
      const { data, error } = await (supabase.rpc as any)(
        'generate_company_code', 
        { company_name: companyName }
      );
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating company code:', error);
      const prefix = companyName
        .replace(/[^a-zA-Z]/g, '')
        .slice(0, 3)
        .toUpperCase()
        .padEnd(3, 'X');
      const number = Math.floor(1000 + Math.random() * 9000);
      return `${prefix}-${number}`;
    }
  };

  // Handle company ID generation for employees
  const handleGenerateCompanyId = async () => {
    if (!newCompanyName.trim()) {
      setError('Please enter a company name first');
      return;
    }
    
    setIsGeneratingId(true);
    setError(null);
    try {
      const newId = await generateCompanyCode(newCompanyName);
      setNewCompanyCode(newId);
      setCompanyId(newId);
      setShowCompanyRegistration(false);
    } catch (error) {
      setError('Failed to generate company ID. Please try again.');
    } finally {
      setIsGeneratingId(false);
    }
  };

  // Handle company registration for employees
  const handleRegisterCompany = async () => {
    if (!newCompanyName.trim() || !newCompanyCode) {
      setError('Please generate a company ID first');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .insert({
          name: newCompanyName.trim(),
          slug: generateSlug(newCompanyName),
          company_code: newCompanyCode,
          industry: 'Other',
          size: 10,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      setCompanyId(newCompanyCode);
      setShowCompanyRegistration(false);
      setError(null);
    } catch (error: any) {
      console.error('Error registering company:', error);
      setError(error.message || 'Failed to register company');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Company Admin Signup
  const handleCompanySignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!companyName.trim()) {
      setError('Company name is required');
      return;
    }
    if (!adminName.trim()) {
      setError('Administrator name is required');
      return;
    }
    if (!companyIndustry) {
      setError('Please select your industry');
      return;
    }
    if (!companyPassword || companyPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (companyPassword !== companyConfirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // Call the Edge Function for company registration
      const { data, error } = await supabase.functions.invoke('register-company', {
        body: {
          companyName: companyName.trim(),
          companySlug: companySlug || generateSlug(companyName),
          adminName: adminName.trim(),
          adminEmail: email,
          companyIndustry: companyIndustry,
          companySize: companySize || null,
          companyPhone: companyPhone || '',
          password: companyPassword,
        },
      });

      if (error) {
        console.error('Edge Function error:', error);
        setError(error.message || 'Failed to register company. Please try again.');
        setIsLoading(false);
        return;
      }

      if (!data.success) {
        setError(data.error || 'Failed to register company');
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError('An unexpected error occurred');
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Employee Signup
  const handleEmployeeSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!employeeEmail.trim()) {
      setError('Email is required');
      return;
    }
    if (!employeePassword || employeePassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (employeePassword !== employeeConfirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!firstName.trim()) {
      setError('First name is required');
      return;
    }
    if (!lastName.trim()) {
      setError('Last name is required');
      return;
    }
    if (!department) {
      setError('Please select your department');
      return;
    }
    if (!companyId.trim()) {
      setError('Company ID is required. Please enter or generate one.');
      return;
    }

    setIsLoading(true);

    try {
      const metadata = {
        first_name: firstName,
        last_name: lastName,
        phone: phone || '',
        department: department,
        company_id: companyId,
        registration_type: 'individual',
        role: 'employee',
      };

      const { data, error } = await signUp(employeeEmail, employeePassword, metadata);

      if (error) {
        setError(error.message || 'Failed to sign up');
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        navigate('/signup');
      }, 2000);
    } catch (err) {
      setError('An unexpected error occurred');
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-background rounded-2xl shadow-xl border max-h-[90vh] overflow-y-auto">
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
            {mode === 'signup' && (
              <p className="text-xs text-muted-foreground mt-2 bg-muted/50 p-2 rounded-lg">
                💡 After creating your account, you'll complete your profile in the next steps
              </p>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded-md text-destructive text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500 rounded-md text-green-600 text-sm text-center">
              Account created successfully! Redirecting...
            </div>
          )}

          {mode === 'login' ? (
            // ===== LOGIN FORM =====
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
            // ===== SIGNUP FORM =====
            <>
              {/* Registration Type Toggle */}
              <div className="grid grid-cols-2 gap-2 mb-4">
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
                  <div className="text-[10px] text-muted-foreground">Create organization</div>
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
                  <div className="text-xs font-medium">Employee</div>
                  <div className="text-[10px] text-muted-foreground">Join organization</div>
                </button>
              </div>

              {/* ===== COMPANY REGISTRATION ===== */}
              {registrationType === 'company' && (
                <form onSubmit={handleCompanySignup} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Email <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="admin@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Company Name <span className="text-destructive">*</span>
                    </label>
                    <input
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
                      placeholder="Acme Corporation"
                    />
                    {companyName && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Company Code: <span className="font-mono font-bold text-primary">
                          {companyName.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase().padEnd(3, 'X')}-XXXX
                        </span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Administrator Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Industry <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={companyIndustry}
                      onChange={(e) => setCompanyIndustry(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select industry...</option>
                      <option value="Technology">Technology</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Finance">Finance</option>
                      <option value="Education">Education</option>
                      <option value="Retail">Retail</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Consulting">Consulting</option>
                      <option value="Nonprofit">Nonprofit</option>
                      <option value="Hospitality">Hospitality</option>
                      <option value="Real Estate">Real Estate</option>
                      <option value="Transportation">Transportation</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Company Size <span className="text-xs text-muted-foreground">(Optional)</span>
                    </label>
                    <select
                      value={companySize}
                      onChange={(e) => setCompanySize(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select size...</option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                      <option value="501-1000">501-1000 employees</option>
                      <option value="1000+">1000+ employees</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Company Phone <span className="text-xs text-muted-foreground">(Optional)</span>
                    </label>
                    <input
                      type="tel"
                      value={companyPhone}
                      onChange={(e) => setCompanyPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="+1 800 555 0000"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Password <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="password"
                        value={companyPassword}
                        onChange={(e) => setCompanyPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="••••••••"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Must be at least 6 characters</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Confirm Password <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="password"
                        value={companyConfirmPassword}
                        onChange={(e) => setCompanyConfirmPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                    {isLoading ? 'Creating account...' : 'Create Company Account'}
                  </Button>
                </form>
              )}

              {/* ===== EMPLOYEE REGISTRATION ===== */}
              {registrationType === 'individual' && (
                <form onSubmit={handleEmployeeSignup} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        First Name <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Last Name <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Email <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="email"
                      value={employeeEmail}
                      onChange={(e) => setEmployeeEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Phone <span className="text-xs text-muted-foreground">(Optional)</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="+234 800 000 0000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Department <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select your department...</option>
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Company ID <span className="text-destructive">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={companyId}
                        onChange={(e) => setCompanyId(e.target.value.toUpperCase())}
                        placeholder="SIG-6141"
                        className="flex-1 px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary uppercase"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCompanyRegistration(!showCompanyRegistration)}
                        className="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm whitespace-nowrap"
                      >
                        {showCompanyRegistration ? 'Close' : 'Register'}
                      </button>
                    </div>
                    {!showCompanyRegistration && (
                      <button
                        type="button"
                        onClick={() => setShowCompanyRegistration(true)}
                        className="text-xs text-primary hover:underline mt-1"
                      >
                        No company ID? Register company & generate code
                      </button>
                    )}
                  </div>

                  {/* Company Registration for Employees */}
                  {showCompanyRegistration && (
                    <div className="p-3 border border-dashed border-primary/30 rounded-lg bg-primary/5 space-y-2">
                      <h4 className="text-xs font-semibold">Register New Company</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-medium block mb-0.5">Company Name</label>
                          <input
                            type="text"
                            value={newCompanyName}
                            onChange={(e) => {
                              setNewCompanyName(e.target.value);
                            }}
                            placeholder="Acme Corp"
                            className="w-full px-2 py-1.5 border border-input rounded text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium block mb-0.5">Generated ID</label>
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={newCompanyCode}
                              readOnly
                              className="flex-1 px-2 py-1.5 border border-input rounded text-sm bg-muted font-mono"
                              placeholder="CORP-0000"
                            />
                            <button
                              type="button"
                              onClick={handleGenerateCompanyId}
                              disabled={isGeneratingId || !newCompanyName.trim()}
                              className="px-2 py-1.5 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90 disabled:opacity-50"
                            >
                              {isGeneratingId ? '⏳' : '🔄'}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-1 pt-1 border-t">
                        <button
                          type="button"
                          onClick={() => setShowCompanyRegistration(false)}
                          className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleRegisterCompany}
                          disabled={isLoading || !newCompanyCode || !newCompanyName.trim()}
                          className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90 disabled:opacity-50"
                        >
                          {isLoading ? 'Creating...' : 'Register Company'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Password <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="password"
                        value={employeePassword}
                        onChange={(e) => setEmployeePassword(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="••••••••"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Must be at least 6 characters</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Confirm Password <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="password"
                        value={employeeConfirmPassword}
                        onChange={(e) => setEmployeeConfirmPassword(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              )}

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
            </>
          )}
        </div>
      </div>
    </div>
  );
}