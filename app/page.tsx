import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function Home() {
  const session = await getSession();
  if (session) {
    if (session.role === 'ADMIN') redirect('/dashboard/admin');
    if (session.role === 'TRAINER') redirect('/dashboard/trainer');
    redirect('/dashboard/member');
  }

  return (
    <div className="min-h-screen">

      {/* SECTION 1: HERO */}
      <section className="section flex flex-col justify-center min-h-[85vh]">
        <div className="container text-center animate-fade-in">
          <span className="text-caption mb-6 block tracking-[0.2em] text-indigo-400">THE FUTURE OF FITNESS</span>

          <h1 className="heading-hero max-w-4xl mx-auto mb-8">
            Reprogram Your Body <br /> With <span className="text-indigo-500">Intelligent Design.</span>
          </h1>

          <p className="text-body max-w-2xl mx-auto mb-12">
            Experience the symbiosis of luxury and technology.
            SmartGym uses biometric data to tailor every set, rep, and recovery session to your unique physiology.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/register" className="btn btn-primary min-w-[180px]">
              Start Free Trial
            </Link>
            <Link href="/features" className="btn btn-outline min-w-[180px]">
              Watch Film
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 2: METRICS / SEPARATION */}
      <section className="border-y border-[rgba(255,255,255,0.05)] bg-[rgba(0,0,0,0.3)] backdrop-blur-sm py-12">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-12 text-center">
            <div>
              <p className="text-4xl font-bold text-white mb-2">15k+</p>
              <p className="text-xs text-gray-500 uppercase tracking-widest">Members</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white mb-2">98%</p>
              <p className="text-xs text-gray-500 uppercase tracking-widest">Satisfaction</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white mb-2">24/7</p>
              <p className="text-xs text-gray-500 uppercase tracking-widest">Access</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white mb-2">∞ </p>
              <p className="text-xs text-gray-500 uppercase tracking-widest">Possibilities</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: FEATURES GRID */}
      <section className="section">
        <div className="container">
          <div className="mb-20 text-center sm:text-left">
            <h2 className="heading-section">Engineered for Performance.</h2>
            <p className="text-body max-w-xl">Every detail of the SmartGym ecosystem is designed to minimize friction and maximize results.</p>
          </div>

          <div className="grid-cols-3">
            {/* Card 1 */}
            <div className="card-premium">
              <div className="h-12 w-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 mb-8">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="heading-card">Biometric Sync</h3>
              <p className="text-body text-sm">
                Seamlessly integrates with your wearable devices to adjust workout intensity in real-time based on HRV and readiness.
              </p>
            </div>

            {/* Card 2 */}
            <div className="card-premium">
              <div className="h-12 w-12 bg-pink-500/10 rounded-xl flex items-center justify-center text-pink-400 mb-8">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <h3 className="heading-card">Adaptive AI</h3>
              <p className="text-body text-sm">
                Our proprietary algorithms learn your strength curve and automatically prescribe optimal progressive overload.
              </p>
            </div>

            {/* Card 3 */}
            <div className="card-premium">
              <div className="h-12 w-12 bg-violet-500/10 rounded-xl flex items-center justify-center text-violet-400 mb-8">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <h3 className="heading-card">Elite Coaching</h3>
              <p className="text-body text-sm">
                Direct access to world-class trainers for form checks, nutritional planning, and mental conditioning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: CALL TO ACTION */}
      <section className="section text-center">
        <div className="container">
          <div className="p-16 border border-[rgba(255,255,255,0.05)] rounded-[40px] bg-gradient-to-b from-[rgba(255,255,255,0.03)] to-transparent backdrop-blur-md">
            <h2 className="heading-section mb-6">Ready to Ascend?</h2>
            <p className="text-body max-w-xl mx-auto mb-10">Join the waitlist for our next cohort and secure your legacy.</p>
            <Link href="/register" className="btn btn-primary px-12">
              Begin Application
            </Link>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-[rgba(255,255,255,0.05)] text-center text-gray-500 text-sm">
        <p>© 2026 SmartGym Systems. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
