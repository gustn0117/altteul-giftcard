'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, PenSquare } from 'lucide-react';
import BuyPostCard from './BuyPostCard';
import { getAdPosts } from '@/lib/api';
import { getCache, setCache } from '@/lib/cache';
import type { DBPost, DBUser, AdType } from '@/lib/types';

type Post = DBPost & { author?: DBUser };

interface AdSectionProps {
  /** 조회할 광고 종류 (배열이면 합쳐서 노출 — 추천업체칸은 recommend + national) */
  adType: AdType | AdType[];
  title: string;
  /** 아이콘 색 등 제목 옆 강조 */
  icon?: React.ReactNode;
  /** 한 칸(페이지)당 카드 수 */
  perPage?: number;
  /** 매 진입마다 순서 셔플 */
  shuffle?: boolean;
  emptyText?: string;
  /** 지정하면 페이지 번호를 이 이름의 URL 쿼리로 관리 → 글 보고 돌아와도 보던 페이지 복원 */
  pageParam?: string;
}

function shuffleArr<T>(arr: T[]): T[] {
  const c = [...arr];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

/**
 * 홈 광고칸 공용 컴포넌트 — 전국광고 / 메인광고 / 추천업체가 모두 이걸 쓴다.
 * 세 칸의 카드 크기·간격·내용이 반드시 같아야 한다는 요구사항 때문에 컴포넌트를 하나로 통일했다.
 * 데이터는 전부 '관리자 승인된 삽니다(buy) 글'.
 */
export default function AdSection({ adType, title, icon, perPage = 50, shuffle = false, emptyText, pageParam }: AdSectionProps) {
  const types = useMemo(() => (Array.isArray(adType) ? adType : [adType]), [adType]);
  const cacheKey = `ads_${types.join('_')}`;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [posts, setPosts] = useState<Post[]>(() => getCache<Post[]>(cacheKey) ?? []);
  const [loading, setLoading] = useState(() => !getCache(cacheKey));
  const [localPage, setLocalPage] = useState(1);
  // pageParam 이 있으면 URL 쿼리로, 없으면 로컬 state 로 페이지 관리
  const page = pageParam ? Math.max(1, Number(searchParams.get(pageParam)) || 1) : localPage;
  const setPage = (n: number) => {
    if (!pageParam) { setLocalPage(n); return; }
    const params = new URLSearchParams(searchParams.toString());
    if (n <= 1) params.delete(pageParam); else params.set(pageParam, String(n));
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  const [seed, setSeed] = useState(0);
  // 관리자의 '삽니다 연락처 공개' 설정 — 게시판만 지키고 홈은 무시하면 설정이 무력화된다
  const [publicContact, setPublicContact] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => setPublicContact(d.buy_contact_public !== false))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setSeed(Math.random());
    getAdPosts(types, 500)
      .then((d) => {
        setPosts(d as Post[]);
        setCache(cacheKey, d, 60000);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // types는 문자열 배열이라 join으로 안정적인 의존성 생성
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  const list = useMemo(() => {
    if (!shuffle) return posts;
    void seed;
    return shuffleArr(posts);
  }, [posts, shuffle, seed]);

  const totalPages = Math.max(1, Math.ceil(list.length / perPage));
  const paged = list.slice((page - 1) * perPage, page * perPage);

  if (loading) {
    return (
      <section className="mb-5">
        <h2 className="flex items-center gap-1.5 text-[15px] font-bold text-gray-800 mb-3">{icon}{title}</h2>
        <div className="grid grid-cols-2 min-[520px]:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-56 bg-gray-100 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-1.5 text-[15px] font-bold text-gray-800">
          {icon}{title}
          {list.length > 0 && <span className="text-[12px] font-normal text-gray-400">({list.length})</span>}
        </h2>
        <Link href="/board?tab=buy" className="text-[11.5px] text-gray-500 hover:text-accent">더보기 →</Link>
      </div>

      {list.length === 0 ? (
        <div className="py-10 text-center bg-white border border-dashed border-gray-200">
          <p className="text-[13px] text-gray-500 mb-2">{emptyText ?? `${title} 모집중입니다.`}</p>
          <Link href="/board/write?type=buy" className="inline-flex items-center gap-1 text-[12px] text-accent font-bold hover:underline">
            <PenSquare size={11} /> 광고 신청하기 →
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 min-[520px]:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {paged.map((p) => (
              <BuyPostCard key={p.id} post={p} publicContact={publicContact} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-1 mt-4">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                className="shrink-0 w-8 h-8 flex items-center justify-center border border-gray-200 text-gray-500 hover:border-accent hover:text-accent disabled:opacity-30">
                <ChevronLeft size={13} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 10).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={`shrink-0 w-8 h-8 text-[12px] border ${p === page ? 'border-accent bg-accent text-white font-bold' : 'border-gray-200 text-gray-600 hover:border-accent hover:text-accent'}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                className="shrink-0 w-8 h-8 flex items-center justify-center border border-gray-200 text-gray-500 hover:border-accent hover:text-accent disabled:opacity-30">
                <ChevronRight size={13} />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
