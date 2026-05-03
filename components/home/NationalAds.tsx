'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { DBMainBanner } from '@/lib/types';
import { getMainBanners } from '@/lib/api';

/**
 * 전국 광고 슬롯 — 2 × 2 = 총 4개 (메인/팝니다/삽니다 등 모든 페이지 최상단 고정)
 * main_banners 테이블의 position 1~4를 사용 (5,6 슬롯은 폐지)
 */
export default function NationalAds() {
  const [banners, setBanners] = useState<Record<number, DBMainBanner>>({});

  useEffect(() => {
    getMainBanners()
      .then((items) => {
        const map: Record<number, DBMainBanner> = {};
        items.forEach((b) => {
          if (b.position < 1 || b.position > 4) return;
          if (!map[b.position] || new Date(b.created_at) > new Date(map[b.position].created_at)) {
            map[b.position] = b;
          }
        });
        setBanners(map);
      })
      .catch(() => {});
  }, []);

  return (
    <section className="container-main pt-4">
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((pos) => {
          const b = banners[pos];
          if (!b) {
            return (
              <div
                key={pos}
                className="aspect-[3/1] border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-[12px] text-gray-400 rounded-lg"
              >
                전국광고 모집중 ({pos}/4)
              </div>
            );
          }
          const inner = (
            <div
              className="relative aspect-[3/1] flex items-center justify-center px-4 text-white overflow-hidden border-2 border-gray-900 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              style={{ background: b.bg_color || '#1E3A8A' }}
            >
              {b.image_url && (
                <Image
                  src={b.image_url}
                  alt={b.title}
                  fill
                  sizes="(max-width:768px) 50vw, 600px"
                  className="object-cover"
                />
              )}
              <div className="relative text-center z-10">
                <p className="text-[15px] md:text-[17px] font-extrabold drop-shadow-md">{b.title}</p>
                {b.subtitle && (
                  <p className="text-[11px] md:text-[12px] opacity-90 mt-1 drop-shadow">{b.subtitle}</p>
                )}
              </div>
            </div>
          );
          return b.link_url ? (
            <Link key={pos} href={b.link_url} className="block">{inner}</Link>
          ) : (
            <div key={pos}>{inner}</div>
          );
        })}
      </div>
    </section>
  );
}
