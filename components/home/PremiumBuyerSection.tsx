'use client';

import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PremiumBuyerCard from './PremiumBuyerCard';
import type { DBPremiumBuyer } from '@/lib/types';

interface PremiumBuyerSectionProps {
  buyers: DBPremiumBuyer[];
}

export default function PremiumBuyerSection({ buyers }: PremiumBuyerSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollIdx, setScrollIdx] = useState(0);

  if (buyers.length === 0) return null;

  const scrollTo = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const cardWidth = 240; // card + gap
    const newScroll = dir === 'left' ? container.scrollLeft - cardWidth : container.scrollLeft + cardWidth;
    container.scrollTo({ left: newScroll, behavior: 'smooth' });
    const newIdx = Math.round(newScroll / cardWidth);
    setScrollIdx(Math.max(0, Math.min(buyers.length - 1, newIdx)));
  };

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-baseline gap-2">
          <h2 className="section-title mb-0">프리미엄 업체</h2>
          <span className="badge bg-zinc-100 text-zinc-400">AD</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => scrollTo('left')} disabled={scrollIdx === 0}
            className="w-7 h-7 flex items-center justify-center rounded border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-30 transition-colors">
            <ChevronLeft size={14} />
          </button>
          <button onClick={() => scrollTo('right')} disabled={scrollIdx >= buyers.length - 1}
            className="w-7 h-7 flex items-center justify-center rounded border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-30 transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* 가로 스크롤 캐러셀 */}
      <div ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory"
        onScroll={(e) => {
          const idx = Math.round(e.currentTarget.scrollLeft / 240);
          setScrollIdx(idx);
        }}>
        {buyers.map((buyer) => (
          <div key={buyer.id} className="shrink-0 w-[220px] snap-start">
            <PremiumBuyerCard {...buyer} />
          </div>
        ))}
      </div>

      {/* 진행 인디케이터 */}
      {buyers.length > 1 && (
        <div className="flex items-center justify-center gap-1 mt-1">
          {buyers.map((_, i) => (
            <div key={i}
              className={`h-1 rounded-full transition-all ${i === scrollIdx ? 'bg-zinc-900 w-4' : 'bg-zinc-300 w-1'}`} />
          ))}
        </div>
      )}
    </section>
  );
}
