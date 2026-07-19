'use client';

import { Globe, Megaphone } from 'lucide-react';
import HeroPromo from '@/components/home/HeroPromo';
import QuickLinks from '@/components/home/QuickLinks';
import VisitorCounter from '@/components/home/VisitorCounter';
import HomeAside from '@/components/layout/HomeAside';
import AdSection from '@/components/home/AdSection';
import SellLineAds from '@/components/home/SellLineAds';

/**
 * 홈 광고칸 3종 — 전부 '관리자 승인된 삽니다(buy) 글'로 통일.
 * 카드/크기/간격/내용이 같아야 하므로 세 칸 모두 같은 AdSection + BuyPostCard 를 쓴다.
 */
export default function Home() {
  return (
    <div className="bg-linear-to-b from-gray-50/50 to-white min-h-[calc(100vh-200px)] pb-3 md:pb-8">
      <div className="container-main pt-1 md:pt-3">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
          {/* 좌측 사이드 (PC만) */}
          <div className="hidden lg:block">
            <HomeAside />
          </div>

          <div className="space-y-2 md:space-y-3">
            <HeroPromo />
            <QuickLinks />
            <VisitorCounter />

            {/* 전국광고 */}
            <AdSection
              adType="national"
              title="전국 광고"
              icon={<Globe size={15} className="text-accent" />}
              perPage={50}
              emptyText="전국 광고 모집중입니다."
            />

            {/* 메인광고 — 전국광고 바로 아래, 50개가 한 칸 */}
            <AdSection
              adType="main"
              title="메인 광고"
              icon={<Megaphone size={15} className="text-accent" />}
              perPage={50}
              shuffle
              emptyText="메인 광고 모집중입니다."
            />

            {/* 팝니다 줄광고 */}
            <SellLineAds />
          </div>
        </div>
      </div>
    </div>
  );
}
