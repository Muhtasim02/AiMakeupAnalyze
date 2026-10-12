import React, { useState, useMemo } from 'react';
import { Heart, ArrowRight, Sparkles, Search, Trash2, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { deduplicateAndGroupProducts } from '../utils/productUtils';

interface FavoritesPageProps {
  products: Product[];
  favoriteIds: string[];
  compareIds: string[];
  onToggleFavorite: (id: string) => void;
  onToggleCompare: (id: string) => void;
  onSelectProduct: (id: string) => void;
  onNavigate: (page: string) => void;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({
  products,
  favoriteIds,
  compareIds,
  onToggleFavorite,
  onToggleCompare,
  onSelectProduct,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Deduplicate products and filter favorited items
  const deduplicatedFavorites = useMemo(() => {
    const rawFavorites = products.filter((p) =>
      favoriteIds.includes(p.id) || (p.productId && favoriteIds.includes(`prod_${p.productId}`))
    );
    return deduplicateAndGroupProducts(rawFavorites);
  }, [products, favoriteIds]);

  const filteredFavorites = useMemo(() => {
    if (!searchQuery.trim()) return deduplicatedFavorites;
    const q = searchQuery.toLowerCase();
    return deduplicatedFavorites.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.shade && p.shade.toLowerCase().includes(q))
    );
  }, [deduplicatedFavorites, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 border-b border-stone-200 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-600 mb-1.5 bg-rose-50 px-3 py-1 rounded-full border border-rose-200/80">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Saved Cosmetic Formulas</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif-display font-bold text-stone-950">
            My Favorites
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Browse and manage all your saved foundations, concealers, and makeup shades in one place.
          </p>
        </div>

        {/* Counter and quick search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {deduplicatedFavorites.length > 0 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search saved items..."
                className="pl-8 pr-3 py-2 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900 w-full sm:w-56"
              />
            </div>
          )}

          <div className="text-xs text-stone-500 font-mono-nums self-end sm:self-center">
            <strong className="text-stone-900 font-semibold">{deduplicatedFavorites.length}</strong> items saved
          </div>
        </div>
      </div>

      {deduplicatedFavorites.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 sm:p-16 text-center space-y-4 max-w-lg mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto border border-rose-100 shadow-2xs">
            <Heart className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-serif-display font-bold text-stone-950">
            No saved products yet
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
            Click the heart icon on any product card or recommendation to bookmark matching items for later.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('products')}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-stone-950 hover:bg-stone-800 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <span>Explore Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate('analyze-selfie')}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Skin Analysis</span>
            </button>
          </div>
        </div>
      ) : filteredFavorites.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
          <p className="text-sm font-semibold text-stone-800">No matching favorites found</p>
          <p className="text-xs text-stone-500">Try a different search keyword</p>
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-stone-900 font-semibold underline cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFavorites.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isFavorite={true}
              isInCompare={compareIds.includes(product.id)}
              onToggleFavorite={onToggleFavorite}
              onToggleCompare={onToggleCompare}
              onSelectProduct={onSelectProduct}
            />
          ))}
        </div>
      )}

    </div>
  );
};
