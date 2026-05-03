import { Sparkles } from 'lucide-react';

/** 메인 히어로 — 큰 카피 + 일러스트 영역 */
export default function HeroPromo() {
  return (
    <section>
      <div className="bg-linear-to-br from-orange-50 via-amber-50 to-yellow-50 border border-amber-200 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 items-center">
          {/* 좌: 카피 */}
          <div className="px-6 py-7 md:px-9 md:py-10">
            <p className="inline-flex items-center gap-1 text-[11.5px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full mb-3">
              <Sparkles size={11} /> 전국 최대 규모
            </p>
            <h2 className="text-[20px] md:text-[24px] font-extrabold text-gray-900 leading-tight mb-1">
              상품권 매입업체가 모두 한곳에!
            </h2>
            <p className="text-[24px] md:text-[30px] font-black text-gray-900 leading-tight">
              상품권 중개<br/>플랫폼 <span className="text-accent">1위!</span>
            </p>
          </div>
          {/* 우: 일러스트 (간단 SVG) */}
          <div className="hidden md:flex items-center justify-center px-6 py-6">
            <svg viewBox="0 0 220 180" className="w-full max-w-[280px]">
              <defs>
                <linearGradient id="card1" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FBBF24"/>
                  <stop offset="100%" stopColor="#D97706"/>
                </linearGradient>
                <linearGradient id="card2" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#60A5FA"/>
                  <stop offset="100%" stopColor="#2563EB"/>
                </linearGradient>
              </defs>
              {/* 배경 원 */}
              <circle cx="110" cy="90" r="78" fill="#FFF7ED"/>
              {/* 카드 1 */}
              <g transform="translate(35, 55) rotate(-8 50 30)">
                <rect width="100" height="60" rx="6" fill="url(#card1)"/>
                <rect x="8" y="10" width="32" height="6" rx="2" fill="white" opacity="0.7"/>
                <rect x="8" y="22" width="60" height="4" rx="1" fill="white" opacity="0.5"/>
                <text x="74" y="48" fontFamily="serif" fontWeight="900" fontSize="22" fill="white">₩</text>
              </g>
              {/* 카드 2 */}
              <g transform="translate(80, 70) rotate(6 50 30)">
                <rect width="100" height="60" rx="6" fill="url(#card2)"/>
                <rect x="8" y="10" width="32" height="6" rx="2" fill="white" opacity="0.7"/>
                <rect x="8" y="22" width="60" height="4" rx="1" fill="white" opacity="0.5"/>
                <text x="74" y="48" fontFamily="serif" fontWeight="900" fontSize="22" fill="white">₩</text>
              </g>
              {/* 별 장식 */}
              <g fill="#FBBF24">
                <circle cx="40" cy="40" r="3"/>
                <circle cx="180" cy="50" r="4"/>
                <circle cx="190" cy="130" r="3"/>
                <circle cx="35" cy="140" r="3.5"/>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
