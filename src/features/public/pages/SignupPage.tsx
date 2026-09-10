// src/features/auth/pages/SignupPage.tsx

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { MarketingNavigation } from '@/features/public/components/Navigation';
import { MarketingFooter } from '@/features/public/components/Footer';
import { supabase } from '@/lib/supabase';

type RegistrationType = 'company' | 'individual';
type OnboardingStep = 1 | 2 | 3;

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

// Predefined categories and sub-interests
const INTEREST_CATEGORIES = [
  { 
    id: 'sports', 
    name: 'Sports & Athletics', 
    icon: '⚽', 
    subInterests: ['Football', 'Basketball', 'Tennis', 'Volleyball', 'Badminton', 'Cricket', 'Rugby', 'Swimming', 'Athletics', 'Cycling', 'Golf', 'Martial Arts', 'Climbing'] 
  },
  { 
    id: 'tech', 
    name: 'Technology & Gaming', 
    icon: '🎮', 
    subInterests: ['Video Games', 'Esports', 'Coding', 'Web Development', 'AI & Machine Learning', 'Cybersecurity', 'Robotics', 'Game Design', 'Tech Talks'] 
  },
  { 
    id: 'arts', 
    name: 'Arts & Creativity', 
    icon: '🎨', 
    subInterests: ['Painting', 'Drawing', 'Photography', 'Videography', 'Music Production', 'Graphic Design', 'Creative Writing', 'Filmmaking', 'Sculpture'] 
  },
  { 
    id: 'cuisine', 
    name: 'Cuisine & Gastronomy', 
    icon: '🍳', 
    subInterests: ['Cooking', 'Baking', 'Food Tasting', 'Wine Tasting', 'Cocktail Making', 'Chef Classes', 'Food Blogging', 'Farm to Table'] 
  },
  { 
    id: 'outdoors', 
    name: 'Lifestyle & Outdoors', 
    icon: '🏔️', 
    subInterests: ['Hiking', 'Camping', 'Mountain Biking', 'Surfing', 'Skiing', 'Road Trips', 'Photography', 'Bird Watching', 'Gardening'] 
  },
  { 
    id: 'wellness', 
    name: 'Wellness & Mindfulness', 
    icon: '🧘', 
    subInterests: ['Yoga', 'Meditation', 'Pilates', 'Tai Chi', 'Breathwork', 'Mindfulness', 'Stress Management', 'Sleep Hygiene', 'Nutrition'] 
  },
];

export default function SignupPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  
  // Registration type
  const [registrationType, setRegistrationType] = useState<RegistrationType>('company');
  
  // Step management (ONLY for individual/employee)
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // ====== COMPANY REGISTRATION FIELDS ======
  const [companyName, setCompanyName] = useState('');
  const [companySlug, setCompanySlug] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyIndustry, setCompanyIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [companyPassword, setCompanyPassword] = useState('');
  const [companyConfirmPassword, setCompanyConfirmPassword] = useState('');
  
  // ====== INDIVIDUAL (EMPLOYEE) REGISTRATION FIELDS ======
  // Step 1: Account Details
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [isGeneratingId, setIsGeneratingId] = useState(false);
  
  // Company registration for employees (when they don't have an ID)
  const [showCompanyRegistration, setShowCompanyRegistration] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyCode, setNewCompanyCode] = useState('');
  
  // Step 2: Bio Details (EMPLOYEE ONLY)
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [relationshipStatus, setRelationshipStatus] = useState('');
  const [hasKids, setHasKids] = useState<'yes' | 'no' | ''>('');
  const [numberOfKids, setNumberOfKids] = useState(0);
  
  // Step 3: Interests (EMPLOYEE ONLY)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubInterests, setSelectedSubInterests] = useState<string[]>([]);

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  const triggerNotification = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 3000);
  };

  // Generate company code for employees (uses Edge Function for actual registration)
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
      triggerNotification(`Company ID ${newId} generated for ${newCompanyName}!`);
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
      triggerNotification(`Company "${newCompanyName}" registered with ID ${newCompanyCode}!`);
    } catch (error: any) {
      console.error('Error registering company:', error);
      setError(error.message || 'Failed to register company');
    } finally {
      setIsLoading(false);
    }
  };

  // ====== COMPANY ADMIN SUBMIT - Uses Edge Function ======
  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validate
      if (!companyName.trim()) {
        setError('Company name is required');
        setIsLoading(false);
        return;
      }
      if (!adminName.trim()) {
        setError('Administrator name is required');
        setIsLoading(false);
        return;
      }
      if (!adminEmail.trim()) {
        setError('Administrator email is required');
        setIsLoading(false);
        return;
      }
      if (!companyIndustry) {
        setError('Please select your industry');
        setIsLoading(false);
        return;
      }
      if (!companyPassword || companyPassword.length < 6) {
        setError('Password must be at least 6 characters');
        setIsLoading(false);
        return;
      }
      if (companyPassword !== companyConfirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }

      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke('register-company', {
        body: {
          companyName: companyName.trim(),
          companySlug: companySlug || generateSlug(companyName),
          adminName: adminName.trim(),
          adminEmail: adminEmail.trim(),
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

      // Success
      setCompanyCode(data.company_code);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 4000);

    } catch (err: any) {
      console.error('Company registration error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // ====== EMPLOYEE SUBMIT ======
  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const metadata: any = {
        first_name: firstName,
        last_name: lastName,
        phone: phone || '',
        department: department,
        company_id: companyId,
        date_of_birth: dateOfBirth,
        home_address: homeAddress,
        relationship_status: relationshipStatus,
        has_kids: hasKids,
        number_of_kids: numberOfKids,
        interests: selectedSubInterests,
        registration_type: 'individual',
        role: 'employee',
      };

      const { data, error } = await signUp(email, password, metadata);

      if (error) {
        setError(error.message || 'Failed to sign up');
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 4000);
    } catch (err) {
      setError('An unexpected error occurred');
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Validate Employee Step 1
  const validateEmployeeStep1 = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!department) {
      setError('Please select your department');
      return false;
    }
    if (!companyId.trim()) {
      setError('Company ID is required. Please enter or generate one.');
      return false;
    }
    return true;
  };

  // Validate Employee Step 2 (Bio)
  const validateEmployeeStep2 = () => {
    if (!dateOfBirth) {
      setError('Date of birth is required');
      return false;
    }
    if (!homeAddress.trim()) {
      setError('Home address is required');
      return false;
    }
    if (!relationshipStatus) {
      setError('Please select your relationship status');
      return false;
    }
    if (!hasKids) {
      setError('Please select if you have kids');
      return false;
    }
    if (hasKids === 'yes' && numberOfKids < 1) {
      setError('Please specify number of kids');
      return false;
    }
    return true;
  };

  // Handle Next Step (Employee only)
  const handleNextStep = () => {
    setError(null);
    
    if (registrationType === 'individual') {
      if (currentStep === 1 && validateEmployeeStep1()) {
        setCurrentStep(2);
      } else if (currentStep === 2 && validateEmployeeStep2()) {
        setCurrentStep(3);
      }
    }
  };

  // Handle Back Step (Employee only)
  const handleBackStep = () => {
    setError(null);
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as OnboardingStep);
    }
  };

  // Toggle category selection
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  // Toggle sub-interest selection
  const toggleSubInterest = (subInterest: string) => {
    setSelectedSubInterests(prev => {
      if (prev.includes(subInterest)) {
        return prev.filter(s => s !== subInterest);
      } else {
        return [...prev, subInterest];
      }
    });
  };

  // Calculate age from DOB
  const calculateAge = (dob: string) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const ageDifMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const userAge = calculateAge(dateOfBirth);

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
                  ? `${companyName} has been registered with code ${companyCode}. Please check your email to verify your account.`
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
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  {registrationType === 'company' 
                    ? 'COMPANY REGISTRATION' 
                    : `STEP ${currentStep} OF 3 • ONBOARDING PORTAL`}
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                {registrationType === 'company' 
                  ? 'Register Your Company' 
                  : currentStep === 1 
                    ? 'Join the Corporate Wellness Network' 
                    : currentStep === 2 
                      ? 'Complete Your Supplementary Bio' 
                      : 'What Interests You?'}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {registrationType === 'company' 
                  ? 'Create your company account and start engaging your employees'
                  : currentStep === 1 
                    ? 'Create your account to get started' 
                    : currentStep === 2 
                      ? 'Tell us more about yourself' 
                      : 'Select your hobbies and interests'}
              </p>
            </div>

            {/* Step Indicator - Only for Individual/Employee registration */}
            {registrationType === 'individual' && (
              <div className="flex justify-center items-center gap-4 mb-8">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      currentStep >= step 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {step}
                    </div>
                    <span className={`text-sm ${currentStep >= step ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step === 1 && 'Account'}
                      {step === 2 && 'Bio'}
                      {step === 3 && 'Interests'}
                    </span>
                    {step < 3 && (
                      <div className={`w-8 h-px ${currentStep > step ? 'bg-primary' : 'bg-muted'}`} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded-md text-destructive text-sm">
                {error}
              </div>
            )}

            {/* ====== REGISTRATION TYPE TOGGLE ====== */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => {
                  setRegistrationType('company');
                  setCurrentStep(1);
                }}
                className={`p-3 rounded-lg border text-center transition-colors ${
                  registrationType === 'company'
                    ? 'border-primary bg-primary/5'
                    : 'border-input hover:bg-muted/50'
                }`}
              >
                <div className="text-lg mb-0.5">🏢</div>
                <div className="text-xs font-medium">Company Admin</div>
                <div className="text-[10px] text-muted-foreground">Create your organization</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setRegistrationType('individual');
                  setCurrentStep(1);
                }}
                className={`p-3 rounded-lg border text-center transition-colors ${
                  registrationType === 'individual'
                    ? 'border-primary bg-primary/5'
                    : 'border-input hover:bg-muted/50'
                }`}
              >
                <div className="text-lg mb-0.5">👤</div>
                <div className="text-xs font-medium">Employee</div>
                <div className="text-[10px] text-muted-foreground">Join an organization</div>
              </button>
            </div>

            {/* ============================================================ */}
            {/* ====== COMPANY ADMIN REGISTRATION FORM (No Bio/Interests) ====== */}
            {/* ============================================================ */}
            {registrationType === 'company' && (
              <form onSubmit={handleCompanySubmit} className="space-y-4">
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
                    className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Administrator Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Administrator Email <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="admin@acme.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Industry <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={companyIndustry}
                      onChange={(e) => setCompanyIndustry(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
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
                      className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
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
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Company Phone <span className="text-xs text-muted-foreground">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="+1 800 555 0000"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Password <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="password"
                      value={companyPassword}
                      onChange={(e) => setCompanyPassword(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="••••••••"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Must be at least 6 characters
                    </p>
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
                      className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating account...' : 'Create Company Account'}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary hover:underline font-medium">
                    Sign in
                  </Link>
                </div>
              </form>
            )}

            {/* ============================================================ */}
            {/* ====== EMPLOYEE REGISTRATION - 3 STEP ONBOARDING ====== */}
            {/* ============================================================ */}
            {registrationType === 'individual' && (
              <form onSubmit={handleEmployeeSubmit} className="space-y-6">
                {/* STEP 1: ACCOUNT */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          First Name <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
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
                          className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="Doe"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Email Address <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
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
                        className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
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
                        className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
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
                          className="flex-1 px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring uppercase"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCompanyRegistration(!showCompanyRegistration)}
                          className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md text-sm whitespace-nowrap"
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

                    {showCompanyRegistration && (
                      <div className="p-4 border border-dashed border-primary/30 rounded-lg bg-primary/5 space-y-3">
                        <h4 className="text-sm font-semibold">Register New Company</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium mb-1">Company Name</label>
                            <input
                              type="text"
                              value={newCompanyName}
                              onChange={(e) => {
                                setNewCompanyName(e.target.value);
                              }}
                              placeholder="Acme Corporation"
                              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Generated ID</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newCompanyCode}
                                readOnly
                                className="flex-1 px-3 py-2 border border-input rounded-md bg-muted font-mono text-sm"
                                placeholder="CORP-0000"
                              />
                              <button
                                type="button"
                                onClick={handleGenerateCompanyId}
                                disabled={isGeneratingId || !newCompanyName.trim()}
                                className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm disabled:opacity-50"
                              >
                                {isGeneratingId ? '⏳' : 'Generate'}
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCompanyRegistration(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleRegisterCompany}
                            disabled={isLoading || !newCompanyCode || !newCompanyName.trim()}
                          >
                            {isLoading ? 'Creating...' : 'Register Company'}
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Password <span className="text-destructive">*</span>
                        </label>
                        <input
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
                        <label className="block text-sm font-medium mb-1">
                          Confirm Password <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: BIO (EMPLOYEE ONLY) */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Date of Birth <span className="text-destructive">*</span>
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="date"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          required
                          className="flex-1 px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        {userAge && (
                          <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
                            Registered Age: {userAge} years old
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Home Address <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        value={homeAddress}
                        onChange={(e) => setHomeAddress(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="76B Harold Wilson Drive Borikiri Port Harcourt"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Relationship Status <span className="text-destructive">*</span>
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {['Single', 'Married', 'In a relationship', 'Prefer not to say'].map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setRelationshipStatus(status)}
                            className={`p-2 rounded-lg border text-sm transition-colors ${
                              relationshipStatus === status
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-input hover:bg-muted/50'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Parental/Family Status <span className="text-destructive">*</span>
                      </label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Do you have kids or child dependants?
                      </p>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setHasKids('no')}
                          className={`px-6 py-2 rounded-lg border transition-colors ${
                            hasKids === 'no'
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-input hover:bg-muted/50'
                          }`}
                        >
                          No Kids
                        </button>
                        <button
                          type="button"
                          onClick={() => setHasKids('yes')}
                          className={`px-6 py-2 rounded-lg border transition-colors ${
                            hasKids === 'yes'
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-input hover:bg-muted/50'
                          }`}
                        >
                          Has Kids
                        </button>
                      </div>
                    </div>

                    {hasKids === 'yes' && (
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Number of Kids:
                        </label>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setNumberOfKids(Math.max(0, numberOfKids - 1))}
                            className="w-8 h-8 rounded-full border hover:bg-muted flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="text-lg font-semibold w-8 text-center">{numberOfKids}</span>
                          <button
                            type="button"
                            onClick={() => setNumberOfKids(numberOfKids + 1)}
                            className="w-8 h-8 rounded-full border hover:bg-muted flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 3: INTERESTS (EMPLOYEE ONLY) */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <p className="text-sm text-muted-foreground">
                      First select one or more main categories below to unlock specific sub-interests.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {INTEREST_CATEGORIES.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => toggleCategory(category.id)}
                          className={`p-4 rounded-lg border text-left transition-all ${
                            selectedCategories.includes(category.id)
                              ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                              : 'border-input hover:bg-muted/50'
                          }`}
                        >
                          <div className="text-2xl mb-1">{category.icon}</div>
                          <div className="font-medium text-sm">{category.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {category.subInterests.length} Specific Choices
                          </div>
                        </button>
                      ))}
                    </div>

                    {selectedCategories.length > 0 && (
                      <div className="p-4 border rounded-lg">
                        <h4 className="text-sm font-semibold mb-3">
                          Available Sub-Interests (Click to select):
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {INTEREST_CATEGORIES
                            .filter(c => selectedCategories.includes(c.id))
                            .flatMap(c => c.subInterests)
                            .map((sub) => (
                              <button
                                key={sub}
                                type="button"
                                onClick={() => toggleSubInterest(sub)}
                                className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                                  selectedSubInterests.includes(sub)
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted hover:bg-muted/80'
                                }`}
                              >
                                {sub}
                              </button>
                            ))}
                        </div>
                        {selectedSubInterests.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-muted-foreground">
                              Selected: {selectedSubInterests.join(', ')}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedCategories.length === 0 && (
                      <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
                        Select at least one category above to see associated sub-interests!
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation Buttons (Employee only) */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <button
                    type="button"
                    onClick={handleBackStep}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      currentStep > 1
                        ? 'text-foreground hover:bg-muted'
                        : 'text-muted-foreground cursor-not-allowed opacity-50'
                    }`}
                    disabled={currentStep === 1}
                  >
                    ← Back
                  </button>

                  {currentStep < 3 ? (
                    <Button
                      type="button"
                      onClick={handleNextStep}
                      className="px-6 py-2"
                    >
                      Next: {currentStep === 1 ? 'Bio Details' : 'Hobbies & Interests'} →
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isLoading || selectedCategories.length === 0}
                      className="px-6 py-2"
                    >
                      {isLoading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  )}
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary hover:underline font-medium">
                    Sign in
                  </Link>
                </div>
              </form>
            )}
          </div>
        </Container>
      </main>

      <MarketingFooter />
    </div>
  );
}