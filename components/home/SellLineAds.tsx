'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import type { DBPost, DBUser } from '@/lib/types';
import { getPosts } from '@/lib/api';
import { getCache, setCache } from '@/lib/cache';
import SellLineRow from './SellLineRow';

const PAGE_SIZE = 10;
const PAGE_PARAM = 'sp'; // 줄광고 페이지 번호를 URL 쿼리로 → 글 보고 돌아와도 보던 페이지 복원

type SellPost = DBPost & { author?: DBUser };

export default function SellLineAds() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get(PAGE_PARAM)) || 1);
  const goPage = (n: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (n <= 1) params.delete(PAGE_PARAM); else params.set(PAGE_PARAM, String(n));
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : '/', { scroll: false });
  };
  const [posts, setPosts] = useState<SellPost[]>(() => getCache<SellPost[]>('home_sell_posts') ?? []);
  const [loading, setLoading] = useState(() => !getCache('home_sell_posts'));

  useEffect(() => {
    getPosts('sell', { limit: 100, withAuthor: true })
      .then((data) => {
        setPosts(data);
        setCache('home_sell_posts', data, 60000);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // 실제 등록된 판매글만 10개씩 페이지네이션 (등록순: 최신 → 오래된)
  const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const start = (safePage - 1) * PAGE_SIZE;
  const pagePosts = posts.slice(start, start + PAGE_SIZE);

  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[13px] font-bold text-gray-800">팝니다 줄광고</h2>
        <Link href="/advertising" className="inline-flex items-center gap-1 text-[10.5px] text-gray-500 hover:text-accent">
          광고문의 <HelpCircle size={10} />
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-10 text-center text-gray-400 text-[12px]">불러오는 중...</div>
        ) : posts.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-[12px]">
            아직 등록된 팝니다 줄광고가 없습니다.
          </div>
        ) : (
          // PC에서만 2열로 나눠 넓은 화면을 채운다 (모바일은 기존처럼 한 줄씩)
          <div className="lg:grid lg:grid-cols-2 lg:divide-x lg:divide-gray-100">
            {pagePosts.map((post) => (
              <SellLineRow key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      {!loading && totalPages > 1 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => goPage(Math.max(1, safePage - 1))}
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
              onClick={() => goPage(n)}
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
            onClick={() => goPage(Math.min(totalPages, safePage + 1))}
            disabled={safePage === totalPages}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 bg-white text-gray-600 disabled:opacity-40 hover:border-accent hover:text-accent transition-colors"
            aria-label="다음 페이지"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </section>
  );
}
