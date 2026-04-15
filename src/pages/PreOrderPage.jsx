import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { PreOrderModal } from '../components/PreOrderModal';
import { getReservationCount } from '../config/supabase';

const braceletImages = [
  '/b_1.jpeg',
  '/b_2.jpeg',
  '/b_3.jpeg',
];

const features = [
  { icon: '📱', title: 'App Integration', desc: 'Full sync with GaiaSpeak mobile app' },
  { icon: '💳', title: 'Payment Function', desc: 'Tap-to-pay with your GSG/GSS tokens' },
  { icon: '🔐', title: 'Identity Verification', desc: 'Secure on-chain identity linked to your wallet' },
  { icon: '❤️', title: 'Health Monitoring', desc: 'Track vitals and wellness metrics' },
  { icon: '🌍', title: 'Environmental Sensing', desc: 'Air quality and UV exposure alerts' },
  { icon: '📡', title: 'Offline Capability', desc: 'Works without internet connection' },
];

export function PreOrderPage() {
  const { isConnected } = useAccount();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [isLoadingCount, setIsLoadingCount] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    async function fetchCount() {
      setIsLoadingCount(true);
      const result = await getReservationCount();
      if (result.success) {
        setOrderCount(result.count);
      }
      setIsLoadingCount(false);
    }
    fetchCount();
  }, []);

  // Auto-rotate images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % braceletImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-semibold">
            <span className="text-amber-400">Gaia</span>
            <span className="text-slate-400">Speak</span>
          </Link>
          <Link to="/" className="text-sm text-slate-400 hover:text-amber-400 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold tracking-wider uppercase mb-4">
              Limited Edition
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light mb-4">
              <span className="text-white">WHITE</span>
              <span className="text-slate-400 ml-3">Bracelet</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-6">
              The world's first precious metals-backed wearable. Your wealth, on your wrist.
            </p>
            
            {/* Pre-order Counter */}
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-amber-500/10 border border-amber-500/30">
              <span className="text-amber-400 text-2xl font-light">
                {isLoadingCount ? '...' : orderCount}
              </span>
              <span className="text-amber-400/70 text-sm">
                pre-orders placed
              </span>
            </div>
          </div>

          {/* Product Visual - Image Carousel */}
          <div className="relative mb-12">
            <div className="relative aspect-[4/3] sm:aspect-video rounded-2xl overflow-hidden border border-slate-700/30">
              {/* Images */}
              {braceletImages.map((src, index) => (
                <img
                  key={src}
                  src={src}
                  alt={`WHITE Bracelet ${index + 1}`}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                    index === currentImage ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              ))}
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
            </div>

            {/* Image Indicators */}
            <div className="flex justify-center gap-2 mt-4">
              {braceletImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImage(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentImage
                      ? 'bg-white w-6'
                      : 'bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 text-center hover:border-white/30 transition-colors"
              >
                <div className="text-2xl mb-2">{feature.icon}</div>
                <h3 className="text-sm font-semibold text-slate-200 mb-1">{feature.title}</h3>
                <p className="text-xs text-slate-500">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <div className="inline-flex flex-col items-center gap-4 p-6 rounded-xl bg-linear-to-r from-slate-800/50 via-slate-800/30 to-slate-800/50 border border-slate-700/30">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-slate-100 mb-2">Reserve Your Bracelet</h3>
                <p className="text-slate-400 text-sm">Hold GSG or GSS tokens to qualify for pre-order</p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-8 py-3 bg-white text-slate-900 font-semibold rounded-lg hover:bg-slate-100 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/20"
              >
                Pre-Order Now
              </button>
              <p className="text-xs text-slate-500">
                {isConnected ? '✓ Wallet connected' : 'Connect wallet to continue'}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Pre-order Modal */}
      <PreOrderModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

