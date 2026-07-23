'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Clock, X, ChevronDown } from 'lucide-react';
import { getRecentBuyers, clearRecentBuyers, RECENT_BUYERS_EVENT, type RecentBuyer } from '@/lib/recentBuyers';

/**
 * 사이드바 — 최근 본 업체
 * (추천 업체 블록은 지역별 판매/매입찾기 상단에 뜨지 않도록 제거함)
 */
export default function HomeAside() {
  const [recent, setRecent] = useState<RecentBuyer[]>([]);

  useEffect(() => {
    const refresh = () => setRecent(getRecentBuyers());
    refresh();
    window.addEventListener(RECENT_BUYERS_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(RECENT_BUYERS_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  return (
    // 스크롤 내려도 헤더(약 142px) 바로 아래에 고정 — 데스크탑만
    <aside className="lg:sticky lg:top-37.5 self-start space-y-3.5">
      {/* (추천 업체 블록 제거 — 지역별 판매/매입찾기 상단에 뜨지 않게) */}

      {/* 최근 본 업체 — 컴팩트 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-gray-500" />
            <span className="text-[11.5px] font-bold text-gray-800">최근 본 업체</span>
          </div>
          {recent.length > 0 && (
            <button onClick={clearRecentBuyers} aria-label="비우기" className="text-gray-400 hover:text-rose-500">
              <X size={11} />
            </button>
          )}
        </div>
        {recent.length === 0 ? (
          <p className="px-3 py-3 text-[10.5px] text-gray-400 leading-relaxed">업체 카드 클릭 시 기록</p>
        ) : (
          <RecentCarousel items={recent.slice(0, 5)} />
        )}
      </div>
    </aside>
  );
}

/** 최근 본 업체 — 처음엔 1개만, 아래로 펼치면 나머지도 표시(다시 누르면 접힘) */
function RecentCarousel({ items }: { items: RecentBuyer[] }) {
  const [open, setOpen] = useState(false);
  const shown = open ? items : items.slice(0, 1);
  if (!items.length) return null;
  return (
    <div>
      <ul>
        {shown.map((b) => (
          <li key={b.id} className="border-b border-gray-50 last:border-b-0">
            <Link href={`/board/${b.id}`} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors">
              <span className="w-6 h-6 rounded bg-gray-100 shrink-0" />
              <span className="text-[11.5px] text-gray-700 truncate flex-1">{b.name}</span>
              {b.region && <span className="text-[10px] text-gray-400 shrink-0">{b.region}</span>}
            </Link>
          </li>
        ))}
      </ul>
      {items.length > 1 && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-center gap-1 py-1.5 text-[10.5px] text-gray-400 hover:text-accent border-t border-gray-50 transition-colors"
        >
          {open ? '접기' : `더보기 (${items.length - 1})`}
          <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      )}
    </div>
  );
}
