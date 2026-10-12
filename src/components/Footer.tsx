import React from 'react';
import { Sparkles, Shield, ArrowUpRight } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800 pt-16 pb-12 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-stone-800">
          
          {/* Brand & Project Info */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-2xl font-serif-display font-bold text-white tracking-wide">
              AI MakeupMatch
            </h2>
            <p className="text-sm text-stone-400 max-w-sm leading-relaxed">
              Personalized makeup finder using computer vision and undertone spectral matching. Designed for South Asian and global diverse complexions.
            </p>
            <div className="inline-flex items-center gap-2 text-xs text-stone-400 bg-stone-800/80 px-3 py-1.5 rounded-md border border-stone-700">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Intelligent Cosmetic Complexion & Match Engine</span>
            </div>
          </div>

          {/* Core Journey Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-200">
              Match Engine
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('analyze-selfie')}
                  className="text-stone-400 hover:text-white transition-colors cursor-pointer text-left"
                >
                  Analyze Selfie
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('analysis-result')}
                  className="text-stone-400 hover:text-white transition-colors cursor-pointer text-left"
                >
                  Analysis Result
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('recommendations')}
                  className="text-stone-400 hover:text-white transition-colors cursor-pointer text-left"
                >
                  Recommendations
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('products')}
                  className="text-stone-400 hover:text-white transition-colors cursor-pointer text-left"
                >
                  All Products
                </button>
              </li>
            </ul>
          </div>

          {/* User & Tools */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-200">
              User Experience
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="text-stone-400 hover:text-white transition-colors cursor-pointer text-left"
                >
                  User Dashboard
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('favorites')}
                  className="text-stone-400 hover:text-white transition-colors cursor-pointer text-left"
                >
                  Saved Favorites
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('compare')}
                  className="text-stone-400 hover:text-white transition-colors cursor-pointer text-left"
                >
                  Compare Products
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('login')}
                  className="text-stone-400 hover:text-white transition-colors cursor-pointer text-left"
                >
                  Log In
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('signup')}
                  className="text-stone-400 hover:text-white transition-colors cursor-pointer text-left"
                >
                  Sign Up
                </button>
              </li>
            </ul>
          </div>

          {/* Administrative & Technical */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-200">
              System Console
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('admin')}
                  className="inline-flex items-center gap-1.5 text-stone-400 hover:text-white transition-colors cursor-pointer text-left"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin Dashboard</span>
                </button>
              </li>
              <li className="text-xs text-stone-500 pt-2 leading-relaxed">
                Core Features:
                <br />
                • Deterministic 100-Pt Scoring Engine
                <br />
                • Real-Time Product Stock & Pricing
                <br />
                • AI Multimodal Complexion Matching
                <br />
                • Side-by-Side Formula Comparison
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <p>© 2026 AI MakeupMatch. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <button onClick={() => onNavigate('home')} className="hover:text-stone-300">Home</button>
            <button onClick={() => onNavigate('products')} className="hover:text-stone-300">Catalog</button>
            <button onClick={() => onNavigate('admin')} className="hover:text-stone-300">Admin</button>
          </div>
        </div>
      </div>
    </footer>
  );
};
