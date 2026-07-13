'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, HelpCircle, CheckCircle } from 'lucide-react';
import type { DBPost, DBUser } from '@/lib/types';
import { getPosts } from '@/lib/api';
import { getCache, setCache } from '@/lib/cache';

const PAGE_SIZE = 10;
const REGION_RE = /서울|경기|부산|대구|광주|인천|대전|울산|제주|강원|충남|충북|전남|전북|경남|경북|세종/;

type SellPost = DBPost & { author?: DBUser };

function extractRegion(post: SellPost): string {
  const fromTag = post.tags?.find((t) => REGION_RE.test(t));
  if (fromTag) {
    const m = fromTag.match(REGION_RE);
    if (m) return m[0];
  }
  const m = post.title.match(REGION_RE);
  if (m) return m[0];
  return '전국';
}

export default function SellLineAds() {
  const [page, setPage] = useState(1);
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
          <>
            {pagePosts.map((post, i) => {
              const isNew = Date.now() - new Date(post.created_at).getTime() < 3 * 86400000;
              const isCompleted = !!post.completed_at;
              return (
                <div key={post.id}>
                  {i > 0 && <div className="mx-4 h-px bg-gray-200" />}
                  <Link
                    href={`/board/${post.id}`}
                    className={`flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors ${isCompleted ? 'opacity-55 bg-gray-50/40' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13.5px] text-gray-800 truncate">{post.title}</span>
                        {isNew && !isCompleted && (
                          <span className="shrink-0 text-[9px] font-black text-white bg-orange-500 px-1 py-px rounded-sm">N</span>
                        )}
                      </div>
                      <p className="text-[11.5px] text-orange-500 mt-0.5 truncate">
                        <span className="font-medium">{post.author?.name ?? '판매자'}</span>
                        <span className="text-orange-300 mx-1.5">|</span>
                        <span>{extractRegion(post)}</span>
                      </p>
                    </div>
                    {/* 판매율 */}
                    {post.percentage != null && (
                      <span className="shrink-0 whitespace-nowrap text-accent leading-none">
                        <span className="text-[10.5px] font-medium text-gray-400">판매율 </span>
                        <span className="text-[15px] font-extrabold tabular-nums">{post.percentage}<span className="text-[11px]">%</span></span>
                      </span>
                    )}
                    {/* 거래완료 배지 — 맨 오른쪽 */}
                    {isCompleted ? (
                      <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full bg-zinc-700 text-white">
                        <CheckCircle size={11} strokeWidth={3} /> 거래완료
                      </span>
                    ) : (
                      <ChevronRight size={14} className="shrink-0 text-gray-300" />
                    )}
                  </Link>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* 페이지네이션 */}
      {!loading && totalPages > 1 && (
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
    </section>
  );
}
