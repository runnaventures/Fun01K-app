import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { MarketingNavigation } from '../components/Navigation';
import { MarketingFooter } from '../components/Footer';
import { AuthModal } from '../components/AuthModal';
import {
  MapPin,
  ShieldCheck,
  Users,
  Gift,
  Sparkles,
  Building2,
  LayoutGrid,
  CheckCircle2,
  Clock,
} from 'lucide-react';

/**
 * NOTE ON FONTS
 * This design pairs a warm display serif with a clean UI sans-serif —
 * add both to index.html (or your font pipeline) for the intended look:
 *   <link rel="preconnect" href="https://fonts.googleapis.com">
 *   <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
 * Headings use the arbitrary Tailwind class font-[Fraunces]; body text
 * relies on your existing sans stack (Inter recommended).
 */

const VERIFICATION_STEPS: { label: string; detail: string }[] = [
  { label: 'Discover', detail: 'Browse what\'s open to their team.' },
  { label: 'Join', detail: 'Add it to their schedule.' },
  { label: 'Arrive', detail: 'Show up where the activity says.' },
  { label: 'Verify', detail: 'Geofencing confirms they\'re there.' },
  { label: 'Participate', detail: 'Complete it as the admin defined.' },
  { label: 'Complete', detail: 'Submit, or auto-complete on exit.' },
  { label: 'Earn', detail: 'Points post to their balance.' },
];

const AUDIENCES = [
  {
    tag: 'For employees',
    icon: Sparkles,
    title: 'A reason to look forward to Monday\'s app notifications',
    body:
      'One dashboard for the points, activities, and recognition that used to live nowhere — a running balance, a feed of what colleagues are doing, and a catalog worth redeeming for.',
    items: ['Points balance & history', 'Activity discovery & tracking', 'Recognition & social feed'],
  },
  {
    tag: 'For administrators',
    icon: Building2,
    title: 'Your program, configured your way — not ours',
    body:
      'Define what counts, how it\'s verified, and what it\'s worth. Fun01K doesn\'t assume one company\'s idea of a reward is every company\'s idea of a reward.',
    items: ['Activities, challenges & point rules', 'Employees, departments & roles', 'Engagement analytics'],
  },
  {
    tag: 'For Fun01K',
    icon: LayoutGrid,
    title: 'Every organization, run from a single control plane',
    body:
      'While admins manage their own teams, we manage the platform underneath every one of them — plans, infrastructure, moderation, and the numbers that show it\'s working.',
    items: ['Organizations & subscriptions', 'Platform-wide templates', 'Usage, billing & support'],
  },
];

export default function HomePage() {
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
    <div className="min-h-screen flex flex-col bg-[#FAF8F3]">
      <MarketingNavigation onLoginClick={openLogin} onSignupClick={openSignup} />

      <main className="flex-1">
        {/* ============ HERO ============ */}
        <section className="relative pt-20 pb-16 md:pt-28 md:pb-20 overflow-hidden">
          <div
            className="pointer-events-none absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full opacity-[0.07] blur-3xl"
            style={{ background: 'radial-gradient(circle, #0B1F33 0%, transparent 70%)' }}
          />
          <Container>
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div>
                <h1 className="font-[Fraunces] text-[2.75rem] sm:text-6xl md:text-[4.25rem] leading-[1.04] tracking-tight text-[#0B1F33]">
                  Recognition for the work that isn't on anyone's job description.
                </h1>
                <p className="mt-6 text-lg md:text-xl text-[#5B6472] max-w-xl leading-relaxed">
                  Volunteering. Wellness. Learning. Team activities. Fun01K turns real
                  participation into verified points, recognition, and rewards — run
                  entirely on rules your company sets.
                </p>
                <div className="mt-9 flex flex-wrap items-center gap-4">
                  <Button size="lg" onClick={openSignup} className="bg-[#0B1F33] hover:bg-[#0B1F33]/90 shadow-none">
                    Get started
                  </Button>
                  <a
                    href="#how-it-works"
                    className="text-sm font-medium text-[#0B1F33] underline decoration-[#0B1F33]/25 underline-offset-4 hover:decoration-[#0B1F33]"
                  >
                    See how verification works
                  </a>
                </div>
              </div>

              {/* Right Image - From Public Folder */}
              <div className="relative">
                <div className="rounded-2xl bg-[#0B1F33] p-2 shadow-2xl border border-[#0B1F33]/10">
                  <img
                    src="/images/dashboardimage.png"
                    alt="Fun01K Dashboard"
                    className="w-full rounded-xl"
                    onError={(e) => {
                      // Fallback if image doesn't exist
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        const fallback = document.createElement('div');
                        fallback.className = 'w-full aspect-[16/10] rounded-xl bg-gradient-to-br from-[#0B1F33] to-[#1a3a5c] flex flex-col items-center justify-center text-white/50 text-sm gap-3';
                        fallback.innerHTML = `
                          <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p class="font-medium">Fun01K Dashboard</p>
                          <p class="text-xs text-white/30">Place your image at /public/images/dashboardimage.png</p>
                        `;
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                </div>
                
                {/* Floating Stats Badge */}
                <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg px-4 py-3 border border-[#E7E2D8] hidden md:block">
                  <p className="text-xs text-[#5B6472]">Active participants</p>
                  <p className="text-xl font-bold text-[#0B1F33]">1,284</p>
                </div>
                
                {/* Floating Points Badge */}
                <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg px-4 py-3 border border-[#E7E2D8] hidden md:block">
                  <p className="text-xs text-[#5B6472]">Points awarded</p>
                  <p className="text-xl font-bold text-[#B8935A]">+12,400</p>
                </div>

                {/* Mobile Stats */}
                <div className="flex gap-4 mt-4 md:hidden">
                  <div className="flex-1 bg-white rounded-xl shadow-lg px-4 py-3 border border-[#E7E2D8] text-center">
                    <p className="text-xs text-[#5B6472]">Active participants</p>
                    <p className="text-lg font-bold text-[#0B1F33]">1,284</p>
                  </div>
                  <div className="flex-1 bg-white rounded-xl shadow-lg px-4 py-3 border border-[#E7E2D8] text-center">
                    <p className="text-xs text-[#5B6472]">Points awarded</p>
                    <p className="text-lg font-bold text-[#B8935A]">+12,400</p>
                  </div>
                </div>
              </div>
            </div>
          </Container>

          {/* Signature element: the verification path, as a real horizontal sequence */}
          <Container className="mt-16 md:mt-20">
            <div id="how-it-works" className="scroll-mt-24">
              <p className="text-sm text-[#5B6472] mb-6 max-w-md">
                Every activity that requires physical presence follows the same seven
                steps — from discovery to a point balance.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-px bg-[#E7E2D8] rounded-2xl overflow-hidden border border-[#E7E2D8]">
                {VERIFICATION_STEPS.map((step, i) => (
                  <div key={step.label} className="bg-[#FAF8F3] px-4 py-5 sm:py-6">
                    <div className="flex items-center gap-2">
                      <span className="font-[Fraunces] text-xl text-[#B8935A]">{`0${i + 1}`}</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-[#0B1F33]">{step.label}</p>
                    <p className="mt-1 text-xs text-[#5B6472] leading-snug">{step.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* ============ THREE AUDIENCES ============ */}
        <section className="py-20 md:py-28 border-t border-[#E7E2D8]">
          <Container>
            <div className="max-w-xl mb-14">
              <h2 className="font-[Fraunces] text-3xl md:text-4xl text-[#0B1F33]">
                One platform, doing three very different jobs
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-x-10 gap-y-14">
              {AUDIENCES.map((a) => {
                const Icon = a.icon;
                return (
                  <div key={a.tag}>
                    <div className="flex items-center gap-2 text-[#B8935A]">
                      <Icon className="w-4 h-4" strokeWidth={2} />
                      <span className="text-sm font-medium">{a.tag}</span>
                    </div>
                    <h3 className="font-[Fraunces] text-xl text-[#0B1F33] mt-3 leading-snug">
                      {a.title}
                    </h3>
                    <p className="mt-3 text-sm text-[#5B6472] leading-relaxed">{a.body}</p>
                    <ul className="mt-4 space-y-2">
                      {a.items.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-[#0B1F33]/80">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#B8935A] shrink-0" strokeWidth={2} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </Container>
        </section>

        {/* ============ AN ACTUAL ACTIVITY, WORKED THROUGH ============ */}
        <section className="py-20 md:py-28 bg-[#0B1F33] text-white">
          <Container>
            <div className="grid lg:grid-cols-2 gap-14 items-center">
              <div>
                <p className="text-sm font-medium text-[#B8935A]">A verified activity, end to end</p>
                <h2 className="font-[Fraunces] text-3xl md:text-4xl mt-3 leading-tight">
                  Not "I completed this." Actually completed.
                </h2>
                <p className="mt-4 text-[#C3CBD6] leading-relaxed max-w-md">
                  An admin sets the activity, the location, and what it's worth.
                  When an employee arrives, geofencing confirms it — quietly, and
                  only for that purpose.
                </p>
                <div className="mt-8 space-y-3 max-w-sm">
                  <div className="flex items-center gap-3 text-sm text-[#C3CBD6]">
                    <MapPin className="w-4 h-4 text-[#B8935A]" />
                    Location-based, only when an activity requires it
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[#C3CBD6]">
                    <Clock className="w-4 h-4 text-[#B8935A]" />
                    Minimal collection, limited retention
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[#C3CBD6]">
                    <ShieldCheck className="w-4 h-4 text-[#B8935A]" />
                    Never used to track employees outside participation
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#B8935A]">Community</span>
                  <span className="text-sm font-semibold text-white">+200 points</span>
                </div>
                <h3 className="font-[Fraunces] text-2xl mt-3">Saturday Community Cleanup</h3>
                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex items-start gap-3 py-3 border-t border-white/10">
                    <MapPin className="w-4 h-4 mt-0.5 text-[#C3CBD6]" />
                    <div>
                      <p className="text-[#C3CBD6]/70 text-xs">Location</p>
                      <p className="text-white">Lagos Community Center</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 py-3 border-t border-white/10">
                    <Clock className="w-4 h-4 mt-0.5 text-[#C3CBD6]" />
                    <div>
                      <p className="text-[#C3CBD6]/70 text-xs">Requirement</p>
                      <p className="text-white">Attend and participate for at least 60 minutes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 py-3 border-t border-white/10 border-b">
                    <ShieldCheck className="w-4 h-4 mt-0.5 text-emerald-400" />
                    <div>
                      <p className="text-[#C3CBD6]/70 text-xs">Status</p>
                      <p className="text-emerald-400">Verified on arrival</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* ============ RECOGNITION / FEED ============ */}
        <section className="py-20 md:py-28">
          <Container>
            <div className="grid lg:grid-cols-2 gap-14 items-center">
              <div className="order-2 lg:order-1 rounded-2xl border border-[#E7E2D8] bg-white p-6">
                <p className="text-sm font-medium text-[#5B6472] mb-4">This week, across the org</p>
                <div className="space-y-4">
                  {[
                    { name: 'Amaka Obi', action: 'completed Community Volunteering', points: '+150', time: '2m ago' },
                    { name: 'Jamie Chen', action: 'recognized Priya for mentoring a new hire', points: '+50', time: '15m ago' },
                    { name: 'Taylor Smith', action: 'finished the Q3 Wellness Challenge', points: '+100', time: '1h ago' },
                  ].map((entry) => (
                    <div key={entry.name} className="flex items-start gap-3 pb-4 border-b border-[#E7E2D8] last:border-0 last:pb-0">
                      <div className="w-9 h-9 rounded-full bg-[#0B1F33]/5 flex items-center justify-center text-[#0B1F33] text-sm font-semibold shrink-0">
                        {entry.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#0B1F33]">
                          <span className="font-medium">{entry.name}</span> {entry.action}
                        </p>
                        <p className="text-xs text-[#5B6472] mt-0.5">{entry.time}</p>
                      </div>
                      <span className="text-sm font-semibold text-[#B8935A] shrink-0">{entry.points}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <p className="text-sm font-medium text-[#B8935A]">Social feed</p>
                <h2 className="font-[Fraunces] text-3xl md:text-4xl mt-3 text-[#0B1F33] leading-tight">
                  Colleagues see it before HR reports on it
                </h2>
                <p className="mt-4 text-[#5B6472] leading-relaxed max-w-md">
                  Every completed activity and every piece of recognition can show up
                  in the feed — giving people a reason to react, comment, and
                  discover something to join next.
                </p>
                <div className="mt-6 flex items-center gap-2 text-sm text-[#0B1F33]">
                  <Users className="w-4 h-4 text-[#B8935A]" />
                  Discovery, not just a leaderboard
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* ============ REWARDS ============ */}
        <section className="py-20 md:py-28 border-t border-[#E7E2D8]">
          <Container>
            <div className="max-w-xl mb-12">
              <p className="text-sm font-medium text-[#B8935A]">Rewards</p>
              <h2 className="font-[Fraunces] text-3xl md:text-4xl mt-3 text-[#0B1F33]">
                Points that spend like they mean something
              </h2>
              <p className="mt-4 text-[#5B6472] leading-relaxed">
                Each company builds its own catalog — gift cards, extra time off,
                merchandise, or tied into existing benefits and compensation programs.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { icon: Gift, title: 'Gift cards', detail: 'From a curated retailer list, set by the company' },
                { icon: Sparkles, title: 'Experiences', detail: 'Extra PTO, event tickets, team outings' },
                { icon: Building2, title: 'Benefit credits', detail: 'Applied toward company-defined programs' },
              ].map((r) => {
                const Icon = r.icon;
                return (
                  <div key={r.title} className="p-6 rounded-2xl border border-[#E7E2D8] bg-white">
                    <Icon className="w-5 h-5 text-[#B8935A]" strokeWidth={2} />
                    <h3 className="font-semibold text-[#0B1F33] mt-4">{r.title}</h3>
                    <p className="text-sm text-[#5B6472] mt-1">{r.detail}</p>
                  </div>
                );
              })}
            </div>
          </Container>
        </section>

        {/* ============ FINAL CTA ============ */}
        <section className="py-20 md:py-28">
          <Container>
            <div className="rounded-2xl bg-[#0B1F33] px-8 py-16 md:px-16 md:py-20 text-center">
              <h2 className="font-[Fraunces] text-3xl md:text-5xl text-white max-w-2xl mx-auto leading-tight">
                Give your people more reasons to participate
              </h2>
              <p className="mt-4 text-[#C3CBD6] max-w-lg mx-auto">
                Set up your first activity in an afternoon. No credit card required.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-4">
                <Button size="lg" onClick={openSignup} className="bg-white text-[#0B1F33] hover:bg-white/90 shadow-none">
                  Get started
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={openLogin}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Sign in
                </Button>
              </div>
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