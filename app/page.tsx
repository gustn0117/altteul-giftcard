'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, ShoppingCart, PenSquare, Tag, Users, Zap, TrendingUp } from 'lucide-react';
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
    <div className="bg-gradient-to-b from-gray-50/50 to-white min-h-[calc(100vh-200px)]">
      <MainBanners />

      <div className="container-main py-8">
        {/* Quick stats — 페이지 진입 시 빠른 데이터 인사이트 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard icon={Tag} label="판매글" value={sellPosts.length} unit="건" color="rose" loading={loading} />
          <StatCard icon={ShoppingCart} label="구매글" value={buyPosts.length} unit="건" color="blue" loading={loading} />
          <StatCard icon={Users} label="매입업체" value={buyers.length} unit="곳" color="emerald" loading={loading} />
          <StatCard icon={Zap} label="실시간 처리" value="평균 12분" color="violet" />
        </div>

        {/* 메인 그리드: 좌측 사이드(280) + 메인 풀와이드 (사이드 위치 변경) */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* 좌측 사이드 */}
          <HomeAside />

          <div className="space-y-6 min-w-0">
            {/* 검색 / 필터 */}
            <BuyerFinder />

            {/* 메인 등록업체 섹션 */}
            <SectionWrap
              icon={TrendingUp}
              title="메인 등록업체"
              desc="검증된 매입 업체를 추천 우선순위로 노출합니다."
            >
              <MainCompaniesSection buyers={buyers} loading={loading} />
            </SectionWrap>

            {/* 사이트 메뉴 */}
            <SiteMenu />

            {/* 상품권 삽니다 */}
            <SectionWrap
              icon={ShoppingCart}
              title="상품권 삽니다"
              desc="매입 업체가 등록한 구매 요청 글입니다."
              count={!loading ? buyPosts.length : undefined}
              actions={(
                <>
                  <Link href="/board?tab=buy" className="text-[12px] text-gray-500 hover:text-accent flex items-center gap-0.5">
                    전체보기 <ChevronRight size={11} />
                  </Link>
                  <Link href="/board/write?type=buy" className="btn-primary h-8 px-3 text-[12px]">
                    <PenSquare size={12} /> 구매글 작성
                  </Link>
                </>
              )}
            >
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
            </SectionWrap>

            {/* 실시간 판매문의 */}
            <RealtimeSellPosts posts={sellPosts} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────── 보조 컴포넌트 ──────── */

interface StatCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number | string;
  unit?: string;
  color: 'rose' | 'blue' | 'emerald' | 'violet';
  loading?: boolean;
}

function StatCard({ icon: Icon, label, value, unit, color, loading }: StatCardProps) {
  const ring = {
    rose: 'bg-rose-50 text-rose-500',
    blue: 'bg-blue-50 text-blue-500',
    emerald: 'bg-emerald-50 text-emerald-500',
    violet: 'bg-violet-50 text-violet-500',
  }[color];
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-shadow">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${ring}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-500 font-medium">{label}</p>
        <p className="text-[16px] font-extrabold text-gray-900 truncate">
          {loading ? '—' : (
            <>
              {typeof value === 'number' ? value.toLocaleString() : value}
              {unit && <span className="text-[11px] text-gray-400 ml-1">{unit}</span>}
            </>
          )}
        </p>
      </div>
    </div>
  );
}

interface SectionWrapProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  desc?: string;
  count?: number;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

function SectionWrap({ icon: Icon, title, desc, count, actions, children }: SectionWrapProps) {
  return (
    <section>
      <div className="flex items-end justify-between mb-3 gap-3">
        <div className="min-w-0">
          <h2 className="text-[17px] font-extrabold text-gray-900 flex items-center gap-2">
            <Icon size={16} className="text-accent" /> {title}
            {count !== undefined && <span className="text-[12px] text-gray-400 font-normal">{count}건</span>}
          </h2>
          {desc && <p className="text-[11.5px] text-gray-500 mt-1">{desc}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {children}
    </section>
  );
}
