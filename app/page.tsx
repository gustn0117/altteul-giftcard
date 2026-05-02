'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, ShoppingCart, PenSquare } from 'lucide-react';
import MainBanners from '@/components/home/MainBanners';
import HomeAside from '@/components/layout/HomeAside';
import MainCompaniesSection from '@/components/home/MainCompaniesSection';
import BuyerFinder from '@/components/home/BuyerFinder';
import RealtimeSellPosts from '@/components/home/RealtimeSellPosts';
import SiteMenu from '@/components/home/SiteMenu';
import SellPostItem from '@/components/home/SellPostItem';
import { getPosts, getPremiumBuyers } from '@/lib/api';
import type { DBPost, DBUser, DBPremiumBuyer } from '@/lib/types';
import { getCache, setCache } from '@/lib/cache';

type PostWithAuthor = DBPost & { author: DBUser };

export default function Home() {
  const [sellPosts, setSellPosts] = useState<PostWithAuthor[]>(() => getCache<PostWithAuthor[]>('home_sell') ?? []);
  const [buyPosts, setBuyPosts] = useState<PostWithAuthor[]>(() => getCache<PostWithAuthor[]>('home_buy') ?? []);
  const [buyers, setBuyers] = useState<DBPremiumBuyer[]>(() => getCache<DBPremiumBuyer[]>('home_buyers') ?? []);
  const [loading, setLoading] = useState(() => !getCache('home_sell'));

  useEffect(() => {
    Promise.allSettled([
      getPosts('sell', { limit: 30 }),
      getPosts('buy', { limit: 30 }),
      getPremiumBuyers(),
    ]).then(([s, b, pb]) => {
      if (s.status === 'fulfilled') { setSellPosts(s.value); setCache('home_sell', s.value, 60000); }
      if (b.status === 'fulfilled') { setBuyPosts(b.value); setCache('home_buy', b.value, 60000); }
      if (pb.status === 'fulfilled') { setBuyers(pb.value); setCache('home_buyers', pb.value, 120000); }
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <MainBanners />

      <div className="container-main py-8">
        {/* 1. 검색 / 필터 */}
        <BuyerFinder />

        {/* 2. 메인 그리드: 콘텐츠 풀와이드 + 우측 사이드 280px */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 mt-6">
          <div className="space-y-6 min-w-0">
            {/* 메인 등록업체 */}
            <MainCompaniesSection buyers={buyers} loading={loading} />

            {/* 사이트 메뉴 */}
            <SiteMenu />

            {/* 상품권 삽니다 (줄광고) */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[16px] font-bold text-gray-800 flex items-center gap-2">
                  <ShoppingCart size={15} className="text-accent" />
                  상품권 삽니다
                  {!loading && <span className="text-[12px] text-gray-400 font-normal">{buyPosts.length}건</span>}
                </h2>
                <div className="flex items-center gap-2">
                  <Link href="/board?tab=buy" className="text-[12px] text-gray-500 hover:text-accent flex items-center gap-0.5">
                    전체보기 <ChevronRight size={11} />
                  </Link>
                  <Link href="/board/write?type=buy" className="btn-primary h-8 px-3 text-[12px]">
                    <PenSquare size={12} /> 구매글 작성
                  </Link>
                </div>
              </div>

              {loading ? (
                <div className="py-10 text-center text-gray-400 text-[13px]">불러오는 중...</div>
              ) : buyPosts.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-200 rounded-xl py-10 text-center">
                  <p className="text-[13px] text-gray-500 mb-2">아직 등록된 구매글이 없습니다.</p>
                  <Link href="/board/write?type=buy" className="text-[12px] text-accent font-bold hover:underline">
                    첫 구매글 작성하기 →
                  </Link>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                  {buyPosts.slice(0, 10).map((post, idx) => (
                    <SellPostItem key={post.id} post={post} num={idx + 1} />
                  ))}
                  {buyPosts.length > 10 && (
                    <Link href="/board?tab=buy" className="block py-3 text-center text-[12px] text-gray-500 hover:text-accent hover:bg-gray-50 border-t border-gray-100 transition-colors">
                      + {buyPosts.length - 10}건 더보기
                    </Link>
                  )}
                </div>
              )}
            </section>

            {/* 실시간 판매문의 */}
            <RealtimeSellPosts posts={sellPosts} loading={loading} />
          </div>

          {/* 우측 사이드 — 통합 위젯 */}
          <HomeAside />
        </div>
      </div>
    </div>
  );
}
