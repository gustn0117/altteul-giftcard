'use client';

import { useState, useEffect } from 'react';
import type { Ad, AdSlot } from '@/lib/ads';
import { AD_SLOT_LABELS, AD_SLOT_SIZES } from '@/lib/ads';

interface AdBannerProps {
  slot: AdSlot;
  className?: string;
  fallback?: React.ReactNode;
}

function EmptySlot({ slot, className }: { slot: AdSlot; className: string }) {
  return (
    <div className={`relative overflow-hidden rounded-lg border border-dashed border-zinc-300 bg-zinc-50 ${className}`}
      style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 10px, rgba(0,0,0,0.03) 10px, rgba(0,0,0,0.03) 20px)' }}>
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-[11px] font-medium text-zinc-400">{AD_SLOT_LABELS[slot]}</p>
          <p className="text-[10px] text-zinc-300">{AD_SLOT_SIZES[slot]}</p>
        </div>
      </div>
    </div>
  );
}

export default function AdBanner({ slot, className = '', fallback }: AdBannerProps) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/ads?slot=${slot}&active=true`)
      .then(r => r.json())
      .then((ads: Ad[]) => { if (ads.length > 0) setAd(ads[0]); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [slot]);

  if (!loaded) return null;
  if (!ad) return fallback ? <>{fallback}</> : <EmptySlot slot={slot} className={className} />;

  const content = (
    <div className={`relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 group cursor-pointer ${className}`}>
      {ad.image_url ? (
        <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
      ) : (
        <div className="flex items-center justify-center h-full p-4">
          <div className="text-center">
            {ad.title && <p className="text-[13px] font-semibold text-zinc-700 mb-1">{ad.title}</p>}
            {ad.description && <p className="text-[11px] text-zinc-500">{ad.description}</p>}
          </div>
        </div>
      )}
      <span className="absolute top-1.5 right-1.5 badge bg-zinc-900/60 text-white text-[9px] px-1.5">AD</span>
    </div>
  );

  if (ad.link_url) {
    return (
      <a href={ad.link_url} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return content;
}
