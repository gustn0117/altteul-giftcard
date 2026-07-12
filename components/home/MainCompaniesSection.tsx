'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import CompanyCard from './CompanyCard';
import type { DBPremiumBuyer } from '@/lib/types';

const PAGE_SIZE = 50;

// Fisher-Yates shuffle (원본 배열 보존을 위해 복사 후)
function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface Props {
  buyers: DBPremiumBuyer[];
  loading?: boolean;
  /** 옆에 다른 위젯과 함께 배치될 때 그리드 변형 (호환용) */
  compact?: boolean;
}

export default function MainCompaniesSection({ buyers, loading }: Props) {
  const [page, setPage] = useState(1);
  // seed는 마운트(접속/새로고침)마다 새로 생성 → 순서 랜덤
  const [seed, setSeed] = useState(0);

  useEffect(() => {
    setSeed(Math.random());
  }, []);

  // 접속/새로고침마다 랜덤 순서. buyers 원본은 건드리지 않음(추천 섹션과 공유)
  const shuffled = useMemo(() => {
    void seed; // 셔플 트리거
    return shuffle(buyers);
  }, [buyers, seed]);

  const totalPages = Math.max(1, Math.ceil(shuffled.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageBuyers = shuffled.slice(start, start + PAGE_SIZE);

  return (
    <section>
      {/* Header — 컴팩트 */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[13px] font-bold text-gray-800">메인 광고</h2>
        <Link href="/advertising" className="inline-flex items-center gap-1 text-[10.5px] text-gray-500 hover:text-accent">
          광고문의 <HelpCircle size={10} />
        </Link>
      </div>

      {loading ? (
        <div className="py-10 text-center text-gray-400 text-[12px]">불러오는 중...</div>
      ) : shuffled.length === 0 ? (
        <div className="py-10 text-center bg-white border border-dashed border-gray-200 rounded-xl text-[12px] text-gray-400">
          아직 등록된 광고 업체가 없습니다.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {pageBuyers.map((b) => (
              <CompanyCard key={b.id} company={b} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 bg-white text-gray-600 disabled:opacity-40 hover:border-accent hover:text-accent transition-colors"
                aria-label="이전 페이지"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={`min-w-8 h-8 px-2 rounded-md border text-[12px] font-bold transition-colors ${
                    n === safePage
                      ? 'border-accent bg-accent text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-accent hover:text-accent'
                  }`}
                  style={n === safePage ? { color: '#FFFFFF' } : undefined}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 bg-white text-gray-600 disabled:opacity-40 hover:border-accent hover:text-accent transition-colors"
                aria-label="다음 페이지"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
