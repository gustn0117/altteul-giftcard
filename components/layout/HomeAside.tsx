'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Crown, Clock, Phone, X, ChevronRight } from 'lucide-react';
import { getRecentBuyers, clearRecentBuyers, RECENT_BUYERS_EVENT, addRecentBuyer, type RecentBuyer } from '@/lib/recentBuyers';
import { getAdPosts } from '@/lib/api';
import { getCache, setCache } from '@/lib/cache';
import { formatPhone } from '@/lib/format';
import type { DBPost, DBUser } from '@/lib/types';

type AdPost = DBPost & { author?: DBUser };

/**
 * 메인 페이지 통합 사이드바 (우측, 280px)
 * 프리미엄 업체 + 최근 본 업체 + 스폰서 + FAQ 링크 통합
 */
export default function HomeAside() {
  const [recent, setRecent] = useState<RecentBuyer[]>([]);
  // 추천/전국 광고(삽니다 글) 상위 4개. 예전엔 premium_buyers 를 봤는데 광고를 삽니다 글로
  // 통일하면서 그 테이블이 비어 사이드바가 영영 안 뜨는 상태였다.
  const [featured, setFeatured] = useState<AdPost[]>(() => getCache<AdPost[]>('aside_ads') ?? []);

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

  useEffect(() => {
    getAdPosts(['recommend', 'national'], 4)
      .then((data) => {
        setFeatured(data as AdPost[]);
        setCache('aside_ads', data, 120000);
      })
      .catch(() => {});
  }, []);

  return (
    <aside className="space-y-3.5">
      {/* 프리미엄 업체 */}
      {featured.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-1.5">
              <Crown size={13} className="text-amber-500" />
              <span className="text-[12px] font-bold text-gray-800">추천 업체</span>
            </div>
            <Link href="/recommended" className="text-[10.5px] text-gray-400 hover:text-accent">전체 →</Link>
          </div>
          <ul>
            {featured.map((b) => {
              const name = b.author?.name ?? b.guest_name ?? '업체';
              const phone = b.guest_phone || b.author?.phone || '';
              return (
                <li key={b.id} className="border-b border-gray-50 last:border-b-0">
                  <Link
                    href={`/board/${b.id}`}
                    onClick={() => addRecentBuyer({ id: b.id, name, region: b.region, image_url: null })}
                    className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-100 to-blue-50 border border-gray-100 shrink-0" />
                      <span className="text-[12.5px] font-bold text-gray-900 truncate flex-1">{name}</span>
                      {b.percentage != null && (
                        <span className="text-[11px] font-extrabold text-accent shrink-0">{b.percentage}%</span>
                      )}
                    </div>
                    {phone && (
                      <p className="flex items-center gap-1 text-[11.5px] font-bold text-gray-700">
                        <Phone size={10} className="text-accent shrink-0" />
                        <span className="tabular-nums truncate">{formatPhone(phone)}</span>
                      </p>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

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

/** 최근 본 업체 — 한 번에 1개씩 순차 표시, 오른쪽 화살표로 다음 업체 */
function RecentCarousel({ items }: { items: RecentBuyer[] }) {
  const [idx, setIdx] = useState(0);
  const cur = items[idx % items.length];
  if (!cur) return null;
  return (
    <div className="flex items-center gap-1 px-2 py-2">
      <Link
        href={`/board/${cur.id}`}
        className="flex items-center gap-2 px-2 py-1.5 flex-1 min-w-0 hover:bg-gray-50 transition-colors"
      >
        <span className="w-6 h-6 rounded bg-gray-100 shrink-0" />
        <span className="text-[11.5px] text-gray-700 truncate flex-1">{cur.name}</span>
        {cur.region && <span className="text-[10px] text-gray-400 shrink-0">{cur.region}</span>}
      </Link>
      {items.length > 1 && (
        <>
          <span className="text-[10px] text-gray-400 tabular-nums shrink-0">{(idx % items.length) + 1}/{items.length}</span>
          <button
            type="button"
            onClick={() => setIdx((v) => (v + 1) % items.length)}
            aria-label="다음 업체"
            className="shrink-0 w-6 h-6 flex items-center justify-center border border-gray-200 rounded text-gray-400 hover:border-accent hover:text-accent transition-colors"
          >
            <ChevronRight size={13} />
          </button>
        </>
      )}
    </div>
  );
}
