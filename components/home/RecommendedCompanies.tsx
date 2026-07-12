'use client';

import Link from 'next/link';
import { Star, HelpCircle } from 'lucide-react';
import CompanyCard from './CompanyCard';
import type { DBPremiumBuyer } from '@/lib/types';

const MAX_SLOTS = 20;

interface Props {
  buyers: DBPremiumBuyer[];
  loading?: boolean;
}

/**
 * 오늘의 추천 업체 — 우선순위(priority) 상위 최대 20개.
 * 빈 칸을 미리 만들지 않고, 관리자가 승인/등록한 업체만 노출된다.
 * 카드 크기/레이아웃은 메인광고와 동일(CompanyCard 공용).
 */
export default function RecommendedCompanies({ buyers, loading }: Props) {
  // buyers는 이미 priority DESC 정렬 상태(getPremiumBuyers). 상위 20개만.
  const recommended = buyers.slice(0, MAX_SLOTS);

  // 로딩 중이거나 추천 업체가 하나도 없으면 섹션 자체를 숨김
  if (loading) {
    return (
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[13px] font-bold text-gray-800 flex items-center gap-1">
            <Star size={13} className="text-amber-400 fill-amber-400" /> 오늘의 추천 업체
          </h2>
        </div>
        <div className="py-10 text-center text-gray-400 text-[12px]">불러오는 중...</div>
      </section>
    );
  }

  if (recommended.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[13px] font-bold text-gray-800 flex items-center gap-1">
          <Star size={13} className="text-amber-400 fill-amber-400" /> 오늘의 추천 업체
        </h2>
        <Link href="/recommended" className="inline-flex items-center gap-1 text-[10.5px] text-gray-500 hover:text-accent">
          전체보기 <HelpCircle size={10} />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {recommended.map((b) => (
          <CompanyCard key={b.id} company={b} />
        ))}
      </div>
    </section>
  );
}
