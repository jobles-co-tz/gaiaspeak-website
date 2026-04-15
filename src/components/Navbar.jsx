import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useProtocolStage } from '../hooks/useProtocolStage';

export function Navbar() {
  const { stageName, stageColor } = useProtocolStage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/#trade', label: 'Trade' },
    { href: '/#how', label: 'How It Works' },
    { href: '/#ecosystem', label: 'Ecosystem' },
    { href: '/wristband', label: 'Wristband' },
    { href: '/#white', label: 'WHITE', highlight: true },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-amber-500/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-linear-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <span className="text-slate-900 font-bold text-xs sm:text-sm">G</span>
            </div>
            <span className="text-lg sm:text-xl font-semibold">
              <span className="text-amber-400">Gaia</span>
              <span className="text-slate-400">Speak</span>
            </span>
          </div>

          {/* Center - Stage Indicator (hidden on mobile) */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: stageColor }} />
            <span className="text-xs font-medium text-slate-400">
              Stage: <span style={{ color: stageColor }}>{stageName}</span>
            </span>
          </div>

          {/* Right - Navigation & Connect */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4 lg:gap-6">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`text-sm transition-colors ${
                    link.highlight
                      ? 'text-white hover:text-white/80 font-medium'
                      : 'text-slate-400 hover:text-amber-400'
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Connect Button */}
            <ConnectButton
              chainStatus="icon"
              showBalance={false}
              accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }}
            />

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-slate-200"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 py-3">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded text-sm transition-colors ${
                    link.highlight
                      ? 'text-white bg-white/5 font-medium'
                      : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800/50'
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </div>
            {/* Mobile Stage Indicator */}
            <div className="mt-3 pt-3 border-t border-slate-800 px-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: stageColor }} />
                <span className="text-xs text-slate-500">
                  Stage: <span style={{ color: stageColor }}>{stageName}</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

