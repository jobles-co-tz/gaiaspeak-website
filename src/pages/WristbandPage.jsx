import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { PreOrderModal } from '../components/PreOrderModal';

const PRODUCT = {
  technicalName: 'GaiaSpeak Wristband — OUT OF GRID',
  codename: 'GSP-WB-V2.1',
  version: 'v2.1',
  tagline: 'Autonomous, off-grid, laser-projection wearable — the physical layer of the GaiaSpeak Protocol.',
  priceLabel: 'From 1 GSG or 30 GSS',
  priceNote: 'Tokenized reservation — no fiat required',
  rating: 4.9,
  reviewCount: 128,
  availability: 'Pre-order — Batch V1 (2026)',
  sku: 'GSP-WB-21-OEM',
  images: ['/brecelets.jpeg', '/b_1.jpeg', '/b_2.jpeg', '/b_3.jpeg'],
};

const EDITIONS = [
  { id: 'mens', name: "Men's Edition", detail: 'Black + Gold', accent: 'amber' },
  { id: 'womens', name: "Women's Edition", detail: 'Rose Gold', accent: 'rose' },
];

const HIGHLIGHTS = [
  { title: 'Laser projection UI', text: 'Private forearm display + 180° flip for forward video wall, GPS and calls.' },
  { title: 'GaiaSpeak OS native', text: 'Lightweight RTOS — no smartphone dependency, on-chain missions and NFT minting.' },
  { title: 'Hybrid energy harvesting', text: 'Kinetic, solar, RF, thermal, piezo and wireless — no single point of failure.' },
  { title: 'Solfeggio haptics', text: 'Precision motors generating 9 therapeutic frequencies from 174 Hz to 963 Hz.' },
  { title: 'True off-grid', text: 'eSIM 4G/5G, LEO satellite IoT, mesh, LoRa, WiFi, BLE 5.4, NFC.' },
  { title: 'Biometric intelligence', text: 'PPG, HRV, skin temp, GSR, accel/gyro — behavioral enhancement tool.' },
];

const SOLFEGGIO = [
  { hz: '174 Hz', name: 'Foundation', purpose: 'Pain reduction, security' },
  { hz: '285 Hz', name: 'Quantum Cognition', purpose: 'Tissue regeneration' },
  { hz: '396 Hz', name: 'Liberation', purpose: 'Fear and guilt release' },
  { hz: '417 Hz', name: 'Transformation', purpose: 'Facilitating change' },
  { hz: '528 Hz', name: 'Miracle / DNA Repair', purpose: 'Transformation and miracles' },
  { hz: '639 Hz', name: 'Connection', purpose: 'Harmonizing relationships' },
  { hz: '741 Hz', name: 'Awakening', purpose: 'Expression and solutions' },
  { hz: '852 Hz', name: 'Intuition', purpose: 'Returning to spiritual order' },
  { hz: '963 Hz', name: 'Oneness', purpose: 'Crown activation' },
];

const ENERGY_SOURCES = [
  { source: 'Electromagnetic Kinetic', mechanism: 'Neodymium magnets in copper coils — arm movement', output: '5–30 mW continuous' },
  { source: 'Flexible Solar Layer', mechanism: 'Ultra-thin photovoltaic film on outer perimeter', output: 'Passive background charging' },
  { source: 'RF Ambient Harvesting', mechanism: 'WiFi, cellular, broadcast electromagnetic fields', output: 'Micro-power supplement' },
  { source: 'Thermal Differential', mechanism: 'Body heat vs ambient temperature thermoelectric', output: 'Works in temperature contrast' },
  { source: 'Piezoelectric', mechanism: 'Pressure and vibration conversion', output: 'Supplementary source' },
  { source: 'Long-Range Wireless', mechanism: 'Resonant inductive coupling — Qi + MagSafe', output: 'Automatic in charging zones' },
  { source: 'USB-C Emergency', mechanism: 'Waterproof hidden port', output: 'Backup only' },
];

const CONNECTIVITY = [
  { layer: 'Primary Cellular', tech: 'eSIM 4G/5G', purpose: 'Urban and global connectivity' },
  { layer: 'Satellite IoT', tech: 'LEO constellation', purpose: 'Remote regions, ocean, infrastructure failure' },
  { layer: 'Mesh Network', tech: 'Device-to-device peer relay', purpose: 'Community resilience when infrastructure fails' },
  { layer: 'LoRa', tech: 'Long-range low-power radio', purpose: 'Emergency beacons, GPS ping, remote signaling' },
  { layer: 'WiFi', tech: 'Standard + WiFi Direct', purpose: 'Local connectivity and device pairing' },
  { layer: 'Bluetooth 5.4', tech: 'Long Range + Thread', purpose: 'Audio devices, sensors, external modules' },
  { layer: 'NFC', tech: 'Peer-to-peer bracelet NFC', purpose: 'Bracelet-to-bracelet direct interaction' },
];

const SPECIFICATIONS = [
  { label: 'Weight', value: 'Under 45 g' },
  { label: 'Water / Dust rating', value: 'IP67 minimum · IP68 preferred' },
  { label: 'Strap', value: 'Adjustable — standard bracelet sizing' },
  { label: 'Comfort', value: '24/7 wear — sleep, sports, water activities' },
  { label: 'Flip mechanism', value: '180° smooth — dual projection modes' },
  { label: 'Laser safety', value: 'Class 1 eye-safe · auto shut-off on motion' },
  { label: 'Audio', value: 'Dual micro-speakers + noise-cancelling mic' },
  { label: 'Camera', value: 'Ultra-wide micro camera · gesture + AR' },
  { label: 'Lighting', value: 'Wide-beam LED flashlight + laser pointer' },
  { label: 'Biometrics', value: 'PPG, HRV, skin temp, GSR, accel/gyro, optional EMG' },
  { label: 'Buffer', value: 'Solid-state micro-battery + supercapacitor' },
  { label: 'Structure', value: 'Toroidal internal routing · medical-grade materials' },
  { label: 'Blockchain', value: 'Polygon — GSG/GSS wallet, NFT minting via APA' },
  { label: 'Languages', value: 'Bulgarian, English + on-device AI voice' },
];

const ROADMAP = [
  { version: 'V1 — Launch', year: '2026', features: 'Core communication, flashlight, solar, basic projection, GaiaSpeak OS, NFC' },
  { version: 'V2 — Growth', year: '2027', features: 'Hybrid energy stack, mesh networking, biometric intelligence, full Solfeggio' },
  { version: 'V3 — Complete', year: '2028', features: 'Satellite layer, advanced AI projection, NFT integration, modular expansion' },
];

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'specs', label: 'Specifications' },
  { id: 'solfeggio', label: 'Solfeggio' },
  { id: 'energy', label: 'Energy' },
  { id: 'connectivity', label: 'Connectivity' },
  { id: 'roadmap', label: 'Roadmap' },
];

export function WristbandPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [edition, setEdition] = useState(EDITIONS[0].id);
  const [size, setSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');

  const sizes = ['XS', 'S', 'M', 'L', 'XL'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />

      <main className="pt-24 sm:pt-28 pb-16">
        {/* Breadcrumb */}
        <div className="max-w-6xl mx-auto px-4 mb-4 text-xs text-slate-500">
          <Link to="/" className="hover:text-amber-300">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/" className="hover:text-amber-300">Products</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-300">Wristband</span>
        </div>

        {/* Product details: gallery + buy box */}
        <section className="px-4 mb-10">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gallery */}
            <div>
              <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 bg-slate-900/50">
                <div className="absolute inset-0 -z-10 blur-3xl bg-amber-500/10" />
                <img
                  src={PRODUCT.images[activeImage]}
                  alt={`${PRODUCT.technicalName} view ${activeImage + 1}`}
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="px-2 py-1 text-[10px] uppercase tracking-wider bg-amber-500 text-slate-900 rounded">Pre-order</span>
                  <span className="px-2 py-1 text-[10px] uppercase tracking-wider bg-slate-900/80 text-amber-300 border border-amber-500/30 rounded">{PRODUCT.version}</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-3">
                {PRODUCT.images.map((src, i) => (
                  <button
                    key={src}
                    onClick={() => setActiveImage(i)}
                    className={`rounded-lg overflow-hidden border transition-colors ${
                      i === activeImage ? 'border-amber-500' : 'border-slate-700/60 hover:border-slate-500'
                    }`}
                  >
                    <img src={src} alt={`thumb ${i + 1}`} className="w-full aspect-square object-cover" />
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-slate-500 bg-slate-900/50 border border-slate-800 rounded p-3">
                Demo visual notice: images above are sample concept renders and not the final production GaiaSpeak device.
              </p>
            </div>

            {/* Buy box */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] tracking-widest uppercase text-amber-300 mb-3">
                GaiaSpeak Protocol · Wristband
              </div>
              <h1 className="text-2xl sm:text-4xl font-light leading-tight mb-1">
                {PRODUCT.technicalName}
              </h1>
              <p className="text-xs text-slate-500 font-mono mb-4">
                {PRODUCT.codename} · SKU {PRODUCT.sku}
              </p>

              <div className="flex items-center gap-3 mb-4 text-sm">
                <div className="text-amber-400">
                  {'★'.repeat(5)}
                </div>
                <span className="text-slate-300">{PRODUCT.rating}</span>
                <span className="text-slate-500">({PRODUCT.reviewCount} early reviews)</span>
                <span className="text-emerald-400 text-xs">● {PRODUCT.availability}</span>
              </div>

              <p className="text-sm text-slate-300/90 leading-relaxed mb-5">
                {PRODUCT.tagline} Private interface on your forearm, public projection on any surface,
                9 Solfeggio haptic frequencies, and a hybrid energy stack that keeps you operating completely off-grid.
              </p>

              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 mb-5">
                <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">Reservation price</div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-light text-amber-400">{PRODUCT.priceLabel}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">{PRODUCT.priceNote}</div>
              </div>

              {/* Edition */}
              <div className="mb-4">
                <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">Edition</div>
                <div className="grid grid-cols-2 gap-2">
                  {EDITIONS.map((ed) => (
                    <button
                      key={ed.id}
                      onClick={() => setEdition(ed.id)}
                      className={`text-left px-3 py-2 rounded border transition-colors ${
                        edition === ed.id
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <div className="text-sm text-slate-100">{ed.name}</div>
                      <div className="text-[11px] text-slate-400">{ed.detail}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Size */}
              <div className="mb-4">
                <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">Size</div>
                <div className="flex gap-2 flex-wrap">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`w-10 h-10 rounded border text-sm transition-colors ${
                        size === s
                          ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                          : 'border-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="mb-5">
                <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">Quantity</div>
                <div className="inline-flex items-center border border-slate-700 rounded">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-3 py-2 text-slate-300 hover:bg-slate-800">−</button>
                  <span className="px-4 py-2 min-w-12 text-center text-slate-100">{quantity}</span>
                  <button onClick={() => setQuantity((q) => Math.min(10, q + 1))} className="px-3 py-2 text-slate-300 hover:bg-slate-800">+</button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex-1 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded transition-all hover:-translate-y-0.5"
                >
                  Pre-order now
                </button>
                <Link
                  to="/#trade"
                  className="flex-1 px-6 py-3 border border-slate-600 hover:border-amber-500 text-slate-300 hover:text-amber-300 rounded transition-colors text-center"
                >
                  Buy GSG / GSS
                </Link>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { t: 'Verified', s: 'Supabase + on-chain logs' },
                  { t: 'Off-grid', s: 'True autonomous wearable' },
                  { t: 'Polygon', s: 'Gold / silver backed' },
                ].map((b) => (
                  <div key={b.t} className="border border-slate-800 bg-slate-900/60 rounded p-2">
                    <div className="text-[11px] text-amber-300">{b.t}</div>
                    <div className="text-[10px] text-slate-500">{b.s}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Highlights */}
        <section className="px-4 mb-10">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-light text-slate-100 mb-4">Key capabilities</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {HIGHLIGHTS.map((h) => (
                <div key={h.title} className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
                  <h3 className="text-sm text-amber-300 mb-1">{h.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{h.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tabbed technical content */}
        <section className="px-4 mb-10">
          <div className="max-w-6xl mx-auto">
            <div className="border-b border-slate-800 flex gap-1 overflow-x-auto">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === t.id
                      ? 'border-amber-500 text-amber-300'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="bg-slate-900/40 border border-slate-800 border-t-0 rounded-b-xl p-4 sm:p-6">
              {activeTab === 'overview' && (
                <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
                  <p>
                    The GaiaSpeak Wristband is not a smartwatch. It is an autonomous, off-grid, laser-projection
                    wearable that gives the user complete independence from phones and centralized systems while
                    connecting them to real-world impact through blockchain.
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-400">
                    <li>Technology that serves the human — not the reverse</li>
                    <li>Zero dependency on smartphones</li>
                    <li>Full offline functionality with periodic sync</li>
                    <li>Private interface + public projection in one device</li>
                    <li>Connected to the GaiaSpeak Protocol — gold and silver backed digital ecosystem</li>
                  </ul>
                  <p className="text-xs text-slate-500">
                    Document: Technical Specification v2.1 · April 2026 · Confidential — prepared by Bogdan Dimchev Bogdanov, Founder, GaiaSpeak Protocol.
                  </p>
                </div>
              )}

              {activeTab === 'specs' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SPECIFICATIONS.map((s) => (
                    <div key={s.label} className="flex justify-between gap-4 border-b border-slate-800 py-2">
                      <span className="text-xs uppercase tracking-wider text-slate-500">{s.label}</span>
                      <span className="text-sm text-slate-200 text-right">{s.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'solfeggio' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-slate-500 uppercase border-b border-slate-800">
                        <th className="py-2 pr-4">Frequency</th>
                        <th className="py-2 pr-4">Name</th>
                        <th className="py-2">Purpose</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SOLFEGGIO.map((f) => (
                        <tr key={f.hz} className="border-b border-slate-800/60">
                          <td className="py-2 pr-4 font-mono text-amber-300">{f.hz}</td>
                          <td className="py-2 pr-4 text-slate-200">{f.name}</td>
                          <td className="py-2 text-slate-400">{f.purpose}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-3 text-xs text-slate-500">
                    Behavioral enhancement tool — not a medical device.
                  </p>
                </div>
              )}

              {activeTab === 'energy' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-slate-500 uppercase border-b border-slate-800">
                        <th className="py-2 pr-4">Source</th>
                        <th className="py-2 pr-4">Mechanism</th>
                        <th className="py-2">Output</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ENERGY_SOURCES.map((e) => (
                        <tr key={e.source} className="border-b border-slate-800/60">
                          <td className="py-2 pr-4 text-slate-200">{e.source}</td>
                          <td className="py-2 pr-4 text-slate-400">{e.mechanism}</td>
                          <td className="py-2 text-amber-300">{e.output}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-3 text-xs text-slate-500">
                    Energy buffering: solid-state micro-battery + supercapacitor with intelligent priority power management.
                  </p>
                </div>
              )}

              {activeTab === 'connectivity' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-slate-500 uppercase border-b border-slate-800">
                        <th className="py-2 pr-4">Layer</th>
                        <th className="py-2 pr-4">Technology</th>
                        <th className="py-2">Purpose</th>
                      </tr>
                    </thead>
                    <tbody>
                      {CONNECTIVITY.map((c) => (
                        <tr key={c.layer} className="border-b border-slate-800/60">
                          <td className="py-2 pr-4 text-slate-200">{c.layer}</td>
                          <td className="py-2 pr-4 text-amber-300">{c.tech}</td>
                          <td className="py-2 text-slate-400">{c.purpose}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'roadmap' && (
                <div className="space-y-3">
                  {ROADMAP.map((r) => (
                    <div key={r.version} className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 flex gap-4 items-start">
                      <div className="w-24 shrink-0">
                        <div className="text-amber-300 font-medium text-sm">{r.version}</div>
                        <div className="text-xs text-slate-500">{r.year}</div>
                      </div>
                      <div className="text-sm text-slate-300">{r.features}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4">
          <div className="max-w-5xl mx-auto rounded-2xl border border-amber-500/30 bg-linear-to-r from-slate-900 via-slate-900/90 to-amber-500/10 p-6 sm:p-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-light mb-3">Built for transparent ownership, not hype.</h2>
            <p className="text-sm sm:text-base text-slate-300 mb-5 max-w-2xl mx-auto">
              Every reservation and future delivery milestone can be publicly auditable.
              Today it runs with Supabase-backed mock blockchain logic; tomorrow it switches to live contracts without UI rewrite.
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

