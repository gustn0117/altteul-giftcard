'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { LayoutGrid } from 'lucide-react';
import LeftSidebar from '@/components/layout/LeftSidebar';
import RightSidebar from '@/components/layout/RightSidebar';
import CompanyCard from '@/components/home/CompanyCard';
import { BrandLogo } from '@/components/BrandLogo';
import { getPremiumBuyers } from '@/lib/api';
import type { DBPremiumBuyer } from '@/lib/types';

const productTypes: { name: string; useBrandLogo: boolean }[] = [
  { name: '전체', useBrandLogo: false },
  { name: '롯데', useBrandLogo: true },
  { name: '신세계', useBrandLogo: true },
  { name: '문화상품권', useBrandLogo: true },
  { name: '컬쳐랜드', useBrandLogo: true },
  { name: '스타벅스', useBrandLogo: true },
  { name: '온캐시', useBrandLogo: true },
  { name: '구글플레이', useBrandLogo: true },
  { name: '틴캐시', useBrandLogo: true },
  { name: '배민상품권', useBrandLogo: true },
  { name: '해피머니', useBrandLogo: true },
  { name: '기타', useBrandLogo: true },
];

function ProductContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') || '전체';
  const [selectedType, setSelectedType] = useState(initialType);
  const [buyers, setBuyers] = useState<DBPremiumBuyer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPremiumBuyers()
      .then(data => setBuyers(data))
      .catch(() => setBuyers([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = searchParams.get('type');
    if (t) setSelectedType(t);
  }, [searchParams]);

  // 상품별 카운트
  const typeCounts = productTypes.reduce((acc, t) => {
    if (t.name === '전체') acc[t.name] = buyers.length;
    else acc[t.name] = buyers.filter(b => b.brands?.some(br => br.includes(t.name))).length;
    return acc;
  }, {} as Record<string, number>);

  // 필터링
  const filteredBuyers = selectedType === '전체'
    ? buyers
    : buyers.filter(b => b.brands?.some(br => br.includes(selectedType)));

  return (
    <div className="container-main py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[18px] font-bold text-gray-800">상품별 업체찾기</h1>
        <div className="breadcrumb">
          <Link href="/">HOME</Link> &gt; 상품별 업체찾기
        </div>
      </div>

      <div className="flex gap-4">
        <LeftSidebar />

        <div className="flex-1 min-w-0">
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="w-full md:w-[280px] shrink-0 bg-white border border-gray-200">
              <div className="px-3 py-2 border-b border-gray-200">
                <span className="text-[12px] font-bold text-accent">Premium Banner</span>
              </div>
              <div className="p-6 text-center">
                <p className="text-[13px] font-bold text-gray-700">프리미엄 업체를 모집합니다</p>
                <p className="text-[11px] text-gray-500 mt-1">상단 노출 및 다양한 혜택 제공</p>
                <Link href="/register-business" className="inline-block mt-3 text-[11px] text-accent font-bold hover:underline">문의하기</Link>
              </div>
            </div>

            <div className="flex-1 bg-white border border-gray-200">
              <div className="grid grid-cols-4 md:grid-cols-6 gap-0">
                {productTypes.map((type) => {
                  const count = typeCounts[type.name] || 0;
                  const isActive = selectedType === type.name;
                  return (
                    <button
                      key={type.name}
                      onClick={() => setSelectedType(type.name)}
                      className={`category-icon ${isActive ? 'active' : ''}`}
                    >
                      {type.useBrandLogo ? (
                        <BrandLogo name={type.name} size="sm" />
                      ) : (
                        <div className="icon-circle">
                          <LayoutGrid size={16} strokeWidth={1.5} />
                        </div>
                      )}
                      <span className="icon-label mt-1">{type.name}</span>
                      <span className="icon-count">{count}</span>
                    </button>
                  );
                })}
              </div>
              <div className="px-4 py-2 border-t border-gray-100 text-[10px] text-gray-400">
                상품을 선택하여 업체를 보실수 있습니다.
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 px-4 py-2 mb-4 text-[11px] text-gray-500">
            * 배너위치는 실시간으로 랜덤 배치됩니다.
          </div>

          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-bold">
              {selectedType} <span className="text-accent">업체 등록 현황</span>
              <span className="text-[12px] text-gray-400 ml-2">{filteredBuyers.length}건</span>
            </h2>
            <Link href="/advertising" className="text-[11px] text-gray-400 hover:text-accent">광고문의</Link>
          </div>

          {loading ? (
            <div className="py-16 text-center text-gray-400 text-[13px]">불러오는 중...</div>
          ) : filteredBuyers.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-6">
              {filteredBuyers.map((buyer) => (
                <CompanyCard key={buyer.id} company={buyer} isNew={false} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center border border-dashed border-gray-200 bg-white">
              <p className="text-[13px] text-gray-500">
                {selectedType === '전체' ? '등록된 업체가 없습니다.' : `"${selectedType}" 취급 업체가 없습니다.`}
              </p>
              <Link href="/register-business" className="inline-block mt-3 text-[12px] text-accent font-bold hover:underline">
                첫 업체로 등록하기 →
              </Link>
            </div>
          )}
        </div>

        <RightSidebar />
      </div>
    </div>
  );
}

export default function ProductCategoryPage() {
  return (
    <Suspense fallback={<div className="container-main py-10 text-center text-gray-400 text-[13px]">불러오는 중...</div>}>
      <ProductContent />
    </Suspense>
  );
}
