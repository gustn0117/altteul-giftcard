'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { MapPin, Crown } from 'lucide-react';
import AdSection from '@/components/home/AdSection';
import HomeAside from '@/components/layout/HomeAside';
import RecommendRail from '@/components/home/RecommendRail';

/**
 * 오늘의 추천업체 — 홈과 동일한 3분할(좌 최근 본 업체 · 중앙 · 우 오늘의 추천업체) + 넓은 폭.
 * 상단 전국광고를 고정하고, 그 아래 추천업체 광고(삽니다 글)를 5열 박스카드로 노출한다.
 */
export default function RecommendedPage() {
  return (
    <div className="container-wide py-4">
      <div className="grid grid-cols-1 lg:grid-cols-[176px_1fr_184px] gap-4">
        {/* 좌측 — 최근 본 업체 (PC만) */}
        <div className="hidden lg:block">
          <HomeAside />
        </div>

        {/* 중앙 */}
        <div className="min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-[18px] font-bold text-gray-800">오늘의 추천업체</h1>
            <div className="breadcrumb">
              <Link href="/">HOME</Link> &gt; 오늘의 추천업체
            </div>
          </div>

          <Suspense fallback={null}>
            {/* 상단 고정 전국광고 (판매/매입찾기와 동일) */}
            <AdSection adType="national" title="전국 광고" icon={<MapPin size={15} className="text-accent" />} perPage={50} desktopCols={5} />

            <AdSection
              adType="recommend"
              title="추천 업체"
              icon={<Crown size={15} className="text-accent" />}
              perPage={50}
              shuffle
              desktopCols={5}
              emptyText="추천 업체 모집중입니다."
            />
          </Suspense>
        </div>

        {/* 우측 — 오늘의 추천업체 2개 랜덤 (PC만) */}
        <div className="hidden lg:block">
          <RecommendRail />
        </div>
      </div>
    </div>
  );
}
