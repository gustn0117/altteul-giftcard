import Link from 'next/link';
import { ArrowRight, ShieldCheck, Zap } from 'lucide-react';

/** 메인 히어로 — 핀테크 톤의 모던 카피 */
export default function HeroPromo() {
  return (
    <section>
      <div
        className="relative overflow-hidden rounded-2xl border border-slate-800/10"
        style={{
          background:
            'radial-gradient(1200px 400px at 0% 0%, rgba(59,130,246,0.18), transparent 60%), radial-gradient(800px 300px at 100% 100%, rgba(251,191,36,0.18), transparent 60%), linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #1E40AF 100%)',
        }}
      >
        {/* 장식 도트 패턴 */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)',
            backgroundSize: '20px 20px',
          }}
        />

        <div className="relative grid grid-cols-1 md:grid-cols-[1.2fr_1fr] items-center gap-4 px-6 py-7 md:px-10 md:py-12">
          {/* 좌: 카피 */}
          <div className="text-white">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase text-blue-200 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-full mb-4">
              상품권 중개 No.1
            </span>
            <h2 className="text-[26px] md:text-[34px] font-black tracking-tight leading-[1.15] mb-3">
              상품권, <br className="md:hidden" />
              <span className="bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent">
                더 똑똑하게.
              </span>
            </h2>
            <p className="text-[13px] md:text-[14.5px] text-slate-300 leading-relaxed mb-5 max-w-[420px]">
              검증된 매입 업체와 즉시 연결.<br className="hidden sm:inline" />
              가장 높은 매입률을 한눈에 비교하세요.
            </p>

            {/* 미니 통계 + CTA */}
            <div className="flex items-center gap-4 mb-5">
              <div className="flex items-center gap-1.5 text-[12px] text-slate-300">
                <ShieldCheck size={14} className="text-emerald-300" />
                <span><strong className="text-white font-bold">검증 업체</strong> 1,000+</span>
              </div>
              <div className="w-px h-3 bg-white/20" aria-hidden />
              <div className="flex items-center gap-1.5 text-[12px] text-slate-300">
                <Zap size={14} className="text-amber-300" />
                <span><strong className="text-white font-bold">평균 응답</strong> 12분</span>
              </div>
            </div>

            <Link
              href="/recommended"
              className="inline-flex items-center gap-1.5 h-11 px-5 bg-white text-slate-900 text-[13.5px] font-extrabold rounded-full shadow-lg shadow-blue-900/30 hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              지금 매입률 비교하기 <ArrowRight size={15} strokeWidth={2.6} />
            </Link>
          </div>

          {/* 우: 모던 일러스트 (카드 + 그래프) */}
          <div className="hidden md:flex items-center justify-center">
            <svg viewBox="0 0 280 220" className="w-full max-w-72">
              <defs>
                <linearGradient id="cardGradA" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FBBF24" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
                <linearGradient id="cardGradB" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#1E3A8A" />
                </linearGradient>
                <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34D399" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* 백그라운드 카드 (블러 느낌) */}
              <g transform="translate(40, 28) rotate(-6 80 50)" opacity="0.85">
                <rect width="160" height="100" rx="14" fill="url(#cardGradA)" />
                <circle cx="135" cy="22" r="10" fill="white" opacity="0.7" />
                <circle cx="148" cy="22" r="10" fill="white" opacity="0.4" />
                <rect x="16" y="60" width="80" height="6" rx="2" fill="white" opacity="0.5" />
                <rect x="16" y="72" width="50" height="6" rx="2" fill="white" opacity="0.35" />
              </g>

              {/* 메인 카드 */}
              <g transform="translate(60, 60) rotate(4 80 50)">
                <rect width="170" height="106" rx="16" fill="url(#cardGradB)" />
                <text x="20" y="36" fontFamily="system-ui" fontWeight="700" fontSize="11" fill="white" opacity="0.7">매입률</text>
                <text x="20" y="68" fontFamily="system-ui" fontWeight="900" fontSize="32" fill="white">92<tspan fontSize="20">%</tspan></text>
                <text x="20" y="86" fontFamily="system-ui" fontWeight="600" fontSize="10" fill="#A7F3D0">▲ 어제보다 +1.2%</text>
                <text x="142" y="36" textAnchor="end" fontFamily="serif" fontWeight="900" fontSize="22" fill="white" opacity="0.9">₩</text>
                {/* 미니 차트 */}
                <path d="M105 92 L120 80 L135 86 L150 70 L160 76" stroke="#34D399" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M105 92 L120 80 L135 86 L150 70 L160 76 L160 100 L105 100 Z" fill="url(#chartFill)" />
              </g>

              {/* 작은 별 장식 */}
              <g fill="#FBBF24">
                <circle cx="20" cy="60" r="2.5" />
                <circle cx="260" cy="40" r="3" />
                <circle cx="250" cy="190" r="2.5" />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
