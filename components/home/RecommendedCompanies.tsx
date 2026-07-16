'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Star, HelpCircle } from 'lucide-react';
import CompanyCard from './CompanyCard';
import type { DBPremiumBuyer } from '@/lib/types';

const MAX_POOL = 40; // 추천 풀: 우선순위 상위 40개
const SHOW = 20;     // 하루에 노출할 개수

// KST(UTC+9) 기준 '오늘 날짜' 시드 — 매일 밤 12시(한국시각)에 값이 바뀜
function kstDateSeed(): number {
  const kst = new Date(Date.now() + 9 * 3600 * 1000);
  const s = `${kst.getUTCFullYear()}-${kst.getUTCMonth() + 1}-${kst.getUTCDate()}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// 결정적 난수 (같은 시드 → 같은 순서)
function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(arr: T[], rand: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface Props {
  buyers: DBPremiumBuyer[];
  loading?: boolean;
}

/**
 * 오늘의 추천 업체 — 우선순위(priority) 상위 40개를 풀로 하여,
 * 매일 밤 12시(KST) 기준으로 랜덤 20개를 골라 노출한다.
 * 하루 동안은 순서가 고정(모든 방문자 동일), 자정에 교체.
 * 카드 크기/레이아웃은 메인광고와 동일(CompanyCard 공용).
 */
export default function RecommendedCompanies({ buyers, loading }: Props) {
  // buyers는 priority DESC 정렬 상태(getPremiumBuyers). 상위 40개가 풀.
  const pool = useMemo(() => buyers.slice(0, MAX_POOL), [buyers]);

  // 날짜 시드는 마운트 후 설정 (SSR 하이드레이션 안전)
  const [seed, setSeed] = useState<number | null>(null);
  useEffect(() => { setSeed(kstDateSeed()); }, []);

  const recommended = useMemo(() => {
    if (seed === null) return pool.slice(0, SHOW);
    return seededShuffle(pool, mulberry32(seed)).slice(0, SHOW);
  }, [pool, seed]);

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

      <div className="grid grid-cols-2 min-[520px]:grid-cols-3 md:grid-cols-3 gap-3">
        {recommended.map((b) => (
          <CompanyCard key={b.id} company={b} />
        ))}
      </div>
    </section>
  );
}
