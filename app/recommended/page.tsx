'use client';
import HomeAside from '@/components/layout/HomeAside';

import Link from 'next/link';
import { Sparkles, Crown } from 'lucide-react';
import AdSection from '@/components/home/AdSection';

/**
 * 오늘의 추천업체 — 홈 추천업체칸과 동일한 데이터/카드.
 * 예전엔 관리자가 따로 등록하는 premium_buyers(등급별 3단 그룹)를 썼는데,
 * 광고를 삽니다 글로 통일하면서 그 테이블이 비어 이 페이지가 항상 텅 비어 있었다.
 * 추천업체칸에는 전국광고도 함께 노출된다.
 */
export default function RecommendedPage() {
  return (
    <div className="container-main py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[18px] font-bold text-gray-800">오늘의 추천업체</h1>
        <div className="breadcrumb">
          <Link href="/">HOME</Link> &gt; 오늘의 추천업체
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <HomeAside />

        <div className="flex-1 min-w-0">
          <div className="mb-5 p-5 bg-gradient-to-r from-accent to-accent-light text-white">
            <div className="flex items-center gap-3">
              <Sparkles size={22} className="shrink-0" />
              <div>
                <p className="text-[16px] font-bold">오늘의 추천업체</p>
                <p className="text-[12px] opacity-90">추천업체 광고와 전국광고를 함께 소개합니다</p>
              </div>
            </div>
          </div>

          <AdSection
            adType={['recommend', 'national']}
            title="추천 업체"
            icon={<Crown size={15} className="text-accent" />}
            perPage={50}
            shuffle
            emptyText="추천 업체 모집중입니다."
          />
        </div>
      </div>
    </div>
  );
}
