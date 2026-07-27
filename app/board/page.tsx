'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PenSquare, Tag, ShoppingCart, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import HomeAside from '@/components/layout/HomeAside';
import RecommendRail from '@/components/home/RecommendRail';
import AdSection from '@/components/home/AdSection';
import RegionSelector from '@/components/home/RegionSelector';
import SellLineTable from '@/components/home/SellLineTable';
import BuyPostCard from '@/components/home/BuyPostCard';
import { getPosts } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { DBPost, DBUser } from '@/lib/types';
import { getCache, setCache } from '@/lib/cache';
import { PostRowSkeleton } from '@/components/Skeleton';

// 팝니다 줄광고 페이지당 — PC는 2열이라 한 열에 15줄씩 = 한 페이지 30개.
// 반드시 짝수여야 2열이 딱 떨어진다(홀수면 마지막 줄이 반만 참).
const SELL_PER_PAGE = 30;
const BUY_BOX_PER_PAGE = 50;  // 삽니다 박스광고 페이지당

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

  // 페이지·지역을 URL 쿼리로 관리 → 글 보고 뒤로가면 보던 페이지/지역 그대로 복원됨
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const selectedRegion = searchParams.get('region') || '전국';
  const setQuery = (next: { page?: number; region?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next.region !== undefined) {
      if (next.region === '전국') params.delete('region'); else params.set('region', next.region);
    }
    if (next.page !== undefined) {
      if (next.page <= 1) params.delete('page'); else params.set('page', String(next.page));
    }
    // Next 16에서는 router.push 로 '같은 경로에 파라미터를 추가'하면 무시돼서 지역/페이지가 안 먹었다.
    // 공식 문서의 Native History API 방식 — useSearchParams 와 동기화되고 화면도 위로 안 튄다.
    const qs = params.toString();
    window.history.pushState(null, '', qs ? `?${qs}` : window.location.pathname);
  };

  const [posts, setPosts] = useState<PostWithAuthor[]>(() => getCache<PostWithAuthor[]>(`board_${activeTab}`) ?? []);
  const [loading, setLoading] = useState(() => !getCache(`board_${activeTab}`));
  const [error, setError] = useState<string | null>(null);
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

  // 점프 후 목록 재조회(순서 갱신)에 재사용
  const refetch = () => {
    getPosts(activeTab, { limit: 500 })
      .then((data) => { setPosts(data); setCache(`board_${activeTab}`, data, 60000); })
      .catch(() => {});
  };

  useEffect(() => {
    const cached = getCache<PostWithAuthor[]>(`board_${activeTab}`);
    if (cached) { setPosts(cached); setLoading(false); }
    else { setLoading(true); }
    setError(null);
    // 페이지·지역은 URL 쿼리로 관리됨 (탭 링크에 page/region 파라미터가 없어 자동 초기화)
    setShuffleSeed(Math.random()); // 탭 변경 시도 다시 셔플

    getPosts(activeTab, { limit: 500 })
      .then((data) => {
        setPosts(data); setCache(`board_${activeTab}`, data, 60000);
      })
      .catch((err) => setError(err.message || '데이터를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // 삽니다(buy)는 박스광고 — 새로고침/탭변경마다 랜덤
  const shuffledBuy = useMemo(() => {
    if (activeTab !== 'buy') return posts;
    void shuffleSeed; // 셔플 트리거
    return shuffle(posts);
  }, [posts, activeTab, shuffleSeed]);

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
      <div className="container-wide pt-4">
        <AdSection adType="national" title="전국 광고" icon={<MapPin size={15} className="text-accent" />} perPage={50} desktopCols={5} shuffle />
      </div>

      <div className="container-wide py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[18px] font-bold text-gray-800">{title}</h1>
          <div className="breadcrumb">
            <Link href="/">HOME</Link> &gt; {title}
          </div>
        </div>

        {/* 지역별 업체찾기 — 전체폭(메인사진 넓이)으로 펼친 지도 실루엣 격자. 첫 진입 자동 '전국' */}
        <RegionSelector regions={REGIONS} selected={selectedRegion} onSelect={(r) => setQuery({ region: r, page: 1 })} />

        {/* 홈과 동일한 3분할: 좌(최근 본 업체) · 중앙 · 우(오늘의 추천업체) */}
        <div className="grid grid-cols-1 lg:grid-cols-[176px_1fr_184px] gap-4">
          <div className="hidden lg:block">
            <HomeAside />
          </div>

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

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-2.5 bg-gray-50">
                <span className="text-[11.5px] text-gray-500 min-w-0">
                  {activeTab === 'buy'
                    ? '박스광고 · 새로고침마다 순서가 바뀝니다'
                    : '최신 등록순 · 최근 글이 위로'}
                </span>
                {writeType === 'buy' && !isLoggedIn ? (
                  <Link href={`/login?redirect=${encodeURIComponent('/board/write?type=buy')}`}
                    className="shrink-0 self-start sm:self-auto whitespace-nowrap inline-flex items-center gap-1 h-8 px-3 bg-accent text-white text-[12px] font-bold rounded-md hover:bg-blue-700 transition-colors">
                    <PenSquare size={11} /> 로그인 후 {writeLabel}
                  </Link>
                ) : (
                  <Link href={`/board/write?type=${writeType}`}
                    className="shrink-0 self-start sm:self-auto whitespace-nowrap inline-flex items-center gap-1 h-8 px-3 bg-accent text-white text-[12px] font-bold rounded-md hover:bg-blue-700 transition-colors">
                    <PenSquare size={11} /> {writeLabel}
                  </Link>
                )}
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
                <div className="grid grid-cols-2 min-[520px]:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
                  {pagedPosts.map((post) => (
                    <BuyPostCard key={post.id} post={post} publicContact={buyPublic} />
                  ))}
                </div>
              </>
            ) : (
              /* 팝니다 — 홈과 동일한 줄광고 표 (지역·제목·판매율·업체명). PC에서 2열 */
              <div className="mb-5">
                <SellLineTable posts={pagedPosts} onJumped={refetch} />
              </div>
            )}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-1 px-4 py-4 mt-3 border-t border-gray-100">
                <button onClick={() => setQuery({ page: Math.max(1, page - 1) })} disabled={page === 1}
                  className="shrink-0 w-8 h-8 flex items-center justify-center border border-gray-200 rounded text-gray-500 hover:border-accent hover:text-accent disabled:opacity-30">
                  <ChevronLeft size={13} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 10).map((p) => (
                  <button key={p} onClick={() => setQuery({ page: p })}
                    className={`shrink-0 w-8 h-8 text-[12px] border rounded ${
                      p === page ? 'border-accent bg-accent text-white font-bold' : 'border-gray-200 text-gray-600 hover:border-accent hover:text-accent'
                    }`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setQuery({ page: Math.min(totalPages, page + 1) })} disabled={page === totalPages}
                  className="shrink-0 w-8 h-8 flex items-center justify-center border border-gray-200 rounded text-gray-500 hover:border-accent hover:text-accent disabled:opacity-30">
                  <ChevronRight size={13} />
                </button>
              </div>
            )}
          </div>

          {/* 우측 — 오늘의 추천업체 2개 랜덤 (PC만) */}
          <div className="hidden lg:block">
            <RecommendRail />
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
