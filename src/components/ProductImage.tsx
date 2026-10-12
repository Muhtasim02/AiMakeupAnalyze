import React, { useState, useEffect } from 'react';
import { ImageOff, ShieldCheck } from 'lucide-react';

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  containerClassName?: string;
  shadeHex?: string;
  shadeName?: string;
  category?: string;
  isVerified?: boolean;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover object-center',
  containerClassName = 'w-full h-full relative flex items-center justify-center bg-stone-100 overflow-hidden',
  shadeHex,
  shadeName,
  category,
  isVerified,
}) => {
  const [hasError, setHasError] = useState(false);

  // Reset error state if src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const cleanSrc = src ? src.trim() : '';
  const isAvailable = cleanSrc.length > 0 && !hasError;

  return (
    <div className={containerClassName}>
      {isAvailable ? (
        <img
          src={cleanSrc}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className={className}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-stone-50 to-stone-100 text-stone-400 select-none">
          {shadeHex ? (
            <div className="mb-2 relative">
              <span
                className="w-8 h-8 rounded-full border border-stone-300 block shadow-xs"
                style={{ backgroundColor: shadeHex }}
                title={shadeName || 'Shade color'}
              />
              <ImageOff className="w-3.5 h-3.5 text-stone-500 absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 border border-stone-200" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-stone-200/70 flex items-center justify-center mb-2 text-stone-400">
              <ImageOff className="w-5 h-5 stroke-[1.5]" />
            </div>
          )}
          <span className="text-[11px] font-medium text-stone-600 tracking-tight">
            Image unavailable
          </span>
          {category && (
            <span className="text-[10px] text-stone-400 mt-0.5 line-clamp-1 max-w-[120px]">
              {category}
            </span>
          )}
        </div>
      )}

      {isVerified && isAvailable && (
        <div
          title="Verified real product photo from Open Beauty Facts / manufacturer"
          className="absolute bottom-2 right-2 bg-emerald-900/85 text-emerald-200 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-medium flex items-center gap-1 border border-emerald-500/30"
        >
          <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
          <span>Real Photo</span>
        </div>
      )}
    </div>
  );
};
