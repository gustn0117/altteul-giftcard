'use client';

import { Crown } from 'lucide-react';
import CompanyCard from './CompanyCard';
import type { DBPremiumBuyer } from '@/lib/types';

interface Props {
  buyers: DBPremiumBuyer[];
  loading?: boolean;
}

/**
 * 이달의 Best 업체 — 관리자가 'BEST'로 지정한 업체만 노출.
 * 카드 크기/레이아웃은 메인광고와 동일(CompanyCard 공용).
 */
export default function BestCompanies({ buyers, loading }: Props) {
  const best = buyers.filter((b) => b.is_best);

  if (loading || best.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[13px] font-bold text-gray-800 flex items-center gap-1">
          <Crown size={14} className="text-amber-500 fill-amber-400" /> 이달의 Best 업체
        </h2>
      </div>
      <div className="grid grid-cols-2 min-[520px]:grid-cols-3 md:grid-cols-3 gap-3">
        {best.map((b) => (
          <CompanyCard key={b.id} company={b} />
        ))}
      </div>
    </section>
  );
}
