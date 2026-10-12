import React, { useState, useEffect, useRef } from 'react';
import { Heart, Scale, ExternalLink, CheckCircle2, XCircle, Check, Palette, X, ChevronDown } from 'lucide-react';
import { Product, ProductVariant } from '../types';
import { ProductImage } from './ProductImage';
import { getSwatchHex } from '../utils/productUtils';

interface ProductCardProps {
  product: Product;
  isFavorite: boolean;
  isInCompare: boolean;
  onToggleFavorite: (productId: string) => void;
  onToggleCompare: (productId: string) => void;
  onSelectProduct: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isFavorite,
  isInCompare,
  onToggleFavorite,
  onToggleCompare,
  onSelectProduct,
}) => {
  // Variants and active shade state
  const variants: ProductVariant[] = product.variants && product.variants.length > 0
    ? product.variants
    : [
        {
          variantId: Number(product.id?.replace('prod_', '') || product.productId || 1),
          productId: Number(product.id?.replace('prod_', '') || product.productId || 1),
          shadeName: product.shade || product.shadeName || 'Default Shade',
          skinTone: product.skinTone || 'Medium',
          undertone: product.undertone || 'Warm',
          swatchHex: product.shadeHex || getSwatchHex(product.skinTone, product.undertone),
          imageUrl: product.imageUrl || product.image,
          purchaseLink: product.purchaseLink || product.sourceUrl || product.officialUrl || '#',
          isVerified: product.isVerified ?? true,
          isActive: true,
        },
      ];

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(variants[0]);
  const [isShadeMenuOpen, setIsShadeMenuOpen] = useState(false);
  const shadeMenuRef = useRef<HTMLDivElement>(null);

  // Sync when product changes
  useEffect(() => {
    if (variants.length > 0) {
      setSelectedVariant(variants[0]);
    }
  }, [product.id]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (shadeMenuRef.current && !shadeMenuRef.current.contains(event.target as Node)) {
        setIsShadeMenuOpen(false);
      }
    }
    if (isShadeMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isShadeMenuOpen]);

  const activeShadeName = selectedVariant?.shadeName || product.shade || product.shadeName || 'Natural Shade';
  const activeSkinTone = selectedVariant?.skinTone || product.skinTone || 'Medium';
  const activeUndertone = selectedVariant?.undertone || product.undertone || 'Warm';
  const activeShadeHex = selectedVariant?.swatchHex || product.shadeHex || getSwatchHex(activeSkinTone, activeUndertone, activeShadeName);
  const activeImage = selectedVariant?.imageUrl || product.imageUrl || product.image;
  const activePurchaseLink = selectedVariant?.purchaseLink || product.purchaseLink || product.sourceUrl || product.officialUrl;

  const isAvailable = product.isAvailableInCountry ?? (product.availability?.includes('Available in') || product.availability === 'In Stock');
  const countryName = product.country || 'Bangladesh';
  const displayAvailability = isAvailable
    ? `Available in ${countryName}`
    : `Not currently available in ${countryName}`;

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Direct link to the retailer / origin page where the product is coming from
    if (activePurchaseLink && (activePurchaseLink.startsWith('http://') || activePurchaseLink.startsWith('https://'))) {
      window.open(activePurchaseLink, '_blank', 'noopener,noreferrer');
    } else {
      onSelectProduct(product.id);
    }
  };

  const handleSelectShade = (v: ProductVariant, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedVariant(v);
    setIsShadeMenuOpen(false);
  };

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl border border-stone-200/90 overflow-visible shadow-xs hover:shadow-md transition-all duration-300">
      
      {/* Product Image Area with Match Score and Quick Compare */}
      <div className="relative aspect-[4/3] bg-stone-100 rounded-t-2xl overflow-hidden">
        <ProductImage
          src={activeImage}
          alt={`${product.name} - ${activeShadeName}`}
          category={product.category}
          shadeHex={activeShadeHex}
          shadeName={activeShadeName}
          isVerified={product.isVerified ?? Boolean(activeImage && (activePurchaseLink || product.barcode))}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />

        {/* Match Percentage Callout */}
        <div className="absolute top-3 left-3 bg-stone-900/95 text-white backdrop-blur-md px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide flex items-center gap-1 shadow-sm pointer-events-none">
          <span className="font-mono-nums text-emerald-400 font-bold">{product.matchPercentage || product.matchScore || 90}%</span>
          <span className="text-[11px] text-stone-300">Match</span>
        </div>

        {/* Compare shortcut in top corner */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare(product.id);
            }}
            title={isInCompare ? 'Remove from Compare' : 'Add to Compare'}
            className={`p-2 rounded-full backdrop-blur-md transition-all cursor-pointer ${
              isInCompare
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-white/90 text-stone-700 hover:bg-white hover:text-stone-950 shadow-xs'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Current Active Shade Badge */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] text-stone-800 shadow-xs border border-stone-200/60 pointer-events-none z-10">
          <span
            className="w-3 h-3 rounded-full border border-black/15 shrink-0"
            style={{ backgroundColor: activeShadeHex }}
            aria-hidden="true"
          />
          <span className="truncate max-w-[140px] font-medium">{activeShadeName}</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Metadata line: Brand · Category */}
          <div className="flex items-center gap-2 text-xs text-stone-500 uppercase tracking-wider mb-1.5 font-medium">
            <span>{product.brand}</span>
            <span aria-hidden="true">·</span>
            <span>{product.category}</span>
          </div>

          {/* Product Title */}
          <h3
            onClick={handleDetailsClick}
            className="text-sm font-semibold text-stone-900 hover:text-stone-600 transition-colors line-clamp-2 cursor-pointer leading-snug"
            title={`${product.name} (Click to visit official product page)`}
          >
            {product.name}
          </h3>

          {/* Tone & Undertone specifications */}
          <div className="flex items-center gap-2 text-xs text-stone-600 mt-2">
            <span>Tone: <strong className="font-semibold text-stone-800">{activeSkinTone}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Undertone: <strong className="font-semibold text-stone-800">{activeUndertone}</strong></span>
          </div>

          {/* Recommendation Reason snippet */}
          {product.reason && (
            <p className="text-[11px] text-stone-500 mt-2 line-clamp-2 bg-stone-50 p-2 rounded-lg border border-stone-100 leading-relaxed">
              {product.reason}
            </p>
          )}
        </div>

        {/* Footer Area: Price, Availability, Shade Selector Round, Favorite Icon & Details CTA */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2 relative">
          <div>
            <div className="text-base font-semibold text-stone-950 font-mono-nums">
              {product.currency}{(product.price || 0).toLocaleString()}
            </div>
            
            <div className={`text-[11px] font-medium flex items-center gap-1 mt-0.5 ${
              isAvailable ? 'text-emerald-700' : 'text-amber-800'
            }`}>
              {isAvailable ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-3 h-3 text-amber-600 shrink-0" />
              )}
              <span className="truncate max-w-[110px] sm:max-w-[130px]">{displayAvailability}</span>
            </div>
          </div>

          {/* Action Row: Round Shade Swatch Selector, Favorite Icon, Details Button */}
          <div className="flex items-center gap-1.5 shrink-0" ref={shadeMenuRef}>
            
            {/* ROUND SHADE SELECTOR BUTTON */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsShadeMenuOpen(!isShadeMenuOpen);
                }}
                title={
                  variants.length > 1
                    ? `Click to view all ${variants.length} available shades`
                    : `Active shade: ${activeShadeName}`
                }
                className="relative p-1 rounded-full hover:bg-stone-100 transition-all cursor-pointer flex items-center justify-center border border-stone-200 hover:border-stone-400 group/swatch"
              >
                {/* Outer Color Circle */}
                <span
                  className="w-6 h-6 rounded-full border border-black/20 shadow-xs block transition-transform group-hover/swatch:scale-105"
                  style={{ backgroundColor: activeShadeHex }}
                />
                
                {/* Multiple shades indicator badge */}
                {variants.length > 1 && (
                  <span className="absolute -top-1 -right-1 bg-stone-900 text-white text-[9px] font-bold px-1 rounded-full shadow-xs leading-none py-0.5 border border-white">
                    {variants.length}
                  </span>
                )}
              </button>

              {/* INTERACTIVE ROUND SHADE POPUP */}
              {isShadeMenuOpen && (
                <div
                  className="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-2xl border border-stone-200 shadow-xl p-3 z-50 animate-fadeIn"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100">
                    <div className="flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-stone-700" />
                      <span className="text-xs font-bold text-stone-900">
                        Select Shade ({variants.length})
                      </span>
                    </div>
                    <button
                      onClick={() => setIsShadeMenuOpen(false)}
                      className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {variants.map((v) => {
                      const isSelected = selectedVariant?.shadeName === v.shadeName;
                      const swatch = v.swatchHex || getSwatchHex(v.skinTone, v.undertone, v.shadeName);

                      return (
                        <button
                          key={`${v.variantId || v.productId}-${v.shadeName}`}
                          type="button"
                          onClick={(e) => handleSelectShade(v, e)}
                          className={`w-full text-left p-1.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-stone-900 text-white font-medium'
                              : 'hover:bg-stone-100 text-stone-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-4 h-4 rounded-full border border-black/20 shrink-0 shadow-2xs"
                              style={{ backgroundColor: swatch }}
                            />
                            <div className="truncate">
                              <div className="font-semibold truncate text-[11px] leading-tight">
                                {v.shadeName}
                              </div>
                              <div className={`text-[10px] ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                                {v.skinTone} · {v.undertone}
                              </div>
                            </div>
                          </div>

                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ADD TO FAVORITES ICON (Right next to details) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(product.id);
              }}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                isFavorite
                  ? 'bg-rose-50 text-rose-600 border border-rose-200 shadow-2xs hover:bg-rose-100'
                  : 'text-stone-400 hover:text-rose-600 hover:bg-rose-50/60 border border-stone-200 bg-white'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current text-rose-600' : ''}`} />
            </button>

            {/* DETAILS BUTTON (Opens product link where it's coming from) */}
            <button
              type="button"
              onClick={handleDetailsClick}
              title={
                activePurchaseLink && (activePurchaseLink.startsWith('http://') || activePurchaseLink.startsWith('https://'))
                  ? 'Visit official retailer/brand page'
                  : 'View product details'
              }
              className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-stone-950 hover:bg-stone-800 transition-colors cursor-pointer py-1.5 px-3 rounded-xl shadow-xs shrink-0"
            >
              <span>Details</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
