import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/** 메인 히어로 — 미니멀 + 큰 타이포 (Apple/Linear 톤) */
export default function HeroPromo() {
  return (
    <section>
      <div className="relative bg-white border border-gray-200 rounded-3xl overflow-hidden">
        {/* 미묘한 그라디언트 글로우 */}
        <div
          aria-hidden
          className="absolute -top-1/3 -right-1/4 w-150 h-150 rounded-full opacity-50 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12), transparent 70%)' }}
        />
        <div
          aria-hidden
          className="absolute -bottom-1/3 -left-1/4 w-125 h-125 rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.10), transparent 70%)' }}
        />

        <div className="relative px-6 py-14 md:px-16 md:py-24 text-center">
          {/* 작은 라벨 */}
          <p className="text-[10.5px] font-bold tracking-[0.25em] uppercase text-gray-400 mb-5">
            No. 1 Giftcard Marketplace
          </p>

          {/* 헤드라인 */}
          <h2 className="text-[34px] sm:text-[44px] md:text-[56px] font-black tracking-tight text-gray-900 leading-[1.05]">
            상품권,<br className="sm:hidden" />
            {' '}가장 높은 가격에.
          </h2>

          {/* 서브 */}
          <p className="text-[13.5px] md:text-[15px] text-gray-500 mt-5 md:mt-6 max-w-md mx-auto leading-relaxed">
            검증된 매입 업체와 즉시 매칭. 비교는 한 곳에서.
          </p>

          {/* CTA — 검정 솔리드 + 흰 글씨 (inline 강제) */}
          <Link
            href="/recommended"
            className="mt-9 md:mt-11 inline-flex items-center gap-2 h-12 px-7 text-[13.5px] font-bold rounded-full transition-colors hover:opacity-90"
            style={{ background: '#0F172A', color: '#FFFFFF' }}
          >
            <span style={{ color: '#FFFFFF' }}>매입률 비교하기</span>
            <ArrowRight size={15} strokeWidth={2.4} style={{ color: '#FFFFFF' }} />
          </Link>
        </div>
      </div>
    </section>
  );
}
