export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-8 sm:py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
          {/* Brand */}
          <div className="text-center md:text-left">
            <div className="text-lg sm:text-xl font-semibold mb-1">
              <span className="text-amber-400">Gaia</span>
              <span className="text-slate-400">Speak</span>
              <span className="text-slate-600 text-xs sm:text-sm font-normal ml-2">Protocol</span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500">
              Polygon Network · Precious Metals Tokenisation · Built from Africa, for the World
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-6">
            <a href="#trade" className="text-[10px] sm:text-xs text-slate-500 hover:text-amber-400 uppercase tracking-wider transition-colors">
              Trade
            </a>
            <a href="#how" className="text-[10px] sm:text-xs text-slate-500 hover:text-amber-400 uppercase tracking-wider transition-colors">
              How It Works
            </a>
            <a href="#white" className="text-[10px] sm:text-xs text-white/80 hover:text-white uppercase tracking-wider transition-colors">
              WHITE
            </a>
            <a href="/wristband" className="text-[10px] sm:text-xs text-slate-500 hover:text-amber-400 uppercase tracking-wider transition-colors">
              Wristband
            </a>
            <a
              href="https://amoy.polygonscan.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] sm:text-xs text-slate-500 hover:text-amber-400 uppercase tracking-wider transition-colors"
            >
              Polygonscan
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-800/50 text-center">
          <p className="text-[10px] sm:text-xs text-slate-600">
            © 2026 GaiaSpeak Protocol · Not financial advice · Users interact at their own risk
          </p>
          <p className="text-[10px] sm:text-xs text-amber-500/50 mt-2 italic">
            "Let the chain speak first."
          </p>
        </div>
      </div>
    </footer>
  );
}

