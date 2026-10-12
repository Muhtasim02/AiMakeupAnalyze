import React from 'react';
import { Scale, X, ArrowRight } from 'lucide-react';
import { Product } from '../types';
import { ProductImage } from './ProductImage';

interface CompareTrayProps {
  products: Product[];
  compareIds: string[];
  onRemoveFromCompare: (id: string) => void;
  onClearCompare: () => void;
  onOpenCompare: () => void;
}

export const CompareTray: React.FC<CompareTrayProps> = ({
  products,
  compareIds,
  onRemoveFromCompare,
  onClearCompare,
  onOpenCompare,
}) => {
  if (compareIds.length === 0) return null;

  const compareProducts = products.filter((p) => compareIds.includes(p.id));

  return (
    <aside aria-label="Compare Tray" className="fixed bottom-4 right-4 z-50 max-w-lg w-full px-4 sm:px-0">
      <div className="bg-stone-900 text-white rounded-xl shadow-2xl p-3 border border-stone-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center gap-1.5 shrink-0 pl-1">
            <Scale className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-300">
              Compare ({compareProducts.length}/3)
            </span>
          </div>

          {/* Product Thumbnails */}
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {compareProducts.map((p) => (
              <div
                key={p.id}
                className="relative group shrink-0 w-8 h-8 rounded-md overflow-hidden border border-stone-700 bg-stone-800"
              >
                <ProductImage
                  src={p.image || p.imageUrl}
                  alt={p.name}
                  shadeHex={p.shadeHex}
                  shadeName={p.shade}
                  category={p.category}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => onRemoveFromCompare(p.id)}
                  title={`Remove ${p.name}`}
                  className="absolute inset-0 bg-stone-900/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onClearCompare}
            className="text-[11px] text-stone-400 hover:text-stone-200 transition-colors px-2 py-1"
          >
            Clear
          </button>
          <button
            onClick={onOpenCompare}
            className="inline-flex items-center gap-1 bg-white text-stone-950 hover:bg-stone-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <span>Compare</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
