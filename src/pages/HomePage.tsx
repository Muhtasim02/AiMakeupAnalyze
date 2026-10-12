import React from 'react';
import { Camera, Sparkles, ArrowRight, CheckCircle2, ShieldCheck, Globe, Sliders } from 'lucide-react';
import { Product, ProductCategory } from '../types';
import { ProductCard } from '../components/ProductCard';
import { heroImg, mockBrands } from '../data/mockData';
import { deduplicateAndGroupProducts } from '../utils/productUtils';

interface HomePageProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
  featuredProducts: Product[];
  favoriteIds: string[];
  compareIds: string[];
  onToggleFavorite: (id: string) => void;
  onToggleCompare: (id: string) => void;
  onSelectProduct: (id: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  featuredProducts,
  favoriteIds,
  compareIds,
  onToggleFavorite,
  onToggleCompare,
  onSelectProduct,
}) => {
  const categories: { name: ProductCategory; desc: string; count: string }[] = [
    { name: 'Foundation', desc: 'Liquid & matte longwear matching your exact depth', count: '330+ shades' },
    { name: 'Concealer', desc: 'Brightening & color-correcting botanical formulas', count: '140+ shades' },
    { name: 'Setting Powder', desc: 'Velvet oil-control finishes without flashback', count: '40+ formulas' },
    { name: 'Compact Powder', desc: 'Pressed powder foundations for velvety touch-ups', count: '70+ shades' },
    { name: 'Blush', desc: 'Healthy mineral & liquid flushed cheek radiance', count: '50+ shades' },
    { name: 'BB Cream', desc: 'Breathable, skincare-infused day tint with SPF', count: '24+ formulas' },
    { name: 'Bronzer', desc: 'Sun-kissed warmth sculpted for olive & warm tones', count: '20+ shades' },
    { name: 'Highlighter', desc: 'Luminous skin-enhancing daylight pigments', count: '20+ shades' },
  ];

  return (
    <div className="space-y-24">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-12 lg:pt-16 lg:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-700 bg-stone-100 px-3 py-1.5 rounded-md border border-stone-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>AI-Powered Shade & Undertone Intelligence</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif-display font-bold text-stone-950 tracking-tight leading-[1.08] text-balance">
                Find Makeup That Matches You
              </h1>

              <p className="text-lg text-stone-600 max-w-xl leading-relaxed">
                AI-powered makeup recommendations based on your skin tone, undertone, budget, and location.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => onNavigate('analyze-selfie')}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 text-sm font-semibold uppercase tracking-wider text-white bg-stone-950 hover:bg-stone-800 rounded-xl transition-all cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Camera className="w-4 h-4" />
                  <span>Analyze My Skin</span>
                </button>

                <button
                  onClick={() => onNavigate('products')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-stone-800 bg-white hover:bg-stone-50 border border-stone-300 rounded-xl transition-all cursor-pointer shadow-xs hover:border-stone-400"
                >
                  <span>Explore Products</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Verification & Regional Trust Proof */}
              <div className="pt-6 border-t border-stone-200 grid grid-cols-3 gap-6 text-xs text-stone-500">
                <div>
                  <div className="font-semibold text-stone-900 font-mono-nums text-sm">98.4%</div>
                  <div>Shade Match Precision</div>
                </div>
                <div>
                  <div className="font-semibold text-stone-900 font-mono-nums text-sm">৳ BDT & USD</div>
                  <div>Localized Pricing</div>
                </div>
                <div>
                  <div className="font-semibold text-stone-900 font-mono-nums text-sm">Bangladesh & Global</div>
                  <div>Verified Stock Availability</div>
                </div>
              </div>
            </div>

            {/* Right Hero Image Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-stone-200 bg-stone-100 aspect-[4/3] lg:aspect-auto lg:h-[480px]">
                <img
                  src={heroImg}
                  alt="AI MakeupMatch luxury cosmetic foundation swatches"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-stone-950/20 to-transparent" />
                
                {/* Floating Analysis Card overlay */}
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-white/95 backdrop-blur-md border border-stone-200 shadow-lg">
                  <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                    <span>Recent Live Scan</span>
                    <span className="font-mono-nums text-emerald-700 font-semibold">92% Match</span>
                  </div>
                  <div className="text-sm font-semibold text-stone-900">
                    Medium Warm 04 · Maybelline Fit Me 220
                  </div>
                  <div className="text-xs text-stone-600 mt-1 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#CD9B74] border border-black/10 inline-block" />
                    <span>Golden undertones detected under ambient daylight</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. How It Works Section */}
      <section className="py-8 bg-stone-100/70 border-y border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
              Three-Step Precision Process
            </h2>
            <p className="text-3xl font-serif-display font-bold text-stone-950">
              How AI MakeupMatch Works
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-stone-900 text-white flex items-center justify-center font-mono-nums font-bold text-sm">
                  01
                </div>
                <h3 className="text-lg font-semibold text-stone-900">Upload or Snap Selfie</h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Take or drag a natural daylight photo. Our computer vision pre-calibrates lighting variance and color temperature.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-stone-100 text-xs text-stone-500">
                Privacy-first: Images analyzed securely with zero clinical storage
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-stone-900 text-white flex items-center justify-center font-mono-nums font-bold text-sm">
                  02
                </div>
                <h3 className="text-lg font-semibold text-stone-900">Spectral Undertone Detection</h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Deep facial landmarking isolates cheek, jawline, and forehead melanin distribution to isolate Warm, Cool, Neutral, or Olive undertones.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-stone-100 text-xs text-stone-500">
                87%+ Confidence baseline scoring
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-stone-900 text-white flex items-center justify-center font-mono-nums font-bold text-sm">
                  03
                </div>
                <h3 className="text-lg font-semibold text-stone-900">Personalized Match Matrix</h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Compare exact shade swatches against thousands of verified formulas filtered by your local budget in ৳ BDT and stock availability.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-stone-100 text-xs text-stone-500">
                Direct buy links & side-by-side comparison
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Popular Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
              Curated Formulas
            </h2>
            <p className="text-3xl font-serif-display font-bold text-stone-950">
              Popular Categories
            </p>
          </div>
          <button
            onClick={() => onNavigate('products')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-900 hover:text-stone-600 transition-colors"
          >
            <span>View All Products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.name}
              onClick={() => onNavigate('products', { category: cat.name })}
              className="group p-6 bg-white rounded-xl border border-stone-200/80 shadow-xs hover:shadow-md hover:border-stone-400 transition-all cursor-pointer flex flex-col justify-between h-44"
            >
              <div>
                <div className="text-xs font-mono-nums text-stone-500 mb-2 font-medium">
                  {cat.count}
                </div>
                <h3 className="text-xl font-serif-display font-bold text-stone-900 group-hover:text-stone-700 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                  {cat.desc}
                </p>
              </div>
              <div className="inline-flex items-center gap-1 text-xs font-semibold text-stone-900 group-hover:translate-x-1 transition-transform">
                <span>Browse {cat.name}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Featured Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
              Top Rated Complexion Matches
            </h2>
            <p className="text-3xl font-serif-display font-bold text-stone-950">
              Featured Products
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <span>Profile baseline: <strong className="font-semibold text-stone-900">Medium Warm</strong></span>
            <span aria-hidden="true">·</span>
            <span>Target: <strong className="font-semibold text-stone-900">Bangladesh</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {deduplicateAndGroupProducts(featuredProducts).slice(0, 8).map((product) => (
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
      </section>

      {/* 5. Local & International Brands Section */}
      <section className="bg-stone-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
              Extensive Catalog Coverage
            </h2>
            <p className="text-3xl font-serif-display font-bold text-white">
              Local & International Brands
            </p>
            <p className="text-sm text-stone-400 mt-2">
              Cross-indexed with genuine distributors across Dhaka, Chittagong, and global authentic outlets.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {mockBrands.map((brand) => (
              <div
                key={brand.id}
                onClick={() => onNavigate('products', { brand: brand.name })}
                className="p-4 rounded-xl bg-stone-800/60 border border-stone-800 hover:border-stone-600 transition-all cursor-pointer text-center group"
              >
                <div className="text-xs text-stone-400 mb-1">{brand.type}</div>
                <div className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
                  {brand.name}
                </div>
                <div className="text-[11px] text-stone-500 font-mono-nums mt-1">
                  {brand.productCount} Shades Indexed
                </div>
              </div>
            ))}
          </div>

          {/* Quick CTA banner */}
          <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-stone-800 via-stone-850 to-stone-800 border border-stone-700/80 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-serif-display font-bold text-white">
                Unsure of your exact undertone?
              </h3>
              <p className="text-xs text-stone-300 mt-1 max-w-xl">
                Avoid foundation flashback and orange oxidation. Let AI MakeupMatch analyze your facial skin tone in under 3 seconds.
              </p>
            </div>
            <button
              onClick={() => onNavigate('analyze-selfie')}
              className="shrink-0 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-stone-950 bg-white hover:bg-stone-100 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              Start Free Analysis
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
