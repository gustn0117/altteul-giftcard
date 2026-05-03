import NationalAds from '@/components/home/NationalAds';
import HeroPromo from '@/components/home/HeroPromo';
import QuickLinks from '@/components/home/QuickLinks';
import VisitorCounter from '@/components/home/VisitorCounter';

export default function Home() {
  return (
    <div className="bg-gradient-to-b from-gray-50/50 to-white min-h-[calc(100vh-200px)] pb-8">
      {/* 1. 전국 광고 (2x2) — 최상단 */}
      <NationalAds />

      {/* 2. 우리 업체 홍보 이미지 (히어로) */}
      <HeroPromo />

      {/* 3. 이용안내 / 주의사항 */}
      <QuickLinks />

      {/* 4. 오늘의 방문자 / 누적 상담 */}
      <VisitorCounter />
    </div>
  );
}
