'use client';

import { useEffect, useState } from 'react';
import NationalAds from '@/components/home/NationalAds';
import HomeAside from '@/components/layout/HomeAside';
import BuyerFinder from '@/components/home/BuyerFinder';
import { getPosts, getPremiumBuyers } from '@/lib/api';
import type { DBPost, DBUser, DBPremiumBuyer } from '@/lib/types';
import { getCache, setCache } from '@/lib/cache';

type PostWithAuthor = DBPost & { author: DBUser };

export default function Home() {
  const [, setSellPosts] = useState<PostWithAuthor[]>(() => getCache<PostWithAuthor[]>('home_sell') ?? []);
  const [, setBuyPosts] = useState<PostWithAuthor[]>(() => getCache<PostWithAuthor[]>('home_buy') ?? []);
  const [, setBuyers] = useState<DBPremiumBuyer[]>(() => getCache<DBPremiumBuyer[]>('home_buyers') ?? []);

  useEffect(() => {
    Promise.allSettled([
      getPosts('sell', { limit: 30 }),
      getPosts('buy', { limit: 30 }),
      getPremiumBuyers(),
    ]).then(([s, b, pb]) => {
      if (s.status === 'fulfilled') { setSellPosts(s.value); setCache('home_sell', s.value, 60000); }
      if (b.status === 'fulfilled') { setBuyPosts(b.value); setCache('home_buy', b.value, 60000); }
      if (pb.status === 'fulfilled') { setBuyers(pb.value); setCache('home_buyers', pb.value, 120000); }
    });
  }, []);

  return (
    <div className="bg-gradient-to-b from-gray-50/50 to-white min-h-[calc(100vh-200px)]">
      {/* 전국 광고 4개 (2x2) — 항상 최상단 */}
      <NationalAds />

      <div className="container-main py-6">
        {/* 좌측 사이드 + 메인 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
          <HomeAside />
          <div className="space-y-5 min-w-0">
            <BuyerFinder />
            {/*
              판매글/구매글/매입업체/사이트메뉴 섹션 삭제됨
              팝니다·삽니다 글은 헤더 nav의 "지역별 판매찾기 / 지역별 매입찾기"에서 노출
              추천업체는 "오늘의 추천업체"에서 노출
            */}
          </div>
        </div>
      </div>
    </div>
  );
}
