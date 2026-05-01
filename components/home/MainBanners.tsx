'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { DBMainBanner } from '@/lib/types';
import { getMainBanners } from '@/lib/api';

/**
 * 최상단 광고 배너 — 3 × 2 슬롯 (총 6개)
 * 운영자가 직접 등록. 만료된 슬롯은 placeholder.
 */
export default function MainBanners() {
  const [banners, setBanners] = useState<Record<number, DBMainBanner>>({});

  useEffect(() => {
    getMainBanners()
      .then((items) => {
        const map: Record<number, DBMainBanner> = {};
        // 같은 position에 여러 개 있으면 가장 최신만 사용
        items.forEach((b) => {
          if (!map[b.position] || new Date(b.created_at) > new Date(map[b.position].created_at)) {
            map[b.position] = b;
          }
        });
        setBanners(map);
      })
      .catch(() => { /* 무시: 빈 배너 */ });
  }, []);

  return (
    <section className="container-main pt-4">
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6].map((pos) => {
          const b = banners[pos];
          if (!b) {
            return (
              <div
                key={pos}
                className="aspect-[4/1] bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center text-[11px] text-gray-300"
              >
                광고 모집중
              </div>
            );
          }
          const inner = (
            <div
              className="aspect-[4/1] flex items-center justify-center px-3 text-white relative overflow-hidden hover:opacity-90 transition-opacity"
              style={{ background: b.bg_color || '#1E40AF' }}
            >
              {b.image_url && (
                <Image
                  src={b.image_url}
                  alt={b.title}
                  fill
                  sizes="(max-width:768px) 33vw, 400px"
                  className="object-cover"
                />
              )}
              <div className="relative text-center z-10">
                <p className="text-[13px] font-bold truncate">{b.title}</p>
                {b.subtitle && <p className="text-[10px] opacity-80 truncate mt-0.5">{b.subtitle}</p>}
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
