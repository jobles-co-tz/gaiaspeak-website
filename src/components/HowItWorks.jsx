const steps = [
  {
    num: '01',
    title: 'Connect Your Wallet',
    text: 'Connect MetaMask or any Polygon-compatible wallet. Your keys, your gold. GaiaSpeak never holds your assets — the smart contract does, and it is publicly auditable on Polygonscan by anyone at any time.',
  },
  {
    num: '02',
    title: 'Buy at the Live Oracle Price',
    text: 'Send any amount from $1.00 in MATIC. The protocol fetches the live gold or silver price per gram via Chainlink oracle and mints your exact fractional gram amount. No fixed price. No rounding in our favour.',
  },
  {
    num: '03',
    title: 'Own It On-Chain',
    text: 'Your GSG or GSS tokens appear in your wallet immediately. Hold them. Transfer them. Sell them back at the live price. For physical delivery, you join the 1kg community queue and oracles auto-select the cheapest verified supplier.',
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="py-12 sm:py-20 px-4 bg-slate-900/50">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="text-[10px] sm:text-xs font-semibold tracking-widest text-amber-400 uppercase mb-2">
            Simple by Design
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-slate-100 mb-3 sm:mb-4">
            Three steps to <span className="text-amber-400 italic">real ownership.</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-lg">
            No bank. No broker. No middleman. Just you, your wallet, and the blockchain that never sleeps.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          {steps.map((step) => (
            <div key={step.num} className="relative">
              {/* Large Background Number */}
              <div className="absolute -top-2 sm:-top-4 -left-1 sm:-left-2 text-5xl sm:text-7xl font-light text-amber-500/5 select-none pointer-events-none">
                {step.num}
              </div>

              <div className="relative pt-4">
                <h3 className="text-xs sm:text-sm font-semibold tracking-wider text-amber-400 uppercase mb-2">
                  {step.title}
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  {step.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

