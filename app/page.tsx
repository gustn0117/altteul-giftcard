import NationalAds from '@/components/home/NationalAds';
import HeroPromo from '@/components/home/HeroPromo';
import QuickLinks from '@/components/home/QuickLinks';
import VisitorCounter from '@/components/home/VisitorCounter';
import HomeAside from '@/components/layout/HomeAside';

export default function Home() {
  return (
    <div className="bg-linear-to-b from-gray-50/50 to-white min-h-[calc(100vh-200px)] pb-8">
      {/* 1. 전국 광고 (2x2) — 모든 폭 최상단 */}
      <NationalAds />

      {/* 2. PC: 좌측 사이드 + 메인(히어로/링크/카운터) / 모바일: 1단 직선 */}
      <div className="container-main pt-3">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
          {/* 좌측 사이드 (PC만) */}
          <div className="hidden lg:block">
            <HomeAside />
          </div>

          <div className="space-y-3">
            <HeroPromo />
            <QuickLinks />
            <VisitorCounter />
          </div>
        </div>
      </div>
    </div>
  );
}
