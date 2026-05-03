'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface HeroData {
  eyebrow: string;
  headline: string;
  sub: string;
  cta_text: string;
  cta_link: string;
  image_url: string | null;
}

const FALLBACK: HeroData = {
  eyebrow: 'No. 1 Giftcard Marketplace',
  headline: '상품권, 가장 높은 가격에.',
  sub: '검증된 매입 업체와 즉시 매칭. 비교는 한 곳에서.',
  cta_text: '매입률 비교하기',
  cta_link: '/recommended',
  image_url: null,
};

/** 메인 히어로 — 운영자 페이지에서 편집 가능 */
export default function HeroPromo() {
  const [data, setData] = useState<HeroData>(FALLBACK);

  useEffect(() => {
    fetch('/api/hero-promo')
      .then((r) => r.json())
      .then((d) => {
        if (d && d.headline) {
          setData({
            eyebrow: d.eyebrow ?? FALLBACK.eyebrow,
            headline: d.headline,
            sub: d.sub ?? '',
            cta_text: d.cta_text ?? '',
            cta_link: d.cta_link ?? '#',
            image_url: d.image_url ?? null,
          });
        }
      })
      .catch(() => { /* 기본값 유지 */ });
  }, []);

  return (
    <section>
      <div
        className="relative bg-white border border-gray-200 rounded-2xl overflow-hidden"
        style={data.image_url ? { backgroundImage: `url(${data.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      >
        {!data.image_url && (
          <>
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
          </>
        )}
        {data.image_url && <div className="absolute inset-0 bg-white/75 backdrop-blur-sm" aria-hidden />}

        <div className="relative px-5 py-6 md:px-8 md:py-9 text-center">
          {data.eyebrow && (
            <p className="text-[9.5px] font-bold tracking-[0.22em] uppercase text-gray-400 mb-2.5">
              {data.eyebrow}
            </p>
          )}
          <h2 className="text-[20px] md:text-[28px] font-black tracking-tight text-gray-900 leading-[1.15]">
            {data.headline}
          </h2>
          {data.sub && (
            <p className="text-[12px] md:text-[13px] text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
              {data.sub}
            </p>
          )}
          {data.cta_text && data.cta_link && (
            <Link
              href={data.cta_link}
              className="mt-4 md:mt-5 inline-flex items-center gap-1.5 h-10 px-5 text-[12.5px] font-bold rounded-full transition-colors hover:opacity-90"
              style={{ background: '#0F172A', color: '#FFFFFF' }}
            >
              <span style={{ color: '#FFFFFF' }}>{data.cta_text}</span>
              <ArrowRight size={13} strokeWidth={2.4} style={{ color: '#FFFFFF' }} />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
