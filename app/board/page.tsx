'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PenSquare, Tag, ShoppingCart, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import HomeAside from '@/components/layout/HomeAside';
import NationalAds from '@/components/home/NationalAds';
import SellPostItem from '@/components/home/SellPostItem';
import BuyPostCard from '@/components/home/BuyPostCard';
import { getPosts } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { DBPost, DBUser } from '@/lib/types';
import { getCache, setCache } from '@/lib/cache';
import { PostRowSkeleton } from '@/components/Skeleton';

const SELL_PER_PAGE = 15;     // 팝니다 줄광고 페이지당
const BUY_BOX_PER_PAGE = 50;  // 삽니다 박스광고 페이지당
const SELL_INTERLEAVE = 10;   // 박스광고 아래 끼워넣을 판매글 개수

// 지역 탭 — 첫 진입 기본값은 '전국'(전체 표시)
const REGIONS = ['전국', '서울', '경기', '인천', '대전', '대구', '부산', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'] as const;

type PostWithAuthor = DBPost & { author: DBUser };

// 글의 지역 매칭 — region 컬럼 / 태그 / 제목 어디에 있어도 인식
function matchRegion(post: PostWithAuthor, region: string): boolean {
  if (region === '전국') return true;
  if (post.region?.includes(region)) return true;
  if (post.tags?.some((t) => t.includes(region))) return true;
  if (post.title.includes(region)) return true;
  return false;
}

// Fisher-Yates shuffle (in-place 복사 후)
function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function BoardContent() {
  const searchParams = useSearchParams();
  const { isLoggedIn } = useAuth();
  const tabParam = searchParams.get('tab');
  const activeTab: 'buy' | 'sell' = tabParam === 'buy' ? 'buy' : 'sell';

  const [posts, setPosts] = useState<PostWithAuthor[]>(() => getCache<PostWithAuthor[]>(`board_${activeTab}`) ?? []);
  const [otherPosts, setOtherPosts] = useState<PostWithAuthor[]>([]); // 다른 탭(끼워넣기용)
  const [loading, setLoading] = useState(() => !getCache(`board_${activeTab}`));
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  // 지역 필터 — 첫 진입 시 자동 '전국'
  const [selectedRegion, setSelectedRegion] = useState<string>('전국');
  const [buyPublic, setBuyPublic] = useState(true); // 삽니다 연락처 공개 (기본 공개)
  // shuffleSeed: 페이지 진입 / 새로고침 시 새로 생성됨 → 박스광고 매번 다른 순서
  const [shuffleSeed, setShuffleSeed] = useState(0);

  useEffect(() => {
    setShuffleSeed(Math.random());
  }, []);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => setBuyPublic(d.buy_contact_public !== false))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const cached = getCache<PostWithAuthor[]>(`board_${activeTab}`);
    if (cached) { setPosts(cached); setLoading(false); }
    else { setLoading(true); }
    setError(null);
    setPage(1);
    setSelectedRegion('전국'); // 탭 변경 시 지역도 전국으로 초기화
    setShuffleSeed(Math.random()); // 탭 변경 시도 다시 셔플

    Promise.all([
      getPosts(activeTab, { limit: 500 }),
      // 삽니다 탭일 때만 끼워넣을 판매글도 가져옴
      activeTab === 'buy' ? getPosts('sell', { limit: 100 }) : Promise.resolve([]),
    ])
      .then(([data, others]) => {
        setPosts(data); setCache(`board_${activeTab}`, data, 60000);
        setOtherPosts(others);
      })
      .catch((err) => setError(err.message || '데이터를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [activeTab]);

  // 삽니다(buy)는 박스광고 — 새로고침/탭변경마다 랜덤
  const shuffledBuy = useMemo(() => {
    if (activeTab !== 'buy') return posts;
    void shuffleSeed; // 셔플 트리거
    return shuffle(posts);
  }, [posts, activeTab, shuffleSeed]);

  const sellInterleave = useMemo(
    () => otherPosts.filter((p) => matchRegion(p, selectedRegion)).slice(0, SELL_INTERLEAVE),
    [otherPosts, selectedRegion],
  );

  // 지역 필터 적용 (전국이면 전체)
  const baseList = activeTab === 'buy' ? shuffledBuy : posts;
  const list = useMemo(
    () => (selectedRegion === '전국' ? baseList : baseList.filter((p) => matchRegion(p, selectedRegion))),
    [baseList, selectedRegion],
  );

  // 페이지 분할
  const perPage = activeTab === 'buy' ? BUY_BOX_PER_PAGE : SELL_PER_PAGE;
  const totalPages = Math.max(1, Math.ceil(list.length / perPage));
  const pagedPosts = list.slice((page - 1) * perPage, page * perPage);

  const title = activeTab === 'sell' ? '지역별 판매찾기' : '지역별 매입찾기';
  const writeLabel = activeTab === 'sell' ? '판매글 작성' : '구매글 작성';
  const writeType = activeTab;

  return (
    <>
      <NationalAds />

      <div className="container-main py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[18px] font-bold text-gray-800">{title}</h1>
          <div className="breadcrumb">
            <Link href="/">HOME</Link> &gt; {title}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
          <HomeAside />

          <div className="min-w-0">
            {/* 탭 */}
            <div className="bg-white border border-gray-200 rounded-xl mb-4 overflow-hidden">
              <div className="flex border-b border-gray-200">
                <Link href="/board?tab=sell"
                  className={`flex-1 py-3 text-center text-[13px] flex items-center justify-center gap-1.5 transition-colors ${
                    activeTab === 'sell' ? 'font-bold text-accent border-b-2 border-accent bg-accent/5' : 'text-gray-500 hover:text-accent'
                  }`}>
                  <Tag size={13} /> 지역별 판매찾기
                </Link>
                <Link href="/board?tab=buy"
                  className={`flex-1 py-3 text-center text-[13px] flex items-center justify-center gap-1.5 transition-colors ${
                    activeTab === 'buy' ? 'font-bold text-accent border-b-2 border-accent bg-accent/5' : 'text-gray-500 hover:text-accent'
                  }`}>
                  <ShoppingCart size={13} /> 지역별 매입찾기
                </Link>
              </div>

              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50">
                <span className="text-[11.5px] text-gray-600">
                  {activeTab === 'buy'
                    ? `박스광고 — 새로고침마다 순서가 바뀝니다. 50개당 한 묶음`
                    : '최신 등록순 — 최근에 올린 글이 위로'}
                </span>
                {writeType === 'buy' && !isLoggedIn ? (
                  <Link href={`/login?redirect=${encodeURIComponent('/board/write?type=buy')}`}
                    className="inline-flex items-center gap-1 h-8 px-3 bg-accent text-white text-[12px] font-bold rounded-md">
                    <PenSquare size={11} /> 로그인 후 {writeLabel}
                  </Link>
                ) : (
                  <Link href={`/board/write?type=${writeType}`}
                    className="inline-flex items-center gap-1 h-8 px-3 bg-accent text-white text-[12px] font-bold rounded-md hover:bg-blue-700 transition-colors">
                    <PenSquare size={11} /> {writeLabel}
                  </Link>
                )}
              </div>
            </div>

            {/* 지역 탭 — 격자(줄바꿈), 첫 진입 자동 '전국' */}
            <div className="mb-4 bg-white border border-gray-200 rounded-xl p-3">
              <p className="flex items-center gap-1 text-[12.5px] font-bold text-gray-700 mb-2.5">
                <MapPin size={14} className="text-accent" /> 현재 선택지역 : <span className="text-accent">{selectedRegion}</span>
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                {REGIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => { setSelectedRegion(r); setPage(1); }}
                    className={`h-9 text-[12.5px] font-bold rounded-md border transition-colors ${
                      selectedRegion === r
                        ? 'border-accent bg-accent/5 text-accent'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-accent hover:text-accent'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* 본문 */}
            {loading ? (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <PostRowSkeleton count={SELL_PER_PAGE} />
              </div>
            ) : error ? (
              <div className="py-20 text-center text-red-500 text-[13px]">{error}</div>
            ) : list.length === 0 ? (
              <div className="py-20 text-center bg-white border border-dashed border-gray-200 rounded-xl">
                <p className="text-[13px] text-gray-500 mb-2">
                  {selectedRegion === '전국'
                    ? `아직 등록된 ${activeTab === 'sell' ? '판매' : '구매'}글이 없습니다.`
                    : `'${selectedRegion}' 지역에 등록된 ${activeTab === 'sell' ? '판매' : '구매'}글이 없습니다.`}
                </p>
                <Link href={`/board/write?type=${writeType}`} className="text-[12px] text-accent font-bold hover:underline">
                  첫 글 작성하기 →
                </Link>
              </div>
            ) : activeTab === 'buy' ? (
              <>
                {/* 삽니다 — 박스광고 그리드 */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-5">
                  {pagedPosts.map((post) => (
                    <BuyPostCard key={post.id} post={post} publicContact={buyPublic} />
                  ))}
                </div>

                {/* 박스광고 바로 아래 — 판매글(팝니다) 10개 줄광고 */}
                {sellInterleave.length > 0 && (
                  <section className="mb-5">
                    <div className="flex items-end justify-between mb-2 gap-3">
                      <h3 className="text-[14px] font-extrabold text-gray-900 flex items-center gap-1.5">
                        <Tag size={13} className="text-accent" /> 최신 판매글
                        <span className="text-[11px] text-gray-400 font-normal">{sellInterleave.length}건</span>
                      </h3>
                      <Link href="/board?tab=sell" className="text-[11.5px] text-gray-500 hover:text-accent">
                        전체보기 →
                      </Link>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                      {sellInterleave.map((post, idx) => (
                        <SellPostItem key={post.id} post={post} num={idx + 1} />
                      ))}
                    </div>
                  </section>
                )}
              </>
            ) : (
              /* 팝니다 — 줄광고 */
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {pagedPosts.map((post, idx) => (
                  <SellPostItem
                    key={post.id}
                    post={post}
                    num={(page - 1) * SELL_PER_PAGE + idx + 1}
                    showStatus
                  />
                ))}
              </div>
            )}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 px-4 py-4 mt-3 border-t border-gray-100">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded text-gray-500 hover:border-accent hover:text-accent disabled:opacity-30">
                  <ChevronLeft size={13} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 10).map((p) => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 text-[12px] border rounded ${
                      p === page ? 'border-accent bg-accent text-white font-bold' : 'border-gray-200 text-gray-600 hover:border-accent hover:text-accent'
                    }`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded text-gray-500 hover:border-accent hover:text-accent disabled:opacity-30">
                  <ChevronRight size={13} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function BoardPage() {
  return (
    <Suspense fallback={<div className="container-main py-10 text-center text-gray-400 text-[13px]">불러오는 중...</div>}>
      <BoardContent />
    </Suspense>
  );
}
