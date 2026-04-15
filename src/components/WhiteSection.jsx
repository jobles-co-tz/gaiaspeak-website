import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getReservationCount } from '../config/supabase';

const braceletImages = [
  '/b_1.jpeg',
  '/b_2.jpeg',
  '/b_3.jpeg',
];

const features = [
  {
    icon: '�️',
    title: 'Autonomous + On-chain',
    desc: 'Self-directed wearable logic with secure blockchain identity',
  },
  {
    icon: '�',
    title: 'Laser UX + NFT Tap',
    desc: 'Projected controls and one-touch NFT creation',
  },
  {
    icon: '❤️',
    title: 'Climate + Health Signals',
    desc: 'Wellness metrics and environmental sensing in one form factor',
  },
];

export function WhiteSection() {
  const [orderCount, setOrderCount] = useState(0);
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    async function fetchCount() {
      const result = await getReservationCount();
      if (result.success) {
        setOrderCount(result.count);
      }
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
  <section id="white" className="py-16 sm:py-20 px-4 bg-linear-to-b from-slate-900/50 to-slate-950">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-xs font-medium tracking-widest text-white/80 uppercase">
              Hardware · {orderCount} Pre-Orders
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-slate-100 mb-4">
            Meet the <span className="text-white font-semibold">GaiaSpeak Wristband</span>.
          </h2>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            A fast preview of our wearable layer. View the full product page for specs, visuals,
            and pre-order/interest access.
          </p>
        </div>

        {/* Product Visual - Image Carousel */}
        <div className="relative mb-10 sm:mb-16">
          <div className="relative aspect-[4/3] sm:aspect-[16/9] rounded-lg sm:rounded-2xl overflow-hidden border border-slate-700/30">
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
            {/* Caption */}
            <div className="absolute bottom-4 left-4 right-4 text-center">
              <p className="text-xs sm:text-sm text-white/80">GaiaSpeak Bracelet · WHITE Collection</p>
            </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-10 sm:mb-16">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-3 sm:p-4 text-center hover:border-white/20 transition-colors"
            >
              <div className="text-xl sm:text-2xl mb-2">{f.icon}</div>
              <h4 className="text-xs sm:text-sm font-medium text-slate-200 mb-1">{f.title}</h4>
              <p className="text-[10px] sm:text-xs text-slate-500 leading-tight">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-4 sm:p-6 rounded-xl bg-linear-to-r from-slate-800/50 via-slate-800/30 to-slate-800/50 border border-slate-700/30">
            <div className="text-center sm:text-left">
              <h3 className="text-base sm:text-lg font-semibold text-slate-100 mb-1">
                Explore the Wristband
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                See full feature breakdown, sample visuals, and join the pre-order/interest flow.
              </p>
            </div>
            <Link
              to="/wristband"
              className="px-6 sm:px-8 py-3 bg-white hover:bg-slate-100 text-slate-900 font-semibold rounded transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/10 whitespace-nowrap text-sm sm:text-base"
            >
              View More Details
            </Link>
          </div>

          <p className="mt-4 text-xs text-slate-600">
            Wristband image shown on the next page is a sample render (not final production hardware)
          </p>
        </div>
      </div>
    </section>
  );
}

