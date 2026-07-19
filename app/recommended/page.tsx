'use client';

import Link from 'next/link';
import { MapPin, Crown } from 'lucide-react';
import AdSection from '@/components/home/AdSection';

/**
 * 오늘의 추천업체 — 판매찾기처럼 상단에 전국광고를 고정하고,
 * 그 아래 추천업체 광고(삽니다 글)를 박스카드로 노출한다.
 * (예전 사이드바 줄광고형 추천업체 목록은 제거)
 */
export default function RecommendedPage() {
  return (
    <>
      {/* 상단 고정 전국광고 (판매/매입찾기와 동일) */}
      <div className="container-main pt-4">
        <AdSection adType="national" title="전국 광고" icon={<MapPin size={15} className="text-accent" />} perPage={50} />
      </div>

      <div className="container-main py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[18px] font-bold text-gray-800">오늘의 추천업체</h1>
          <div className="breadcrumb">
            <Link href="/">HOME</Link> &gt; 오늘의 추천업체
          </div>
        </div>

        <AdSection
          adType="recommend"
          title="추천 업체"
          icon={<Crown size={15} className="text-accent" />}
          perPage={50}
          shuffle
          emptyText="추천 업체 모집중입니다."
        />
      </div>
    </>
  );
}
