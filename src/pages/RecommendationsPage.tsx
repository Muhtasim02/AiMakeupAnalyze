import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Camera,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Filter,
  DollarSign,
  Globe,
  Sliders,
  RefreshCw,
  Info,
  ChevronRight,
  TrendingUp,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import { Product, SkinTone, Undertone, UserProfile } from '../types';
import { ProductCard } from '../components/ProductCard';
import { fetchRecommendations, fetchCategories, RecommendationResult } from '../services/api';
import { deduplicateAndGroupProducts } from '../utils/productUtils';

interface RecommendationsPageProps {
  user: UserProfile;
  products: Product[];
  favoriteIds: string[];
  compareIds: string[];
  onToggleFavorite: (id: string) => void;
  onToggleCompare: (id: string) => void;
  onSelectProduct: (id: string) => void;
  onNavigate: (page: string) => void;
}

export const RecommendationsPage: React.FC<RecommendationsPageProps> = ({
  user,
  products: fallbackProducts,
  favoriteIds,
  compareIds,
  onToggleFavorite,
  onToggleCompare,
  onSelectProduct,
  onNavigate,
}) => {
  // Recommendation Input States
  const [selectedCountry, setSelectedCountry] = useState<string>(user.country || 'Bangladesh');
  const [budgetTarget, setBudgetTarget] = useState<number>(user.budget || 3000);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeSkinTone, setActiveSkinTone] = useState<string>(user.skinTone || 'Medium');
  const [activeUndertone, setActiveUndertone] = useState<string>(user.undertone || 'Warm');

  // Recommendation Results
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [groupedRecommendations, setGroupedRecommendations] = useState<{
    bestMatches: Product[];
    slightlyAbove: Product[];
    alternatives: Product[];
  }>({
    bestMatches: [],
    slightlyAbove: [],
    alternatives: [],
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTab, setSelectedTab] = useState<'all' | 'best_match' | 'slightly_above' | 'alternative'>('all');

  // Available countries
  const countries = ['Bangladesh', 'United States', 'United Kingdom', 'Canada', 'Australia', 'India'];

  // Categories list
  const [categories, setCategories] = useState<string[]>([
    'All',
    'Foundation',
    'Concealer',
    'Compact Powder',
    'Setting Powder',
    'BB Cream',
    'CC Cream',
    'Tinted Moisturizer',
    'Primer',
    'Bronzer',
    'Highlighter',
    'Blush',
    'Lipstick',
    'Lip Gloss',
    'Mascara',
    'Eyeliner',
    'Eyeshadow',
  ]);

  useEffect(() => {
    fetchCategories()
      .then((cats) => {
        if (cats && cats.length > 0) {
          setCategories(['All', ...cats.map((c: any) => c.categoryName)]);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch deterministic recommendations from Express + MySQL / Embedded DB backend
  useEffect(() => {
    let isMounted = true;
    async function loadRecommendations() {
      setIsLoading(true);
      try {
        const result: RecommendationResult = await fetchRecommendations({
          skinTone: activeSkinTone,
          undertone: activeUndertone,
          budget: budgetTarget,
          country: selectedCountry,
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
        });

        if (isMounted) {
          setRecommendations(result.data || []);
          setGroupedRecommendations(result.groups || {
            bestMatches: [],
            slightlyAbove: [],
            alternatives: [],
          });
        }
      } catch (err) {
        console.warn('Could not fetch recommendations from backend, utilizing cached algorithm data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadRecommendations();
    return () => {
      isMounted = false;
    };
  }, [activeSkinTone, activeUndertone, budgetTarget, selectedCountry, selectedCategory]);

  // Active products to display based on the selected budget filter tab
  const rawDisplayedProducts = selectedTab === 'all'
    ? recommendations
    : selectedTab === 'best_match'
    ? groupedRecommendations.bestMatches
    : selectedTab === 'slightly_above'
    ? groupedRecommendations.slightlyAbove
    : groupedRecommendations.alternatives;

  const displayedProducts = useMemo(() => {
    return deduplicateAndGroupProducts(rawDisplayedProducts, activeSkinTone, activeUndertone);
  }, [rawDisplayedProducts, activeSkinTone, activeUndertone]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Top Hero: Persona & Active Skin Profile Header */}
      <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg border border-stone-800 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Deterministic Complexion Engine</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif-display font-bold text-white">
              Your Personalized Makeup Recommendations
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Scored via our category-specific recommendation engine evaluating complexion depth, undertone harmony, color matching for lips and blush, budget fit, and local availability.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('analyze-selfie')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors border border-stone-700 cursor-pointer shadow-xs"
            >
              <Camera className="w-3.5 h-3.5 text-amber-300" />
              <span>Re-Analyze Skin</span>
            </button>
          </div>
        </div>

        {/* REQUIRED: User Skin Profile Display Card */}
        <div className="bg-stone-950/70 p-5 rounded-2xl border border-stone-800 space-y-4">
          <div className="flex items-center justify-between text-xs text-stone-400 uppercase tracking-wider font-semibold border-b border-stone-800 pb-2">
            <span>Your Active Skin Profile & Preferences</span>
            <span className="text-[11px] text-stone-500 font-normal">Adjust any field below to recalculate recommendations</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Skin Tone */}
            <div className="p-3 bg-stone-900 rounded-xl border border-stone-800 space-y-1">
              <label className="text-[11px] uppercase tracking-wider text-stone-400 block font-medium">
                Skin Tone
              </label>
              <select
                value={activeSkinTone}
                onChange={(e) => setActiveSkinTone(e.target.value)}
                className="w-full bg-stone-800 text-white text-sm font-semibold rounded-lg px-2.5 py-1.5 border border-stone-700 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {['Very Fair', 'Fair', 'Light', 'Medium', 'Tan', 'Deep'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* 2. Undertone */}
            <div className="p-3 bg-stone-900 rounded-xl border border-stone-800 space-y-1">
              <label className="text-[11px] uppercase tracking-wider text-stone-400 block font-medium">
                Undertone
              </label>
              <select
                value={activeUndertone}
                onChange={(e) => setActiveUndertone(e.target.value)}
                className="w-full bg-stone-800 text-white text-sm font-semibold rounded-lg px-2.5 py-1.5 border border-stone-700 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {['Warm', 'Cool', 'Neutral', 'Olive'].map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            {/* 3. Country */}
            <div className="p-3 bg-stone-900 rounded-xl border border-stone-800 space-y-1">
              <label className="text-[11px] uppercase tracking-wider text-stone-400 block font-medium">
                Country
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full bg-stone-800 text-white text-sm font-semibold rounded-lg px-2.5 py-1.5 border border-stone-700 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* 4. Budget */}
            <div className="p-3 bg-stone-900 rounded-xl border border-stone-800 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] uppercase tracking-wider text-stone-400 block font-medium">
                  Budget Target
                </label>
                <span className="text-xs font-mono-nums font-bold text-emerald-400">
                  {user.currency}{budgetTarget.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="800"
                max="6000"
                step="100"
                value={budgetTarget}
                onChange={(e) => setBudgetTarget(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer mt-2"
              />
            </div>

          </div>
        </div>

      </div>

      {/* Category Preference Navigation Filter */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-stone-800" />
            <span>Select Makeup Category:</span>
          </div>
          <span className="text-xs text-stone-500 font-mono-nums">
            Showing {recommendations.length} formulas in {selectedCountry}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                selectedCategory === cat
                  ? 'bg-stone-950 text-white shadow-sm'
                  : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Budget Tiers: Best Matches, Slightly Above Budget, Similar Alternatives */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div className="space-y-0.5">
            <h2 className="text-sm font-semibold text-stone-900">
              Budget Alignment & Compatibility Tiers
            </h2>
            <p className="text-xs text-stone-500">
              Deterministic partitioning based on your ৳{budgetTarget.toLocaleString()} target.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl">
            <button
              onClick={() => setSelectedTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedTab === 'all'
                  ? 'bg-white text-stone-950 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-950'
              }`}
            >
              All Ranked ({recommendations.length})
            </button>
            <button
              onClick={() => setSelectedTab('best_match')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                selectedTab === 'best_match'
                  ? 'bg-white text-stone-950 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-950'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Best Matches ({groupedRecommendations.bestMatches.length})</span>
            </button>
            <button
              onClick={() => setSelectedTab('slightly_above')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                selectedTab === 'slightly_above'
                  ? 'bg-white text-stone-950 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-950'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              <span>Slightly Above ({groupedRecommendations.slightlyAbove.length})</span>
            </button>
            <button
              onClick={() => setSelectedTab('alternative')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedTab === 'alternative'
                  ? 'bg-white text-stone-950 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-950'
              }`}
            >
              Alternatives ({groupedRecommendations.alternatives.length})
            </button>
          </div>
        </div>

        {/* Explanatory Tier Guidance */}
        <div className="text-xs text-stone-600 flex items-center gap-2">
          <Info className="w-4 h-4 text-stone-400 shrink-0" />
          <span>
            {selectedTab === 'all' && 'Displaying all formulas ranked by deterministic score (max 100), country availability, and lowest price.'}
            {selectedTab === 'best_match' && `Displaying formulas precisely within your ৳${budgetTarget.toLocaleString()} budget with optimal skin tone matching.`}
            {selectedTab === 'slightly_above' && `Formulas up to 25% above your budget (up to ৳${Math.round(budgetTarget * 1.25).toLocaleString()}) that offer high-performing shade fidelity.`}
            {selectedTab === 'alternative' && 'Premium formulas or alternative shade depth options offering compatible complexion balance.'}
          </span>
        </div>
      </div>

      {/* Products Grid */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="bg-white rounded-3xl border border-stone-200 p-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-stone-500 mx-auto" />
            <p className="text-sm font-semibold text-stone-900">Calculating Deterministic Recommendations...</p>
            <p className="text-xs text-stone-500">Querying MySQL catalog and evaluating 100-point algorithm criteria.</p>
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-4">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="text-lg font-serif-display font-bold text-stone-900">
              No formulas matched in this tier
            </h3>
            <p className="text-xs text-stone-600 max-w-md mx-auto">
              No products found for the selected category within this budget tier. Switch to <strong>All Ranked</strong> or adjust your budget target slider above.
            </p>
            <button
              onClick={() => { setSelectedTab('all'); setBudgetTarget(4500); }}
              className="px-5 py-2.5 bg-stone-900 text-white text-xs font-semibold uppercase tracking-wider rounded-xl cursor-pointer"
            >
              Expand Budget to ৳4,500
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedProducts.map((product) => (
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
        )}
      </div>

      {/* Deterministic Algorithm Transparency Card */}
      <div className="bg-stone-50 rounded-3xl p-6 sm:p-8 border border-stone-200 space-y-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-600">
            <HelpCircle className="w-4 h-4 text-stone-800" />
            <span>Recommendation Algorithm Breakdown (100-Point Scoring System)</span>
          </div>
          <h3 className="text-xl font-serif-display font-bold text-stone-950">
            How Your Recommendations Are Ranked
          </h3>
          <p className="text-xs text-stone-600 max-w-2xl leading-relaxed">
            Every product score is strictly calculated by our deterministic scoring model. No random numbers or speculative guesses are ever used.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          <div className="p-4 bg-white rounded-2xl border border-stone-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-900">Skin Tone Match</span>
              <span className="text-xs font-mono-nums font-bold text-stone-900">40 pts</span>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Exact tone = 40 pts.<br />
              Adjacent tone = 25 pts.<br />
              Incompatible = 0 pts.
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-stone-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-900">Undertone Match</span>
              <span className="text-xs font-mono-nums font-bold text-stone-900">25 pts</span>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Exact undertone = 25 pts.<br />
              Neutral balance = 15 pts.<br />
              Mismatch = 0 pts.
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-stone-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-900">Budget Target</span>
              <span className="text-xs font-mono-nums font-bold text-stone-900">15 pts</span>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Within budget = 15 pts.<br />
              Within 25% over = 7 pts.<br />
              Far above = 0 pts.
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-stone-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-900">Country Stock</span>
              <span className="text-xs font-mono-nums font-bold text-stone-900">10 pts</span>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Available in country = 10 pts.<br />
              Not available = 0 pts.
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-stone-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-900">Category Pref.</span>
              <span className="text-xs font-mono-nums font-bold text-stone-900">10 pts</span>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Selected category = 10 pts.<br />
              General browse = 0 pts.
            </p>
          </div>

        </div>

        {/* Verification guarantee */}
        <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Deterministic Guarantee:</strong> Ranking order is sorted by highest score first, country availability second, and lowest retail price third.
          </span>
        </div>
      </div>

    </div>
  );
};
