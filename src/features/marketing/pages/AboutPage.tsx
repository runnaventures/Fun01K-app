import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { MarketingNavigation } from '../components/Navigation';
import { MarketingFooter } from '../components/Footer';
import { AuthModal } from '../components/AuthModal';

export default function AboutPage() {
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  const openLogin = () => {
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  };

  const openSignup = () => {
    setAuthModalMode('signup');
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MarketingNavigation onLoginClick={openLogin} onSignupClick={openSignup} />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 md:py-24 border-b">
          <Container>
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                Building better workplaces,{' '}
                <span className="text-primary">one connection at a time</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                We believe that engaged employees create thriving companies. 
                Our mission is to make workplace connection and recognition effortless.
              </p>
            </div>
          </Container>
        </section>

        {/* Mission */}
        <section className="py-16">
          <Container>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
                <p className="text-muted-foreground mb-6">
                  To transform how companies connect with their employees by creating 
                  meaningful engagement opportunities that drive culture, retention, and performance.
                </p>
                <p className="text-muted-foreground">
                  We are building the infrastructure for the future of work — where every 
                  employee feels valued, connected, and motivated to do their best work.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 rounded-lg border bg-card text-center">
                  <div className="text-4xl font-bold text-primary mb-2">94%</div>
                  <p className="text-sm text-muted-foreground">Participation Rate</p>
                </div>
                <div className="p-6 rounded-lg border bg-card text-center">
                  <div className="text-4xl font-bold text-primary mb-2">3.2x</div>
                  <p className="text-sm text-muted-foreground">Cross-Dept Connections</p>
                </div>
                <div className="p-6 rounded-lg border bg-card text-center">
                  <div className="text-4xl font-bold text-primary mb-2">4.8x</div>
                  <p className="text-sm text-muted-foreground">Average ROI</p>
                </div>
                <div className="p-6 rounded-lg border bg-card text-center">
                  <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
                  <p className="text-sm text-muted-foreground">Platform Uptime</p>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Values */}
        <section className="py-16 bg-muted/10">
          <Container>
            <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {values.map((value) => (
                <div key={value.id} className="p-6 rounded-lg border bg-card">
                  <div className="text-3xl mb-4">{value.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* CTA */}
        <section className="py-16">
          <Container>
            <div className="max-w-3xl mx-auto text-center p-12 rounded-2xl bg-primary/5 border">
              <h2 className="text-3xl font-bold mb-4">Ready to see the difference?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join companies already transforming their workplace culture.
              </p>
              <Button size="lg" onClick={() => navigate('/contact')}>
                Get in Touch
              </Button>
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

const values = [
  {
    id: '1',
    icon: '💡',
    title: 'Innovation First',
    description: 'We constantly push the boundaries of what employee engagement can achieve.',
  },
  {
    id: '2',
    icon: '🤝',
    title: 'Customer Obsession',
    description: 'Our customers success is our success. We are committed to their growth.',
  },
  {
    id: '3',
    icon: '🔒',
    title: 'Trust and Security',
    description: 'We build secure, reliable products that our customers can count on.',
  },
];