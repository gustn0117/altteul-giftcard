'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, X } from 'lucide-react';
import LeftSidebar from '@/components/layout/LeftSidebar';
import RightSidebar from '@/components/layout/RightSidebar';
import CompanyCard from '@/components/home/CompanyCard';
import { getPremiumBuyers } from '@/lib/api';
import type { DBPremiumBuyer } from '@/lib/types';

const regions = ['전체', '서울', '경기', '인천', '대전', '대구', '부산', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
const brands = ['전체', '롯데', '신세계', '문화상품권', '컬쳐랜드', '스타벅스', '온캐시', '구글플레이', '틴캐시', '배민상품권', '해피머니', '기타'];
const tiers: { value: 'all' | 'premium' | 'standard' | 'basic'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'premium', label: '프리미엄' },
  { value: 'standard', label: '스탠다드' },
  { value: 'basic', label: '베이직' },
];

export default function CustomSearchPage() {
  const [buyers, setBuyers] = useState<DBPremiumBuyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [region, setRegion] = useState('전체');
  const [brand, setBrand] = useState('전체');
  const [tier, setTier] = useState<'all' | 'premium' | 'standard' | 'basic'>('all');

  useEffect(() => {
    setLoading(true);
    getPremiumBuyers()
      .then(data => setBuyers(data))
      .catch(() => setBuyers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = buyers.filter(b => {
    if (region !== '전체' && !b.region?.includes(region)) return false;
    if (brand !== '전체' && !b.brands?.some(br => br.includes(brand))) return false;
    if (tier !== 'all' && b.tier !== tier) return false;
    if (keyword.trim()) {
      const k = keyword.trim().toLowerCase();
      const hay = [b.name, b.description, b.region, ...(b.brands || [])].filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(k)) return false;
    }
    return true;
  });

  const reset = () => {
    setKeyword('');
    setRegion('전체');
    setBrand('전체');
    setTier('all');
  };

  const activeFilters = [
    region !== '전체' && `지역:${region}`,
    brand !== '전체' && `상품:${brand}`,
    tier !== 'all' && `등급:${tiers.find(t => t.value === tier)?.label}`,
    keyword.trim() && `키워드:${keyword.trim()}`,
  ].filter(Boolean) as string[];

  return (
    <div className="container-main py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[18px] font-bold text-gray-800">맞춤검색</h1>
        <div className="breadcrumb">
          <Link href="/">HOME</Link> &gt; 맞춤검색
        </div>
      </div>

      <div className="flex gap-4">
        <LeftSidebar />

        <div className="flex-1 min-w-0">
          {/* Search form */}
          <div className="bg-white border border-gray-200 mb-4">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
              <Filter size={14} className="text-accent" />
              <h2 className="text-[14px] font-bold">상세 검색</h2>
            </div>

            <div className="p-4 space-y-4">
              {/* Keyword */}
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1.5">키워드</label>
                <div className="relative">
                  <input
                    type="text"
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                    placeholder="업체명, 설명, 지역, 브랜드로 검색"
                    className="w-full h-9 pl-3 pr-9 border border-gray-300 text-[13px] focus:border-accent focus:outline-none"
                  />
                  <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* 지역 */}
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1.5">지역</label>
                <div className="flex flex-wrap gap-1">
                  {regions.map(r => (
                    <button
                      key={r}
                      onClick={() => setRegion(r)}
                      className={`px-3 py-1.5 text-[12px] border transition-colors ${
                        region === r ? 'border-accent bg-accent text-white font-bold' : 'border-gray-200 text-gray-600 hover:border-accent hover:text-accent'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* 브랜드 */}
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1.5">취급 상품권</label>
                <div className="flex flex-wrap gap-1">
                  {brands.map(b => (
                    <button
                      key={b}
                      onClick={() => setBrand(b)}
                      className={`px-3 py-1.5 text-[12px] border transition-colors ${
                        brand === b ? 'border-accent bg-accent text-white font-bold' : 'border-gray-200 text-gray-600 hover:border-accent hover:text-accent'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* 등급 */}
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1.5">광고 등급</label>
                <div className="flex gap-1">
                  {tiers.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setTier(t.value)}
                      className={`px-4 py-1.5 text-[12px] border transition-colors ${
                        tier === t.value ? 'border-accent bg-accent text-white font-bold' : 'border-gray-200 text-gray-600 hover:border-accent hover:text-accent'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Active filters + reset */}
            {activeFilters.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50">
                <span className="text-[11px] text-gray-500">적용된 필터:</span>
                {activeFilters.map(f => (
                  <span key={f} className="text-[11px] bg-accent/10 text-accent px-2 py-0.5 rounded-sm">{f}</span>
                ))}
                <button onClick={reset} className="ml-auto flex items-center gap-1 text-[11px] text-gray-500 hover:text-accent">
                  <X size={11} /> 초기화
                </button>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-bold">검색 결과 <span className="text-accent">{filtered.length}건</span></h2>
          </div>

          {loading ? (
            <div className="py-16 text-center text-gray-400 text-[13px]">불러오는 중...</div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-6">
              {filtered.map(b => <CompanyCard key={b.id} company={b} isNew={false} />)}
            </div>
          ) : (
            <div className="py-16 text-center border border-dashed border-gray-200 bg-white">
              <p className="text-[13px] text-gray-500">조건에 맞는 업체가 없습니다.</p>
              <button onClick={reset} className="inline-block mt-3 text-[12px] text-accent font-bold hover:underline">
                필터 초기화 →
              </button>
            </div>
          )}
        </div>

        <RightSidebar />
      </div>
    </div>
  );
}
