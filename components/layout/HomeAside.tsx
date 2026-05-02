'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Crown, Clock, Phone, X, ExternalLink, HelpCircle } from 'lucide-react';
import { getRecentBuyers, clearRecentBuyers, RECENT_BUYERS_EVENT, addRecentBuyer, type RecentBuyer } from '@/lib/recentBuyers';
import { getPremiumBuyers } from '@/lib/api';
import { getCache, setCache } from '@/lib/cache';
import type { DBPremiumBuyer } from '@/lib/types';

/**
 * 메인 페이지 통합 사이드바 (우측, 280px)
 * 프리미엄 업체 + 최근 본 업체 + 스폰서 + FAQ 링크 통합
 */
export default function HomeAside() {
  const [recent, setRecent] = useState<RecentBuyer[]>([]);
  const [premium, setPremium] = useState<DBPremiumBuyer[]>(() => getCache<DBPremiumBuyer[]>('home_buyers') ?? []);

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
    if (premium.length > 0) return;
    getPremiumBuyers().then((data) => {
      setPremium(data);
      setCache('home_buyers', data, 120000);
    }).catch(() => {});
  }, [premium.length]);

  const featured = premium.slice(0, 4);

  return (
    <aside className="space-y-3.5">
      {/* 프리미엄 업체 */}
      {featured.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-1.5">
              <Crown size={13} className="text-amber-500" />
              <span className="text-[12px] font-bold text-gray-800">프리미엄 업체</span>
            </div>
            <Link href="/recommended" className="text-[10.5px] text-gray-400 hover:text-accent">전체 →</Link>
          </div>
          <ul>
            {featured.map((b) => (
              <li key={b.id} className="border-b border-gray-50 last:border-b-0">
                <Link
                  href={`/buyer/${b.id}`}
                  onClick={() => addRecentBuyer({ id: b.id, name: b.name, region: b.region, image_url: b.image_url })}
                  className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    {b.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.image_url} alt="" className="w-8 h-8 rounded-lg object-cover border border-gray-100 shrink-0" />
                    ) : (
                      <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 border border-gray-100 shrink-0" />
                    )}
                    <span className="text-[12.5px] font-bold text-gray-900 truncate flex-1">{b.name}</span>
                  </div>
                  {b.phone && (
                    <p className="flex items-center gap-1 text-[11.5px] font-bold text-gray-700">
                      <Phone size={10} className="text-accent shrink-0" />
                      <span className="tabular-nums">{b.phone}</span>
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 스폰서 광고 */}
      <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-4 text-center">
        <p className="text-[10.5px] text-blue-600 font-bold mb-1.5">SPONSORED</p>
        <p className="text-[13px] font-bold text-gray-900">광고 모집중</p>
        <p className="text-[10.5px] text-gray-500 mt-1 leading-relaxed">메인 페이지 사이드 슬롯<br/>광고 문의를 받습니다.</p>
        <Link href="/advertising" className="inline-flex items-center gap-1 mt-2.5 text-[11px] font-bold text-accent">
          자세히 <ExternalLink size={10} />
        </Link>
      </div>

      {/* 최근 본 업체 */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-gray-500" />
            <span className="text-[12px] font-bold text-gray-800">최근 본 업체</span>
          </div>
          {recent.length > 0 && (
            <button onClick={clearRecentBuyers} aria-label="비우기" className="text-gray-400 hover:text-rose-500">
              <X size={12} />
            </button>
          )}
        </div>
        {recent.length === 0 ? (
          <p className="px-4 py-5 text-[11px] text-gray-400 leading-relaxed">업체 카드를 클릭하면<br/>이곳에 기록됩니다.</p>
        ) : (
          <ul>
            {recent.slice(0, 5).map((b) => (
              <li key={b.id} className="border-b border-gray-50 last:border-b-0">
                <Link href={`/buyer/${b.id}`} className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                  {b.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.image_url} alt="" className="w-6 h-6 rounded object-cover border border-gray-100 shrink-0" />
                  ) : (
                    <span className="w-6 h-6 rounded bg-gray-100 shrink-0" />
                  )}
                  <span className="text-[11.5px] text-gray-700 truncate flex-1">{b.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* FAQ */}
      <Link href="/faq" className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-accent hover:bg-accent/5 transition-colors">
        <HelpCircle size={14} className="text-gray-500" />
        <span className="text-[12px] text-gray-700 font-medium">자주묻는질문</span>
      </Link>
    </aside>
  );
}
