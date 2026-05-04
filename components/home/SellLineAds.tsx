'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
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

const DEMO: { title: string; author: string; region: string }[] = [
  { title: '24시 비대면 간단서류 당일입금ok', author: '예판상품권 매입팀', region: '서울' },
  { title: '전국 비대면 24시 당일입금', author: '스마트 상품권', region: '경기' },
  { title: '직장인 주부 월변전문 무방문 전문', author: '리얼 상품권', region: '서울' },
  { title: '24시간 무서류 무방문 전국어디든 승인', author: '24시 프라임', region: '부산' },
  { title: '24시 비대면 무서류 승인 당일입금OK', author: '24시 안심매입', region: '경기' },
  { title: '전국 무방문 팩스 월변전문 당일입금가능', author: '한국상품권몰', region: '경기' },
  { title: '36개월 분할상환 연5프로', author: '365 퍼스트', region: '제주' },
  { title: '당일 200까지 안전 거래 무직자 무서류', author: '24시 믿음상품권', region: '경기' },
  { title: '24시 비대면 특급 매입', author: '24시 정안상품권', region: '제주' },
  { title: '전국 24시 연중무휴 당일입금 사업자우대', author: '페어프라임', region: '서울' },
  { title: '자동차담보거래 당일거래 높은승인율 정식등록', author: '365 프라임', region: '대구' },
  { title: '신속 당일입금 비대면 매입 친절 상담', author: '24시 서민안심', region: '인천' },
  { title: '간편한 비대면 월매출 분할결제 OK', author: '미소지움', region: '광주' },
  { title: '소액부터 1000만원까지 당일 송금', author: '뉴스타트', region: '대전' },
  { title: '24시 ARS 매입 신용조회 X', author: '365 더퍼스트', region: '울산' },
];

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

  // 실 데이터 + 데모 채움 (1페이지에서 10개 미만일 때만)
  const realCount = posts.length;
  const totalReal = Math.max(realCount, PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(totalReal / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const start = (safePage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pagePosts = posts.slice(start, end);
  const fillCount = Math.max(0, PAGE_SIZE - pagePosts.length);
  const fillStart = Math.max(0, start - realCount);
  const fillItems = DEMO.slice(fillStart, fillStart + fillCount);

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
        ) : (
          <>
            {pagePosts.map((post, i) => {
              const isNew = Date.now() - new Date(post.created_at).getTime() < 3 * 86400000;
              return (
                <div key={post.id}>
                  {i > 0 && <div className="mx-4 h-px bg-gray-200" />}
                  <Link
                    href={`/board/${post.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13.5px] text-gray-800 truncate">{post.title}</span>
                        {isNew && (
                          <span className="shrink-0 text-[9px] font-black text-white bg-orange-500 px-1 py-px rounded-sm">N</span>
                        )}
                      </div>
                      <p className="text-[11.5px] text-orange-500 mt-0.5 truncate">
                        <span className="font-medium">{post.author?.name ?? '판매자'}</span>
                        <span className="text-orange-300 mx-1.5">|</span>
                        <span>{extractRegion(post)}</span>
                      </p>
                    </div>
                    <ChevronRight size={14} className="shrink-0 text-gray-300" />
                  </Link>
                </div>
              );
            })}
            {fillItems.map((item, i) => (
              <div key={`demo-${safePage}-${i}`}>
                {(pagePosts.length + i) > 0 && <div className="mx-4 h-px bg-gray-200" />}
                <Link
                  href="/board?tab=sell"
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13.5px] text-gray-800 truncate">{item.title}</span>
                      <span className="shrink-0 text-[9px] font-black text-white bg-orange-500 px-1 py-px rounded-sm">N</span>
                    </div>
                    <p className="text-[11.5px] text-orange-500 mt-0.5 truncate">
                      <span className="font-medium">{item.author}</span>
                      <span className="text-orange-300 mx-1.5">|</span>
                      <span>{item.region}</span>
                    </p>
                  </div>
                  <ChevronRight size={14} className="shrink-0 text-gray-300" />
                </Link>
              </div>
            ))}
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
