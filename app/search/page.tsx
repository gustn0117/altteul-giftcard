'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Tag, ShoppingCart, Building2, MessageSquare, X } from 'lucide-react';
import LeftSidebar from '@/components/layout/LeftSidebar';
import RightSidebar from '@/components/layout/RightSidebar';
import CompanyCard from '@/components/home/CompanyCard';
import SellPostItem from '@/components/home/SellPostItem';
import type { DBPost, DBUser, DBPremiumBuyer, DBCommunityPost } from '@/lib/types';

type SearchTab = 'all' | 'post' | 'buyer' | 'community';

interface SearchResponse {
  q: string;
  posts: (DBPost & { author?: DBUser })[];
  buyers: DBPremiumBuyer[];
  community: DBCommunityPost[];
  error?: string;
}

const TAB_META: { value: SearchTab; label: string; Icon: typeof Tag }[] = [
  { value: 'all', label: '전체', Icon: Search },
  { value: 'post', label: '거래글', Icon: Tag },
  { value: 'buyer', label: '매입업체', Icon: Building2 },
  { value: 'community', label: '커뮤니티', Icon: MessageSquare },
];

const CATEGORY_LABEL: Record<string, string> = {
  news: '업계뉴스',
  tip: '거래TIP',
  qna: '질문과답변',
};

function highlight(text: string, q: string) {
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-accent/20 text-accent font-bold px-0.5">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get('q') || '';
  const initialTab = (searchParams.get('tab') as SearchTab) || 'all';

  const [q, setQ] = useState(initialQ);
  const [inputValue, setInputValue] = useState(initialQ);
  const [tab, setTab] = useState<SearchTab>(initialTab);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQ(searchParams.get('q') || '');
    setInputValue(searchParams.get('q') || '');
    setTab((searchParams.get('tab') as SearchTab) || 'all');
  }, [searchParams]);

  useEffect(() => {
    if (!q.trim()) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || '검색 실패');
        setData(body);
      })
      .catch((e) => setError(e instanceof Error ? e.message : '검색 실패'))
      .finally(() => setLoading(false));
  }, [q]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = inputValue.trim();
    if (!next) return;
    router.push(`/search?q=${encodeURIComponent(next)}${tab !== 'all' ? `&tab=${tab}` : ''}`);
  };

  const changeTab = (t: SearchTab) => {
    router.push(`/search?q=${encodeURIComponent(q)}${t !== 'all' ? `&tab=${t}` : ''}`);
  };

  const posts = data?.posts || [];
  const buyers = data?.buyers || [];
  const community = data?.community || [];
  const total = posts.length + buyers.length + community.length;

  const showSection = (t: SearchTab) => tab === 'all' || tab === t;

  return (
    <div className="container-main py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[18px] font-bold text-gray-800">통합검색</h1>
        <div className="breadcrumb">
          <Link href="/">HOME</Link> &gt; 통합검색
        </div>
      </div>

      <div className="flex gap-4">
        <LeftSidebar />

        <div className="flex-1 min-w-0">
          {/* Search box */}
          <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="상품권, 업체, 커뮤니티 글을 검색하세요"
                  className="w-full h-10 pl-3 pr-9 border border-gray-300 text-[13px] focus:border-accent focus:outline-none"
                  autoFocus={!initialQ}
                  maxLength={80}
                />
                {inputValue && (
                  <button
                    type="button"
                    onClick={() => setInputValue('')}
                    className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="검색어 지우기"
                  >
                    <X size={14} />
                  </button>
                )}
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              <button type="submit" className="btn-accent h-10 px-5 text-[13px]">
                검색
              </button>
            </div>
          </form>

          {/* Tabs */}
          {q && (
            <div className="bg-white border border-gray-200 mb-4">
              <div className="flex border-b border-gray-200">
                {TAB_META.map(({ value, label, Icon }) => {
                  const count =
                    value === 'all' ? total
                      : value === 'post' ? posts.length
                      : value === 'buyer' ? buyers.length
                      : community.length;
                  const active = tab === value;
                  return (
                    <button
                      key={value}
                      onClick={() => changeTab(value)}
                      className={`flex-1 py-3 text-center text-[13px] transition-colors flex items-center justify-center gap-1.5 ${
                        active
                          ? 'font-bold text-accent border-b-2 border-accent bg-accent/5'
                          : 'text-gray-500 hover:text-accent'
                      }`}
                    >
                      <Icon size={13} /> {label}
                      {data && <span className={active ? 'text-accent' : 'text-gray-400'}>({count})</span>}
                    </button>
                  );
                })}
              </div>
              <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <p className="text-[12px] text-gray-600">
                  <span className="text-accent font-bold">{q}</span>에 대한 검색 결과
                </p>
                {data && <span className="text-[11px] text-gray-500">총 <span className="text-accent font-bold">{total}</span>건</span>}
              </div>
            </div>
          )}

          {/* Results */}
          {!q ? (
            <div className="py-16 text-center border border-dashed border-gray-200 bg-white">
              <Search size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-[13px] text-gray-500">검색어를 입력해주세요.</p>
              <p className="text-[11px] text-gray-400 mt-1">예: &ldquo;신세계&rdquo;, &ldquo;서울&rdquo;, &ldquo;당일 송금&rdquo;</p>
            </div>
          ) : loading ? (
            <div className="py-16 text-center text-gray-400 text-[13px]">검색 중...</div>
          ) : error ? (
            <div className="py-16 text-center text-red-500 text-[13px]">{error}</div>
          ) : data && total === 0 ? (
            <div className="py-16 text-center border border-dashed border-gray-200 bg-white">
              <p className="text-[13px] text-gray-500">검색 결과가 없습니다.</p>
              <p className="text-[11px] text-gray-400 mt-1">다른 검색어로 다시 시도해보세요.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* 거래글 */}
              {showSection('post') && posts.length > 0 && (
                <section className="bg-white border border-gray-200">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-[13px] font-bold text-gray-800 flex items-center gap-1.5">
                      <Tag size={12} className="text-accent" /> 거래글 <span className="text-accent">{posts.length}</span>
                    </h2>
                    {tab === 'all' && posts.length >= 5 && (
                      <button onClick={() => changeTab('post')} className="text-[11px] text-gray-500 hover:text-accent">
                        더보기 →
                      </button>
                    )}
                  </div>
                  <div>
                    {(tab === 'all' ? posts.slice(0, 10) : posts).map((p, i) => (
                      <SellPostItem
                        key={p.id}
                        post={{ ...p, author: p.author ?? ({ name: p.guest_name ?? '비회원' } as DBUser) }}
                        num={i + 1}
                        showStatus
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* 매입업체 */}
              {showSection('buyer') && buyers.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-[13px] font-bold text-gray-800 flex items-center gap-1.5">
                      <Building2 size={12} className="text-accent" /> 매입업체 <span className="text-accent">{buyers.length}</span>
                    </h2>
                    {tab === 'all' && buyers.length >= 5 && (
                      <button onClick={() => changeTab('buyer')} className="text-[11px] text-gray-500 hover:text-accent">
                        더보기 →
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
                    {(tab === 'all' ? buyers.slice(0, 10) : buyers).map((b, i) => (
                      <CompanyCard key={b.id} company={b} fallbackIndex={i} />
                    ))}
                  </div>
                </section>
              )}

              {/* 커뮤니티 */}
              {showSection('community') && community.length > 0 && (
                <section className="bg-white border border-gray-200">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-[13px] font-bold text-gray-800 flex items-center gap-1.5">
                      <MessageSquare size={12} className="text-accent" /> 커뮤니티 <span className="text-accent">{community.length}</span>
                    </h2>
                    {tab === 'all' && community.length >= 5 && (
                      <button onClick={() => changeTab('community')} className="text-[11px] text-gray-500 hover:text-accent">
                        더보기 →
                      </button>
                    )}
                  </div>
                  <div>
                    {(tab === 'all' ? community.slice(0, 10) : community).map((c) => {
                      const snippet = c.content?.slice(0, 120) || '';
                      return (
                        <Link
                          key={c.id}
                          href={`/community/${c.id}`}
                          className="block px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[10px] bg-accent/10 text-accent font-bold px-1.5 py-0.5 rounded shrink-0">
                              {CATEGORY_LABEL[c.category] || c.category}
                            </span>
                            <span className="text-[13px] font-bold text-gray-800 flex-1 min-w-0 truncate">
                              {highlight(c.title, q)}
                            </span>
                          </div>
                          {snippet && (
                            <p className="text-[12px] text-gray-500 line-clamp-2 leading-relaxed">
                              {highlight(snippet, q)}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1">
                            <span>{c.author_name || '익명'}</span>
                            <span>·</span>
                            <span>조회 {c.views}</span>
                            <span>·</span>
                            <span>{new Date(c.created_at).toLocaleDateString('ko-KR')}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* 해당 탭에 결과 없음 */}
              {tab !== 'all' && (
                (tab === 'post' && posts.length === 0) ||
                (tab === 'buyer' && buyers.length === 0) ||
                (tab === 'community' && community.length === 0)
              ) && (
                <div className="py-16 text-center border border-dashed border-gray-200 bg-white">
                  <p className="text-[13px] text-gray-500">이 카테고리에는 결과가 없습니다.</p>
                  <button onClick={() => changeTab('all')} className="mt-3 text-[12px] text-accent font-bold hover:underline">
                    전체 결과 보기 →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <RightSidebar />
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container-main py-10 text-center text-gray-400 text-[13px]">불러오는 중...</div>}>
      <SearchContent />
    </Suspense>
  );
}
