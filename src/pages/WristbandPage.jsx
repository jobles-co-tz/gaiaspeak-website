import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { PreOrderModal } from '../components/PreOrderModal';

const coreFeatures = [
  {
    title: 'Full autonomy',
    text: 'Standalone wrist intelligence with encrypted local controls and wallet-linked identity.',
  },
  {
    title: 'Laser projector',
    text: 'Micro-laser UI projection for one-glance status, wallet actions, and emergency guidance.',
  },
  {
    title: 'One-touch NFT creation',
    text: 'Capture a moment, mint provenance instantly, and anchor ownership on-chain in one gesture.',
  },
  {
    title: 'Climate + health tracking',
    text: 'Wearable telemetry for wellness, UV exposure, air quality, and personal environmental signals.',
  },
  {
    title: 'On-chain security',
    text: 'Security-first architecture designed to pair biometric authentication with transparent blockchain logs.',
  },
];

export function WristbandPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      <main className="pt-24 sm:pt-28 pb-16">
        <section className="px-4 mb-12 sm:mb-16">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs tracking-widest uppercase text-amber-300 mb-4">
                GaiaSpeak Wristband
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-light leading-tight mb-4">
                The future of <span className="text-amber-400 italic">wealth + intelligence</span> on your wrist.
              </h1>
              <p className="text-sm sm:text-base text-slate-300/90 max-w-xl mb-6 leading-relaxed">
                GaiaSpeak Wristband is designed for sovereign users: full autonomy, ambient sensing, instant NFT creation,
                and hardened on-chain continuity in a single wearable protocol surface.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded transition-all hover:-translate-y-0.5"
                >
                  Reserve / Join Interest List
                </button>
                <Link
                  to="/#trade"
                  className="px-6 py-3 border border-slate-600 hover:border-amber-500 text-slate-300 hover:text-amber-300 rounded transition-colors text-center"
                >
                  Back to token markets
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 -z-10 blur-3xl bg-amber-500/20 rounded-full" />
              <img
                src="/brecelets.jpeg"
                alt="GaiaSpeak Wristband sample concept image"
                className="w-full rounded-2xl border border-amber-500/30 object-cover max-h-115"
              />
              <p className="mt-3 text-xs text-slate-400 bg-slate-900/70 border border-slate-700/60 rounded p-3">
                Demo visual notice: the image above is a sample concept render and not the final production GaiaSpeak device.
              </p>
            </div>
          </div>
        </section>

        <section className="px-4 mb-12 sm:mb-16">
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coreFeatures.map((feature) => (
              <div key={feature.title} className="bg-slate-900/70 border border-slate-700/60 rounded-xl p-5">
                <h3 className="text-lg text-amber-300 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-4">
          <div className="max-w-5xl mx-auto rounded-2xl border border-amber-500/30 bg-linear-to-r from-slate-900 via-slate-900/90 to-amber-500/10 p-6 sm:p-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-light mb-3">Built for transparent ownership, not hype.</h2>
            <p className="text-sm sm:text-base text-slate-300 mb-5 max-w-2xl mx-auto">
              Every reservation and future delivery milestone can be publicly auditable.
              Today it runs with Supabase-backed mock blockchain logic; tomorrow it can switch to live contracts without UI rewrite.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-3 bg-white text-slate-900 font-semibold rounded hover:bg-slate-100 transition-colors"
            >
              Pre-order interest now
            </button>
          </div>
        </section>
      </main>

      <Footer />
      <PreOrderModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
