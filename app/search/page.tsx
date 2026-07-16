'use client';
import HomeAside from '@/components/layout/HomeAside';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Tag, ShoppingCart, Building2, X } from 'lucide-react';
import CompanyCard from '@/components/home/CompanyCard';
import SellPostItem from '@/components/home/SellPostItem';
import type { DBPost, DBUser, DBPremiumBuyer, DBCommunityPost } from '@/lib/types';

type SearchTab = 'sell' | 'buy';

interface SearchResponse {
  q: string;
  posts: (DBPost & { author?: DBUser })[];
  buyers: DBPremiumBuyer[];
  community: DBCommunityPost[];
  error?: string;
}

const TAB_META: { value: SearchTab; label: string; Icon: typeof Tag }[] = [
  { value: 'sell', label: '판매', Icon: Tag },
  { value: 'buy', label: '매입', Icon: ShoppingCart },
];

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get('q') || '';
  const initialTab: SearchTab = searchParams.get('tab') === 'buy' ? 'buy' : 'sell';

  const [q, setQ] = useState(initialQ);
  const [inputValue, setInputValue] = useState(initialQ);
  const [tab, setTab] = useState<SearchTab>(initialTab);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQ(searchParams.get('q') || '');
    setInputValue(searchParams.get('q') || '');
    setTab(searchParams.get('tab') === 'buy' ? 'buy' : 'sell');
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
    router.push(`/search?q=${encodeURIComponent(next)}${tab === 'buy' ? '&tab=buy' : ''}`);
  };

  const changeTab = (t: SearchTab) => {
    router.push(`/search?q=${encodeURIComponent(q)}${t === 'buy' ? '&tab=buy' : ''}`);
  };

  const posts = data?.posts || [];
  const buyers = data?.buyers || [];
  const sellPosts = posts.filter((p) => p.type === 'sell');   // 판매(팝니다)
  const buyPosts = posts.filter((p) => p.type === 'buy');     // 매입(삽니다)
  const counts = { sell: sellPosts.length, buy: buyPosts.length + buyers.length };
  const total = counts.sell + counts.buy;

  return (
    <div className="container-main py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[18px] font-bold text-gray-800">통합검색</h1>
        <div className="breadcrumb hidden sm:block">
          <Link href="/">HOME</Link> &gt; 통합검색
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <HomeAside />

        <div className="flex-1 min-w-0">
          {/* Search box */}
          <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="상품권, 업체를 검색하세요"
                  className="w-full h-10 pl-3 pr-9 border border-gray-300 rounded-md text-[13px] focus:border-accent focus:outline-none"
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
              <button type="submit" className="btn-accent h-10 px-5 text-[13px] shrink-0">
                검색
              </button>
            </div>
          </form>

          {/* Tabs */}
          {q && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
              <div className="flex border-b border-gray-200">
                {TAB_META.map(({ value, label, Icon }) => {
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
                      {data && <span className={active ? 'text-accent' : 'text-gray-400'}>({counts[value]})</span>}
                    </button>
                  );
                })}
              </div>
              <div className="px-4 py-2.5 bg-gray-50 flex items-center justify-between gap-2">
                <p className="text-[12px] text-gray-600 min-w-0 truncate">
                  <span className="text-accent font-bold">{q}</span>에 대한 검색 결과
                </p>
                {data && <span className="shrink-0 text-[11px] text-gray-500">총 <span className="text-accent font-bold">{total}</span>건</span>}
              </div>
            </div>
          )}

          {/* Results */}
          {!q ? (
            <div className="py-16 text-center border border-dashed border-gray-200 rounded-xl bg-white">
              <Search size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-[13px] text-gray-500">검색어를 입력해주세요.</p>
              <p className="text-[11px] text-gray-400 mt-1">예: &ldquo;신세계&rdquo;, &ldquo;서울&rdquo;, &ldquo;당일 송금&rdquo;</p>
            </div>
          ) : loading ? (
            <div className="py-16 text-center text-gray-400 text-[13px]">검색 중...</div>
          ) : error ? (
            <div className="py-16 text-center text-red-500 text-[13px]">{error}</div>
          ) : data && total === 0 ? (
            <div className="py-16 text-center border border-dashed border-gray-200 rounded-xl bg-white">
              <p className="text-[13px] text-gray-500">검색 결과가 없습니다.</p>
              <p className="text-[11px] text-gray-400 mt-1">다른 검색어로 다시 시도해보세요.</p>
            </div>
          ) : tab === 'sell' ? (
            /* 판매(팝니다 글) */
            sellPosts.length > 0 ? (
              <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-[13px] font-bold text-gray-800 flex items-center gap-1.5">
                    <Tag size={12} className="text-accent" /> 판매글 <span className="text-accent">{sellPosts.length}</span>
                  </h2>
                </div>
                <div>
                  {sellPosts.map((p, i) => (
                    <SellPostItem
                      key={p.id}
                      post={{ ...p, author: p.author ?? ({ name: p.guest_name ?? '비회원' } as DBUser) }}
                      num={i + 1}
                      showStatus
                    />
                  ))}
                </div>
              </section>
            ) : (
              <div className="py-16 text-center border border-dashed border-gray-200 rounded-xl bg-white">
                <p className="text-[13px] text-gray-500">판매 검색 결과가 없습니다.</p>
                <button onClick={() => changeTab('buy')} className="mt-3 text-[12px] text-accent font-bold hover:underline">매입 결과 보기 →</button>
              </div>
            )
          ) : (
            /* 매입(삽니다 글 + 매입업체) */
            (buyPosts.length > 0 || buyers.length > 0) ? (
              <div className="space-y-5">
                {buyers.length > 0 && (
                  <section>
                    <h2 className="text-[13px] font-bold text-gray-800 flex items-center gap-1.5 mb-3">
                      <Building2 size={12} className="text-accent" /> 매입업체 <span className="text-accent">{buyers.length}</span>
                    </h2>
                    <div className="grid grid-cols-2 min-[520px]:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
                      {buyers.map((b) => (
                        <CompanyCard key={b.id} company={b} />
                      ))}
                    </div>
                  </section>
                )}
                {buyPosts.length > 0 && (
                  <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50">
                      <h2 className="text-[13px] font-bold text-gray-800 flex items-center gap-1.5">
                        <ShoppingCart size={12} className="text-accent" /> 삽니다 글 <span className="text-accent">{buyPosts.length}</span>
                      </h2>
                    </div>
                    <div>
                      {buyPosts.map((p, i) => (
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
              </div>
            ) : (
              <div className="py-16 text-center border border-dashed border-gray-200 rounded-xl bg-white">
                <p className="text-[13px] text-gray-500">매입 검색 결과가 없습니다.</p>
                <button onClick={() => changeTab('sell')} className="mt-3 text-[12px] text-accent font-bold hover:underline">판매 결과 보기 →</button>
              </div>
            )
          )}
        </div>
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
