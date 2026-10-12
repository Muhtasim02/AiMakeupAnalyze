import React from 'react';
import { User, Sparkles, Camera, Heart, Scale, ArrowRight, ShieldCheck, Clock, MapPin, Wallet } from 'lucide-react';
import { Product, SkinAnalysisResult, UserProfile } from '../types';
import { ProductCard } from '../components/ProductCard';

interface DashboardPageProps {
  user: UserProfile;
  recentAnalysis: SkinAnalysisResult;
  recommendedProducts: Product[];
  favoriteIds: string[];
  compareIds: string[];
  onToggleFavorite: (id: string) => void;
  onToggleCompare: (id: string) => void;
  onSelectProduct: (id: string) => void;
  onNavigate: (page: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  recentAnalysis,
  recommendedProducts,
  favoriteIds,
  compareIds,
  onToggleFavorite,
  onToggleCompare,
  onSelectProduct,
  onNavigate,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* 1. User Header & Primary Metrics */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200/90 shadow-sm space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-stone-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-stone-900 text-white flex items-center justify-center text-xl font-serif-display font-bold shadow-md">
              {user.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 uppercase tracking-wider">
                <span>Personal Profile</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-700">Verified User</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif-display font-bold text-stone-950 mt-0.5">
                Welcome, {user.name}
              </h1>
              <div className="text-xs text-stone-500 mt-1">{user.email}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('analyze-selfie')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-950 hover:bg-stone-800 text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>New Analysis</span>
            </button>
            <button
              onClick={() => onNavigate('favorites')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              <span>Favorites ({favoriteIds.length})</span>
            </button>
          </div>
        </div>

        {/* User Configuration Display Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-1">
            <div className="text-xs uppercase tracking-wider text-stone-500">Skin Tone</div>
            <div className="text-xl font-serif-display font-bold text-stone-900">{user.skinTone}</div>
            <div className="text-[11px] text-stone-500">Melanin Depth Index 04</div>
          </div>

          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-1">
            <div className="text-xs uppercase tracking-wider text-stone-500">Undertone</div>
            <div className="text-xl font-serif-display font-bold text-stone-900">{user.undertone}</div>
            <div className="text-[11px] text-stone-500">Golden / Warm Hue</div>
          </div>

          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-1">
            <div className="text-xs uppercase tracking-wider text-stone-500">Budget Limit</div>
            <div className="text-xl font-serif-display font-bold font-mono-nums text-stone-900">
              {user.currency}{user.budget.toLocaleString()}
            </div>
            <div className="text-[11px] text-stone-500">Optimal Price Filter</div>
          </div>

          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-1">
            <div className="text-xs uppercase tracking-wider text-stone-500">Country / Hub</div>
            <div className="text-xl font-serif-display font-bold text-stone-900">{user.country}</div>
            <div className="text-[11px] text-stone-500">Official Local Outlets</div>
          </div>
        </div>

      </div>

      {/* 2. Recent Analysis Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
              Dermal Diagnostic Record
            </h2>
            <h3 className="text-2xl font-serif-display font-bold text-stone-950">
              Recent Skin Analysis
            </h3>
          </div>
          <div className="inline-flex items-center gap-2 text-xs text-stone-500 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200">
            <Clock className="w-3.5 h-3.5" />
            <span>Captured {user.lastAnalysisDate || 'Recently'}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-3 flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl border border-black/15 shadow-sm shrink-0"
              style={{ backgroundColor: recentAnalysis.hexColor }}
              aria-hidden="true"
            />
            <div>
              <div className="text-sm font-semibold text-stone-900">{recentAnalysis.shadeFamily}</div>
              <div className="text-xs font-mono-nums text-stone-500">Hex: {recentAnalysis.hexColor}</div>
            </div>
          </div>

          <div className="md:col-span-6 text-xs text-stone-600 leading-relaxed">
            {recentAnalysis.notes}
          </div>

          <div className="md:col-span-3 flex flex-col items-end justify-center space-y-2">
            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider text-stone-500">Confidence</span>
              <div className="text-xl font-bold font-mono-nums text-emerald-700">
                {recentAnalysis.confidence}% Accurate
              </div>
            </div>
            <button
              onClick={() => onNavigate('analysis-result')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-stone-900 hover:text-stone-600 transition-colors"
            >
              <span>View Full Report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Recommended Products for You */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
              Top Complexion Matches
            </h2>
            <h3 className="text-2xl font-serif-display font-bold text-stone-950">
              Recommended for Your Profile
            </h3>
          </div>
          <button
            onClick={() => onNavigate('recommendations')}
            className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-stone-900 hover:text-stone-600 transition-colors"
          >
            <span>View All Recommendations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendedProducts.slice(0, 3).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isFavorite={favoriteIds.includes(product.id)}
              isInCompare={compareIds.includes(product.id)}
              onToggleFavorite={onToggleFavorite}
              onToggleCompare={onToggleCompare}
              onSelectProduct={onSelectProduct}
            />
          ))}
        </div>
      </div>

    </div>
  );
};
