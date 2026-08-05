'use client';

import { Suspense } from 'react';
import { Globe, Megaphone } from 'lucide-react';
import HeroPromo from '@/components/home/HeroPromo';
import QuickLinks from '@/components/home/QuickLinks';
import VisitorCounter from '@/components/home/VisitorCounter';
import HomeAside from '@/components/layout/HomeAside';
import AdSection from '@/components/home/AdSection';
import SellLineAds from '@/components/home/SellLineAds';
import RecommendRail from '@/components/home/RecommendRail';
import { SITE_URL, SITE_DESC } from '@/lib/site';

// 검색엔진용 구조화 데이터 — '예판상품권'을 정식명, '상품권예판/상품권예약판매'를 별칭으로 등록
const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: '예판상품권',
      alternateName: ['상품권예약판매', '상품권예판', '예약판매상품권', '상품권 예판', '상품권 예약판매', '예판 상품권'],
      url: SITE_URL,
      description: SITE_DESC,
      inLanguage: 'ko-KR',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      name: '예판상품권',
      alternateName: ['상품권예약판매', '상품권예판', '예약판매상품권', '예판상품권'],
      url: SITE_URL,
      description: SITE_DESC,
    },
  ],
};

/**
 * 홈 광고칸 3종 — 전부 '관리자 승인된 삽니다(buy) 글'로 통일.
 * 카드/크기/간격/내용이 같아야 하므로 세 칸 모두 같은 AdSection + BuyPostCard 를 쓴다.
 */
export default function Home() {
  return (
    <div className="bg-linear-to-b from-gray-50/50 to-white min-h-[calc(100vh-200px)] pb-3 md:pb-8">
      {/* 검색엔진 구조화 데이터 */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      {/* 검색 노출용 핵심 제목 (화면에는 이미지 히어로가 있으므로 스크린리더/검색엔진용 H1) */}
      <h1 className="sr-only">상품권예약판매 · 상품권예판 · 예약판매상품권 · 예판상품권 — 상품권 예약판매(예판) 안전 직거래 플랫폼</h1>
      <div className="container-wide pt-1 md:pt-3">
        {/* PC: 좌(최근 본 업체) · 중앙 · 우(오늘의 추천업체 2개 랜덤). 모바일은 중앙만.
            양옆 레일을 좁혀 중앙(메인/광고)을 최대한 넓게 확보한다. */}
        <div className="grid grid-cols-1 lg:grid-cols-[176px_1fr_184px] gap-4">
          {/* 좌측 사이드 (PC만) */}
          <div className="hidden lg:block">
            <HomeAside />
          </div>

          <div className="space-y-2 md:space-y-3">
            <HeroPromo />
            <QuickLinks />
            <VisitorCounter />

            {/* 광고칸 3종 — 페이지 번호를 URL 쿼리로 관리하므로 useSearchParams Suspense 경계로 감싼다 */}
            <Suspense fallback={null}>
              {/* 전국광고 */}
              <AdSection
                adType="national"
                title="전국 광고"
                icon={<Globe size={15} className="text-accent" />}
                perPage={50}
                pageParam="np"
                desktopCols={5}
                shuffle
                emptyText="전국 광고 모집중입니다."
              />

              {/* 메인광고 — 전국광고 바로 아래, 50개가 한 칸 */}
              <AdSection
                adType="main"
                title="메인 광고"
                icon={<Megaphone size={15} className="text-accent" />}
                perPage={50}
                shuffle
                pageParam="mp"
                desktopCols={5}
                emptyText="메인 광고 모집중입니다."
              />

              {/* 팝니다 줄광고 */}
              <SellLineAds />
            </Suspense>
          </div>

          {/* 우측 레일 — 오늘의 추천업체 2개 랜덤 (PC만) */}
          <div className="hidden lg:block">
            <RecommendRail />
          </div>
        </div>
      </div>
    </div>
  );
}
