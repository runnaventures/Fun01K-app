import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { MarketingNavigation } from '../components/Navigation';
import { MarketingFooter } from '../components/Footer';
import { AuthModal } from '../components/AuthModal';

export default function PricingPage() {
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  const openLogin = () => {
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  };

  const openSignup = () => {
    setAuthModalMode('signup');
    setIsAuthModalOpen(true);
  };

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Perfect for small teams getting started',
      monthlyPrice: 4,
      annualPrice: 3,
      popular: false,
      features: [
        'Up to 50 employees',
        'Basic activity management',
        'Points & rewards system',
        'Social feed',
        'Email support',
      ],
      cta: 'Start Free Trial',
    },
    {
      id: 'pro',
      name: 'Professional',
      description: 'Best for growing teams',
      monthlyPrice: 8,
      annualPrice: 6,
      popular: true,
      features: [
        'Unlimited employees',
        'Advanced activities & challenges',
        'GPS verification',
        'Custom categories',
        'Analytics dashboard',
        'Priority support',
      ],
      cta: 'Start Free Trial',
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For large organizations',
      monthlyPrice: 12,
      annualPrice: 10,
      popular: false,
      features: [
        'Multi-company support',
        'SSO & SAML',
        'Custom integrations',
        'Dedicated account manager',
        'SLA guarantee',
        '24/7 phone support',
      ],
      cta: 'Contact Sales',
    },
  ];

  const faqs = [
    {
      question: 'Can I switch plans later?',
      answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.',
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes, all plans include a 14-day free trial. No credit card required.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, PayPal, and wire transfers for annual plans.',
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes, you can cancel your subscription at any time. You will not be charged after your current billing period ends.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MarketingNavigation onLoginClick={openLogin} onSignupClick={openSignup} />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 bg-gradient-to-b from-primary/5 to-transparent">
          <Container>
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                Simple, Transparent Pricing
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Choose the plan that fits your team's needs. All plans include a 14-day free trial.
              </p>
              
              {/* Billing Toggle */}
              <div className="inline-flex items-center gap-2 bg-muted p-1 rounded-xl mt-8">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('annual')}
                  className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    billingCycle === 'annual'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Annual <span className="text-primary text-xs font-semibold ml-1">Save 20%</span>
                </button>
              </div>
            </div>
          </Container>
        </section>

        {/* Pricing Cards */}
        <section className="py-16">
          <Container>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {plans.map((plan) => {
                const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
                const isAnnual = billingCycle === 'annual';
                
                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl border p-8 bg-card transition-all hover:shadow-lg ${
                      plan.popular ? 'border-primary shadow-md' : 'border-border'
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                        Most Popular
                      </span>
                    )}
                    
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                      <div className="mt-5">
                        <span className="text-4xl font-bold">${price}</span>
                        <span className="text-sm text-muted-foreground">/user/month</span>
                      </div>
                      {isAnnual && (
                        <p className="text-xs text-muted-foreground mt-1">Billed annually</p>
                      )}
                    </div>

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3 text-sm">
                          <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="w-full"
                      variant={plan.id === 'enterprise' ? 'secondary' : plan.popular ? 'primary' : 'outline'}
                      size="lg"
                      onClick={() => plan.id === 'enterprise' ? navigate('/contact') : openSignup()}
                    >
                      {plan.cta}
                    </Button>
                  </div>
                );
              })}
            </div>
          </Container>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-muted/10">
          <Container>
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="rounded-xl border bg-card p-6 shadow-sm">
                    <h4 className="font-semibold text-lg mb-2">{faq.question}</h4>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <Container>
            <div className="max-w-3xl mx-auto text-center p-12 rounded-2xl bg-[#0B1F33] border border-primary/10 text-white">
              <h2 className="text-3xl md:text-4xl font-bold">Ready to get started?</h2>
              <p className="text-gray-300 mt-3 max-w-xl mx-auto">
                Join thousands of companies building better workplace culture with Fun01K.
              </p>
              <div className="flex flex-wrap justify-center gap-4 mt-8">
                <Button size="lg" onClick={openSignup} className="shadow-sm">
                  Start Free Trial
                </Button>
                <Button 
                  size="lg" 
                  onClick={openLogin} 
                  className="bg-white text-[#0B1F33] hover:bg-gray-100 shadow-sm"
                >
                  Sign In
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-4">No credit card required. 14-day free trial.</p>
            </div>
          </Container>
        </section>
      </main>

      <MarketingFooter />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  );
}