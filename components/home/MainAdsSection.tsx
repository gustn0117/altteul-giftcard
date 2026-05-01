'use client';

import { useEffect, useState } from 'react';
import type { Ad } from '@/lib/ads';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 광고 미등록 슬롯 placeholder
function Placeholder({ n }: { n: number }) {
  return (
    <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-zinc-50 border border-dashed border-zinc-300"
      style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 8px, rgba(0,0,0,0.03) 8px, rgba(0,0,0,0.03) 16px)' }}>
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-[11px] font-medium text-zinc-400">메인 광고 {n}</p>
          <p className="text-[10px] text-zinc-300 mt-0.5">준비 중입니다</p>
        </div>
      </div>
    </div>
  );
}

export default function MainAdsSection() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // hero_banner + main_top + main_middle 다 긁어서 섞기
    Promise.all([
      fetch('/api/ads?slot=hero_banner&active=true').then(r => r.json()).catch(() => []),
      fetch('/api/ads?slot=main_top&active=true').then(r => r.json()).catch(() => []),
      fetch('/api/ads?slot=main_middle&active=true').then(r => r.json()).catch(() => []),
    ]).then(([a1, a2, a3]) => {
      const all = [...(a1 || []), ...(a2 || []), ...(a3 || [])];
      setAds(shuffle(all));
      setLoaded(true);
    });
  }, []);

  if (!loaded) return null;

  // 광고가 2개 미만이면 placeholder로 채움 (최소 4개 보이도록)
  const minCount = 4;
  const fillers = Math.max(0, minCount - ads.length);

  return (
    <section className="mb-6">
      <div className="flex items-baseline gap-2 mb-3">
        <h2 className="section-title mb-0">메인 광고</h2>
        <span className="badge bg-zinc-100 text-zinc-400">AD</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5 md:gap-3">
        {ads.map((ad) => {
          const card = (
            <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200 hover:border-zinc-400 transition-colors">
              {ad.image_url ? (
                <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-3" style={{ background: 'linear-gradient(135deg, #1C1D3E 0%, #2A2B55 100%)' }}>
                  <div className="text-center">
                    <p className="text-white text-[13px] font-semibold">{ad.title}</p>
                    {ad.description && <p className="text-white/60 text-[10px] mt-1 line-clamp-2">{ad.description}</p>}
                  </div>
                </div>
              )}
              <span className="absolute top-1.5 right-1.5 text-[9px] text-white bg-black/50 px-1.5 py-0.5 rounded">AD</span>
            </div>
          );
          return ad.link_url ? (
            <a key={ad.id} href={ad.link_url} target="_blank" rel="noopener noreferrer">{card}</a>
          ) : (
            <div key={ad.id}>{card}</div>
          );
        })}
        {Array.from({ length: fillers }, (_, i) => (
          <Placeholder key={`filler-${i}`} n={ads.length + i + 1} />
        ))}
      </div>
    </section>
  );
}
