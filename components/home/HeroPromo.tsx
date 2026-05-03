import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/** 메인 히어로 — 컴팩트, 미니멀 */
export default function HeroPromo() {
  return (
    <section>
      <div className="relative bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div
          aria-hidden
          className="absolute -top-1/3 -right-1/4 w-100 h-100 rounded-full opacity-50 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12), transparent 70%)' }}
        />
        <div
          aria-hidden
          className="absolute -bottom-1/3 -left-1/4 w-90 h-90 rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.10), transparent 70%)' }}
        />

        <div className="relative px-5 py-6 md:px-8 md:py-9 text-center">
          <p className="text-[9.5px] font-bold tracking-[0.22em] uppercase text-gray-400 mb-2.5">
            No. 1 Giftcard Marketplace
          </p>
          <h2 className="text-[20px] md:text-[28px] font-black tracking-tight text-gray-900 leading-[1.15]">
            상품권, 가장 높은 가격에.
          </h2>
          <p className="text-[12px] md:text-[13px] text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
            검증된 매입 업체와 즉시 매칭. 비교는 한 곳에서.
          </p>
          <Link
            href="/recommended"
            className="mt-4 md:mt-5 inline-flex items-center gap-1.5 h-10 px-5 text-[12.5px] font-bold rounded-full transition-colors hover:opacity-90"
            style={{ background: '#0F172A', color: '#FFFFFF' }}
          >
            <span style={{ color: '#FFFFFF' }}>매입률 비교하기</span>
            <ArrowRight size={13} strokeWidth={2.4} style={{ color: '#FFFFFF' }} />
          </Link>
        </div>
      </div>
    </section>
  );
}
