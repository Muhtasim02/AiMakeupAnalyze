import React, { useState, useEffect } from 'react';
import { Palette, X, ExternalLink, Check, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { Product, ProductVariant } from '../types';
import { fetchProductVariants } from '../services/api';

interface ShadePaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onSelectProduct?: (productId: string) => void;
}

export const ShadePaletteModal: React.FC<ShadePaletteModalProps> = ({
  isOpen,
  onClose,
  product,
  onSelectProduct,
}) => {
  const [variants, setVariants] = useState<ProductVariant[]>(product.variants || []);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (product.variants && product.variants.length > 0) {
      setVariants(product.variants);
      return;
    }

    let isMounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const prodId = product.productId || product.id?.replace('prod_', '');
        const data = await fetchProductVariants(prodId);
        if (isMounted) {
          setVariants(data || []);
        }
      } catch (err: any) {
        if (isMounted) {
          setError('Verified shade information is not available yet.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [isOpen, product]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 space-y-5 border border-stone-200 shadow-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-stone-100">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 mb-1.5">
              <Palette className="w-3 h-3 text-amber-700" />
              <span>Verified Shade Range</span>
            </div>
            <h3 className="text-base sm:text-lg font-serif-display font-bold text-stone-950 leading-snug">
              {product.name}
            </h3>
            <p className="text-xs text-stone-500">{product.brand} · {product.category}</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-800" />
              <p className="text-xs text-stone-600">Retrieving verified shade catalogue...</p>
            </div>
          ) : error || variants.length === 0 ? (
            <div className="py-10 text-center space-y-3 bg-stone-50 rounded-2xl p-6 border border-stone-200/60">
              <AlertCircle className="w-7 h-7 text-stone-400 mx-auto" />
              <p className="text-sm font-semibold text-stone-800">No Verified Shades Available</p>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                Verified shade variants are not applicable or currently unrecorded for this specific formula.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-500 font-medium">
                <span>{variants.length} Verified Variants in Catalog</span>
                <span className="text-[11px] text-stone-400">Click a shade to inspect</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {variants.map((v) => {
                  const isSelected = selectedVariantId === v.variantId;
                  return (
                    <div
                      key={v.variantId}
                      onClick={() => setSelectedVariantId(v.variantId)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                        isSelected
                          ? 'border-stone-950 bg-stone-50 shadow-xs'
                          : 'border-stone-200/80 bg-white hover:border-stone-300 hover:bg-stone-50/50'
                      }`}
                    >
                      {/* Swatch */}
                      {v.swatchHex ? (
                        <span
                          className="w-7 h-7 rounded-full border border-black/15 shadow-inner shrink-0"
                          style={{ backgroundColor: v.swatchHex }}
                          aria-hidden="true"
                        />
                      ) : (
                        <span className="w-7 h-7 rounded-full bg-stone-200 text-stone-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {v.shadeName.charAt(0)}
                        </span>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-stone-900 truncate" title={v.shadeName}>
                          {v.shadeName}
                        </div>
                        {(v.skinTone || v.undertone) && (
                          <div className="text-[11px] text-stone-500 truncate">
                            {v.skinTone ? `${v.skinTone}` : ''}
                            {v.skinTone && v.undertone ? ' · ' : ''}
                            {v.undertone ? `${v.undertone}` : ''}
                          </div>
                        )}
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 text-stone-950 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
          <div className="text-xs text-stone-500">
            {selectedVariantId ? 'Variant selected' : 'Select a variant to proceed'}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-stone-200 text-stone-600 rounded-xl text-xs font-medium hover:bg-stone-50 cursor-pointer"
            >
              Close
            </button>

            {onSelectProduct && (
              <button
                onClick={() => {
                  onClose();
                  onSelectProduct(product.id);
                }}
                className="px-4 py-2 bg-stone-950 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <span>View Full Details</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
