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
  image_url_mobile: string | null;
}

const FALLBACK: HeroData = {
  eyebrow: 'No. 1 Giftcard Marketplace',
  headline: '상품권, 가장 높은 가격에.',
  sub: '검증된 매입 업체와 즉시 매칭. 비교는 한 곳에서.',
  cta_text: '매입률 비교하기',
  cta_link: '/recommended',
  image_url: null,
  image_url_mobile: null,
};

/**
 * 메인 히어로 — 운영자 페이지에서 편집 가능
 * - 이미지가 있으면 박스에 고정 비율(aspect-ratio) 적용 → 텍스트 없어도 높이 유지
 *   · PC(md+): 약 890×297px (3:1) — 권장 업로드 1800×600px
 *   · 모바일: 약 345×195px (16:9 가까움) — 권장 업로드 750×420px
 */
export default function HeroPromo() {
  const [data, setData] = useState<HeroData>(FALLBACK);

  useEffect(() => {
    fetch('/api/hero-promo')
      .then((r) => r.json())
      .then((d) => {
        if (d && d.headline !== undefined) {
          setData({
            eyebrow: d.eyebrow ?? '',
            headline: d.headline ?? '',
            sub: d.sub ?? '',
            cta_text: d.cta_text ?? '',
            cta_link: d.cta_link ?? '#',
            image_url: d.image_url ?? null,
            image_url_mobile: d.image_url_mobile ?? null,
          });
        }
      })
      .catch(() => { /* fallback 유지 */ });
  }, []);

  // 이미지가 둘 중 하나라도 있으면 "이미지 모드" — 박스에 고정 비율 + 텍스트 오버레이 옵션
  const hasImage = !!(data.image_url || data.image_url_mobile);
  const hasText = !!(data.eyebrow || data.headline || data.sub || data.cta_text);

  return (
    <section>
      <div className="relative bg-white overflow-hidden -mx-3.75 md:mx-0 md:border md:border-gray-200 md:rounded-2xl">
        {/* 이미지 모드: PC와 모바일에 다른 이미지를 자동 분기 */}
        {hasImage && (
          <>
            {/* PC 이미지 — 자연 비율 그대로, 잘림 없음 */}
            {data.image_url && (
              <div className="hidden md:block w-full bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={data.image_url} alt="" className="block w-full h-auto" />
              </div>
            )}
            {/* 모바일 이미지 — 자연 비율 그대로 */}
            {(data.image_url_mobile || data.image_url) && (
              <div className="md:hidden w-full bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.image_url_mobile || data.image_url || ''}
                  alt=""
                  className="block w-full h-auto"
                />
              </div>
            )}
          </>
        )}

        {/* 텍스트 모드 (이미지 없을 때만 그라디언트 글로우 + 카피) */}
        {!hasImage && hasText && (
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
            <div className="relative px-5 py-6 md:px-8 md:py-9 text-center">
              {data.eyebrow && (
                <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-gray-400 mb-2.5">
                  {data.eyebrow}
                </p>
              )}
              {data.headline && (
                <h2 className="text-[20px] md:text-[28px] font-black tracking-tight text-gray-900 leading-[1.15]">
                  {data.headline}
                </h2>
              )}
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
          </>
        )}

        {/* 이미지 + CTA 동시 모드 (선택): 이미지 위에 CTA만 우하단에 floating */}
        {hasImage && data.cta_text && data.cta_link && (
          <Link
            href={data.cta_link}
            className="absolute bottom-3 right-3 md:bottom-5 md:right-5 inline-flex items-center gap-1.5 h-9 md:h-10 px-4 md:px-5 text-[12px] md:text-[12.5px] font-bold rounded-full transition-colors hover:opacity-90 backdrop-blur-sm"
            style={{ background: 'rgba(15,23,42,0.92)', color: '#FFFFFF' }}
          >
            <span style={{ color: '#FFFFFF' }}>{data.cta_text}</span>
            <ArrowRight size={13} strokeWidth={2.4} style={{ color: '#FFFFFF' }} />
          </Link>
        )}
      </div>
    </section>
  );
}
