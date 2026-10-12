import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, SlidersHorizontal, RotateCcw, ArrowUpDown, RefreshCw, CheckCircle2, Globe, Tag } from 'lucide-react';
import { Product, ProductCategory } from '../types';
import { ProductCard } from '../components/ProductCard';
import { fetchProducts, fetchCategories, fetchBrands } from '../services/api';
import { deduplicateAndGroupProducts } from '../utils/productUtils';

interface ProductsPageProps {
  products: Product[];
  favoriteIds: string[];
  compareIds: string[];
  onToggleFavorite: (id: string) => void;
  onToggleCompare: (id: string) => void;
  onSelectProduct: (id: string) => void;
  initialCategory?: ProductCategory | 'All';
  initialBrand?: string | 'All';
}

export const ProductsPage: React.FC<ProductsPageProps> = ({
  products: initialProducts,
  favoriteIds,
  compareIds,
  onToggleFavorite,
  onToggleCompare,
  onSelectProduct,
  initialCategory = 'All',
  initialBrand = 'All',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedBrand, setSelectedBrand] = useState<string>(initialBrand);
  const [selectedTone, setSelectedTone] = useState<string>('All');
  const [selectedUndertone, setSelectedUndertone] = useState<string>('All');
  const [selectedCountry, setSelectedCountry] = useState<string>('Bangladesh');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('All');
  const [maxPrice, setMaxPrice] = useState<number>(6000);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'best_match' | 'lowest_price' | 'highest_price' | 'newest'>('best_match');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [page, setPage] = useState<number>(1);
  const PAGE_SIZE = 24;

  // Live products loaded from backend Express API + MySQL
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(() => deduplicateAndGroupProducts(initialProducts));
  const [categoriesList, setCategoriesList] = useState<string[]>(['All', 'Foundation', 'Concealer', 'Compact Powder', 'Setting Powder', 'BB Cream', 'Primer', 'Bronzer', 'Highlighter']);
  const [brandsList, setBrandsList] = useState<string[]>(['All']);
  const [isLoading, setIsLoading] = useState(false);

  const totalPages = Math.ceil(catalogProducts.length / PAGE_SIZE) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return catalogProducts.slice(start, start + PAGE_SIZE);
  }, [catalogProducts, page]);

  const tones = ['All', 'Very Fair', 'Fair', 'Light', 'Medium', 'Tan', 'Deep'];
  const undertones = ['All', 'Warm', 'Cool', 'Neutral', 'Olive'];
  const countries = ['All', 'Bangladesh', 'United States', 'United Kingdom', 'Canada', 'Australia', 'India'];

  // Load brands and categories from backend
  useEffect(() => {
    async function loadMeta() {
      try {
        const [cats, brs] = await Promise.all([
          fetchCategories().catch(() => []),
          fetchBrands().catch(() => []),
        ]);
        if (cats.length > 0) {
          setCategoriesList(['All', ...cats.map((c: any) => c.categoryName)]);
        }
        if (brs.length > 0) {
          setBrandsList(['All', ...brs.map((b: any) => b.brandName)]);
        }
      } catch (err) {
        console.warn('Failed to load filter metadata:', err);
      }
    }
    loadMeta();
  }, []);

  // Fetch filtered products directly from backend
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await fetchProducts({
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          brand: selectedBrand !== 'All' ? selectedBrand : undefined,
          country: selectedCountry,
          skinTone: selectedTone !== 'All' ? selectedTone : undefined,
          undertone: selectedUndertone !== 'All' ? selectedUndertone : undefined,
          maxPrice: maxPrice < 10000 ? maxPrice : undefined,
          minPrice: minPrice > 0 ? minPrice : undefined,
          availability: availabilityFilter === 'Available' ? '1' : availabilityFilter === 'Unavailable' ? '0' : undefined,
          search: searchQuery.trim() || undefined,
          sort: sortBy,
        });

        if (active) {
          setCatalogProducts(deduplicateAndGroupProducts(data, selectedTone, selectedUndertone));
        }
      } catch (err) {
        console.warn('Backend product fetch error, fallback to initial:', err);
      } finally {
        if (active) setIsLoading(false);
      }
    }, 150);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    searchQuery,
    selectedCategory,
    selectedBrand,
    selectedTone,
    selectedUndertone,
    selectedCountry,
    availabilityFilter,
    maxPrice,
    minPrice,
    sortBy,
  ]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedBrand('All');
    setSelectedTone('All');
    setSelectedUndertone('All');
    setSelectedCountry('Bangladesh');
    setAvailabilityFilter('All');
    setMaxPrice(10000);
    setMinPrice(0);
    setSortBy('best_match');
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md mb-2 border border-amber-200">
            <Tag className="w-3 h-3 text-amber-600" />
            <span>MySQL Catalog Query Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif-display font-bold text-stone-950">
            Verified Makeup Catalog
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Real-time backend filtering by category, brand, budget, tone, undertone, and verified country availability.
          </p>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sort by:</span>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs font-medium text-stone-800 bg-white border border-stone-300 rounded-lg px-3 py-2 cursor-pointer focus:outline-none focus:ring-1 focus:ring-stone-900"
          >
            <option value="best_match">Best Match</option>
            <option value="lowest_price">Price: Low to High</option>
            <option value="highest_price">Price: High to Low</option>
            <option value="newest">Recently Added</option>
          </select>

          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-800 bg-white border border-stone-300 rounded-lg"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Sidebar: Detailed Filters */}
        <div
          className={`lg:col-span-3 space-y-6 ${
            mobileFilterOpen ? 'block' : 'hidden lg:block'
          } bg-white lg:bg-transparent p-5 lg:p-0 rounded-2xl lg:rounded-none border lg:border-none border-stone-200`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-900 flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </h3>
            <button
              onClick={handleResetFilters}
              className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Search filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-700">Search Products</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Product name, brand, shade..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-white border border-stone-300 rounded-lg pl-8 pr-3 py-2 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Country Availability Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-700">Country Market</label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full text-xs bg-white border border-stone-300 rounded-lg px-3 py-2 text-stone-900 cursor-pointer"
            >
              {countries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Availability Status Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-700">Stock Availability</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'All', label: 'All' },
                { id: 'Available', label: 'Available' },
                { id: 'Unavailable', label: 'Out of Stock' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAvailabilityFilter(opt.id)}
                  className={`text-[11px] font-medium py-1.5 px-2 rounded-lg border transition-colors cursor-pointer ${
                    availabilityFilter === opt.id
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-700">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs bg-white border border-stone-300 rounded-lg px-3 py-2 text-stone-900 cursor-pointer"
            >
              {categoriesList.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Brand Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-700">Brand</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full text-xs bg-white border border-stone-300 rounded-lg px-3 py-2 text-stone-900 cursor-pointer"
            >
              {brandsList.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Skin Tone Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-700">Skin Tone</label>
            <div className="grid grid-cols-3 gap-1.5">
              {tones.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTone(t)}
                  className={`text-[11px] font-medium py-1.5 px-2 rounded-lg border transition-colors cursor-pointer ${
                    selectedTone === t
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Undertone Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-700">Undertone</label>
            <div className="grid grid-cols-2 gap-1.5">
              {undertones.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setSelectedUndertone(u)}
                  className={`text-[11px] font-medium py-1.5 px-2 rounded-lg border transition-colors cursor-pointer ${
                    selectedUndertone === u
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Slider */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs text-stone-700">
              <span className="font-semibold">Max Price Target</span>
              <span className="font-mono-nums font-bold text-stone-900">৳{maxPrice.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="800"
              max="6000"
              step="100"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-stone-900 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-stone-400 font-mono-nums">
              <span>৳800</span>
              <span>৳6,000+</span>
            </div>
          </div>

        </div>

        {/* Right Main Grid */}
        <div className="lg:col-span-9 space-y-6">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>
              Showing <strong className="text-stone-900 font-semibold font-mono-nums">{catalogProducts.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0} - {Math.min(page * PAGE_SIZE, catalogProducts.length)}</strong> of <strong className="text-stone-900 font-semibold font-mono-nums">{catalogProducts.length.toLocaleString()}</strong> verified products
            </span>
            {isLoading && (
              <span className="text-amber-700 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Syncing with MySQL...</span>
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-stone-400 mx-auto" />
              <p className="text-sm font-semibold text-stone-800">Fetching filtered products...</p>
            </div>
          ) : catalogProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
              <p className="text-base font-semibold text-stone-900">No products match your current filters</p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Try widening your price range, choosing another market, or resetting tone/undertone restrictions.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-stone-900 rounded-lg hover:bg-stone-800 cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedProducts.map((product) => (
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

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-stone-200">
                  <div className="text-xs text-stone-500">
                    Page <strong className="text-stone-900">{page}</strong> of <strong className="text-stone-900">{totalPages}</strong>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setPage((p) => Math.max(1, p - 1));
                        window.scrollTo({ top: 200, behavior: 'smooth' });
                      }}
                      disabled={page === 1}
                      className="px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white border border-stone-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 cursor-pointer"
                    >
                      ← Previous
                    </button>

                    {/* Page numbers snippet */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pNum = i + 1;
                      if (totalPages > 5 && page > 3) {
                        pNum = Math.min(page - 2 + i, totalPages - (4 - i));
                      }
                      return (
                        <button
                          key={pNum}
                          onClick={() => {
                            setPage(pNum);
                            window.scrollTo({ top: 200, behavior: 'smooth' });
                          }}
                          className={`w-8 h-8 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
                            page === pNum
                              ? 'bg-stone-900 text-white shadow-xs'
                              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                          }`}
                        >
                          {pNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => {
                        setPage((p) => Math.min(totalPages, p + 1));
                        window.scrollTo({ top: 200, behavior: 'smooth' });
                      }}
                      disabled={page === totalPages}
                      className="px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white border border-stone-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 cursor-pointer"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
};
