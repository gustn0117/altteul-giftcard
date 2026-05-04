'use client';

import { useEffect, useState } from 'react';
import NationalAds from '@/components/home/NationalAds';
import HeroPromo from '@/components/home/HeroPromo';
import QuickLinks from '@/components/home/QuickLinks';
import VisitorCounter from '@/components/home/VisitorCounter';
import HomeAside from '@/components/layout/HomeAside';
import MainCompaniesSection from '@/components/home/MainCompaniesSection';
import SellLineAds from '@/components/home/SellLineAds';
import { getPremiumBuyers } from '@/lib/api';
import type { DBPremiumBuyer } from '@/lib/types';
import { getCache, setCache } from '@/lib/cache';

export default function Home() {
  const [buyers, setBuyers] = useState<DBPremiumBuyer[]>(() => getCache<DBPremiumBuyer[]>('home_buyers') ?? []);
  const [loading, setLoading] = useState(() => !getCache('home_buyers'));

  useEffect(() => {
    getPremiumBuyers()
      .then((data) => { setBuyers(data); setCache('home_buyers', data, 120000); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-linear-to-b from-gray-50/50 to-white min-h-[calc(100vh-200px)] pb-3 md:pb-8">
      <div className="container-main pt-1 md:pt-3">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
          {/* 좌측 사이드 (PC만) */}
          <div className="hidden lg:block">
            <HomeAside />
          </div>

          <div className="space-y-2 md:space-y-3">
            {/* 1. 우리 업체 홍보 (작게) */}
            <HeroPromo />
            {/* 2. 이용안내 / 주의사항 */}
            <QuickLinks />
            {/* 3. 오늘 방문자 / 누적 상담 */}
            <VisitorCounter />
            {/* 4. 전국 광고 (2x2) */}
            <NationalAds />
            {/* 5. 메인 광고 — 등록업체 카드 그리드 */}
            <MainCompaniesSection buyers={buyers} loading={loading} />
            {/* 6. 팝니다 줄광고 — 10개씩 페이지 */}
            <SellLineAds />
          </div>
        </div>
      </div>
    </div>
  );
}
