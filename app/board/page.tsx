'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PenSquare, Tag, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import SellPostItem from '@/components/home/SellPostItem';
import LeftSidebar from '@/components/layout/LeftSidebar';
import RightSidebar from '@/components/layout/RightSidebar';
import PremiumBuyerCard from '@/components/home/PremiumBuyerCard';
import { getPosts, getPremiumBuyers } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { DBPost, DBUser, DBPremiumBuyer } from '@/lib/types';
import { getCache, setCache } from '@/lib/cache';
import { PostRowSkeleton } from '@/components/Skeleton';

const PER_PAGE = 15;
type PostWithAuthor = DBPost & { author: DBUser };

function BoardContent() {
  const searchParams = useSearchParams();
  const { isLoggedIn } = useAuth();
  const tabParam = searchParams.get('tab');
  const activeTab: 'buy' | 'sell' = tabParam === 'buy' ? 'buy' : 'sell';
  const [posts, setPosts] = useState<PostWithAuthor[]>(() => getCache<PostWithAuthor[]>(`board_${activeTab}`) ?? []);
  const [buyers, setBuyers] = useState<DBPremiumBuyer[]>(() => getCache<DBPremiumBuyer[]>('home_buyers') ?? []);
  const [loading, setLoading] = useState(() => !getCache(`board_${activeTab}`));
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    getPremiumBuyers().then((data) => { setBuyers(data); setCache('home_buyers', data, 120000); }).catch(() => {});
  }, []);

  useEffect(() => {
    const cached = getCache<PostWithAuthor[]>(`board_${activeTab}`);
    if (cached) { setPosts(cached); setLoading(false); }
    else { setLoading(true); }
    setError(null);
    setPage(1);
    getPosts(activeTab)
      .then((data) => { setPosts(data); setCache(`board_${activeTab}`, data, 60000); })
      .catch((err) => setError(err.message || '데이터를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [activeTab]);

  const totalPages = Math.max(1, Math.ceil(posts.length / PER_PAGE));
  const pagedPosts = posts.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const title = activeTab === 'sell' ? '상품권 팝니다' : '상품권 삽니다';
  const Icon = activeTab === 'sell' ? Tag : ShoppingCart;
  const writeLabel = activeTab === 'sell' ? '판매글 작성' : '구매글 작성';
  const writeType = activeTab;

  return (
    <div className="container-main py-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[18px] font-bold text-gray-800">{title}</h1>
        <div className="breadcrumb">
          <Link href="/">HOME</Link> &gt; {title}
        </div>
      </div>

      <div className="flex gap-4">
        <LeftSidebar />

        <div className="flex-1 min-w-0">
          {/* Tabs */}
          <div className="bg-white border border-gray-200 mb-4">
            <div className="flex border-b border-gray-200">
              <Link
                href="/board?tab=sell"
                className={`flex-1 py-3 text-center text-[13px] transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'sell'
                    ? 'font-bold text-accent border-b-2 border-accent bg-accent/5'
                    : 'text-gray-500 hover:text-accent'
                }`}
              >
                <Tag size={13} /> 상품권 팝니다
              </Link>
              <Link
                href="/board?tab=buy"
                className={`flex-1 py-3 text-center text-[13px] transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'buy'
                    ? 'font-bold text-accent border-b-2 border-accent bg-accent/5'
                    : 'text-gray-500 hover:text-accent'
                }`}
              >
                <ShoppingCart size={13} /> 상품권 삽니다
              </Link>
            </div>

            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <p className="text-[12px] text-gray-600 flex items-center gap-1.5">
                <Icon size={12} className="text-accent" />
                {activeTab === 'sell'
                  ? '내가 판매할 상품권을 등록하거나 다른 사람의 판매글을 확인할 수 있어요.'
                  : '원하는 상품권을 매입 요청하거나 다른 사람의 구매 요청을 확인할 수 있어요.'}
              </p>
              <span className="text-[11px] text-gray-500 shrink-0 ml-3">
                총 <span className="text-accent font-bold">{posts.length}</span>건
              </span>
            </div>

            {/* Header row + write */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200">
              <div className="text-[11px] text-gray-500">
                최신순 정렬
                {writeType === 'buy' && !isLoggedIn && (
                  <span className="ml-2 text-accent">· 구매글 작성은 로그인이 필요합니다</span>
                )}
              </div>
              {writeType === 'buy' && !isLoggedIn ? (
                <Link
                  href={`/login?redirect=${encodeURIComponent('/board/write?type=buy')}`}
                  className="btn-accent h-8 px-3 text-[12px]"
                >
                  <PenSquare size={12} /> 로그인 후 {writeLabel}
                </Link>
              ) : (
                <Link href={`/board/write?type=${writeType}`} className="btn-accent h-8 px-3 text-[12px]">
                  <PenSquare size={12} /> {writeLabel}
                </Link>
              )}
            </div>

            {/* List */}
            {loading ? (
              <div className="bg-white border border-gray-200 overflow-hidden"><PostRowSkeleton count={PER_PAGE} /></div>
            ) : error ? (
              <div className="py-20 text-center text-red-500 text-[13px]">{error}</div>
            ) : posts.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-[13px] text-gray-500 mb-2">
                  아직 등록된 {activeTab === 'sell' ? '판매' : '구매'}글이 없습니다.
                </p>
                <Link href={`/board/write?type=${writeType}`} className="text-[12px] text-accent font-bold hover:underline">
                  첫 글 작성하기 →
                </Link>
              </div>
            ) : (
              <>
                {/* Table header (desktop) */}
                <div className="hidden md:flex items-center py-2 px-4 bg-gray-50 border-b border-gray-100 text-[11px] text-gray-500">
                  <span className="w-8 text-center shrink-0">번호</span>
                  <span className="ml-2 w-14 shrink-0">브랜드</span>
                  <span className="ml-2 flex-1">제목</span>
                  <span className="ml-auto w-32 text-right">할인 / 가격</span>
                  <span className="hidden lg:block ml-3 w-20 text-right">작성자</span>
                  <span className="hidden lg:block ml-3 w-24 text-right">날짜</span>
                </div>

                {pagedPosts.map((post, idx) => (
                  <SellPostItem
                    key={post.id}
                    post={post}
                    num={(page - 1) * PER_PAGE + idx + 1}
                    showStatus={activeTab === 'sell'}
                  />
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1 px-4 py-4 border-t border-gray-100">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="w-7 h-7 flex items-center justify-center border border-gray-200 text-gray-500 hover:border-accent hover:text-accent disabled:opacity-30"
                    >
                      <ChevronLeft size={12} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 10).map(p => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-7 h-7 text-[12px] border ${
                          p === page ? 'border-accent bg-accent text-white font-bold' : 'border-gray-200 text-gray-600 hover:border-accent hover:text-accent'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="w-7 h-7 flex items-center justify-center border border-gray-200 text-gray-500 hover:border-accent hover:text-accent disabled:opacity-30"
                    >
                      <ChevronRight size={12} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 매입업체 (buy 탭에서만 하단 노출) */}
          {activeTab === 'buy' && buyers.length > 0 && (
            <section className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[15px] font-bold text-gray-800">추천 매입 업체</h2>
                <Link href="/recommended" className="text-[11px] text-gray-500 hover:text-accent flex items-center gap-0.5">
                  전체 업체 보기 <ChevronRight size={11} />
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {buyers.slice(0, 4).map(b => <PremiumBuyerCard key={b.id} {...b} />)}
              </div>
            </section>
          )}
        </div>

        <RightSidebar />
      </div>
    </div>
  );
}

export default function BoardPage() {
  return (
    <Suspense fallback={<div className="container-main py-10 text-center text-gray-400 text-[13px]">불러오는 중...</div>}>
      <BoardContent />
    </Suspense>
  );
}
