'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MapPin, Phone, LayoutGrid, Building2, Landmark, Anchor, Train, University, Waves, Sun, Factory, Construction, Mountain, Leaf, Wheat, Sprout, TreePine, MountainSnow, Palmtree } from 'lucide-react';
import LeftSidebar from '@/components/layout/LeftSidebar';
import RightSidebar from '@/components/layout/RightSidebar';
import CompanyCard from '@/components/home/CompanyCard';
import { getPremiumBuyers } from '@/lib/api';
import type { DBPremiumBuyer } from '@/lib/types';

const regions = [
  { name: '전체', Icon: LayoutGrid },
  { name: '서울', Icon: Building2 },
  { name: '경기', Icon: Landmark },
  { name: '인천', Icon: Anchor },
  { name: '대전', Icon: Train },
  { name: '대구', Icon: University },
  { name: '부산', Icon: Waves },
  { name: '광주', Icon: Sun },
  { name: '울산', Icon: Factory },
  { name: '세종', Icon: Construction },
  { name: '강원', Icon: Mountain },
  { name: '충북', Icon: Leaf },
  { name: '충남', Icon: Wheat },
  { name: '전북', Icon: Sprout },
  { name: '전남', Icon: TreePine },
  { name: '경북', Icon: MountainSnow },
  { name: '경남', Icon: TreePine },
  { name: '제주', Icon: Palmtree },
];

function AreaContent() {
  const searchParams = useSearchParams();
  const initialRegion = searchParams.get('region') || '전체';
  const [selectedRegion, setSelectedRegion] = useState(initialRegion);
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
    const r = searchParams.get('region');
    if (r) setSelectedRegion(r);
  }, [searchParams]);

  // 지역별 카운트 집계
  const regionCounts = regions.reduce((acc, r) => {
    if (r.name === '전체') acc[r.name] = buyers.length;
    else acc[r.name] = buyers.filter(b => b.region?.includes(r.name)).length;
    return acc;
  }, {} as Record<string, number>);

  // 선택된 지역 필터링
  const filteredBuyers = selectedRegion === '전체'
    ? buyers
    : buyers.filter(b => b.region?.includes(selectedRegion));

  return (
    <div className="container-main py-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[18px] font-bold text-gray-800">지역별 업체찾기</h1>
        <div className="breadcrumb">
          <Link href="/">HOME</Link> &gt; 지역별 업체찾기
        </div>
      </div>

      <div className="flex gap-4">
        <LeftSidebar />

        <div className="flex-1 min-w-0">
          {/* Premium Banner + Region Icons */}
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            {/* Premium banner */}
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

            {/* Region icons grid */}
            <div className="flex-1 bg-white border border-gray-200">
              <div className="grid grid-cols-5 md:grid-cols-9 gap-0">
                {regions.map((region) => {
                  const IconComp = region.Icon;
                  const count = regionCounts[region.name] || 0;
                  return (
                    <button
                      key={region.name}
                      onClick={() => setSelectedRegion(region.name)}
                      className={`category-icon ${selectedRegion === region.name ? 'active' : ''}`}
                    >
                      <div className="icon-circle">
                        <IconComp size={16} strokeWidth={1.5} />
                      </div>
                      <span className="icon-label">{region.name}</span>
                      <span className="icon-count">{count}</span>
                    </button>
                  );
                })}
              </div>
              <div className="px-4 py-2 border-t border-gray-100 text-[10px] text-gray-400">
                해당 지역의 상품권 업체를 선택하여 보실수 있습니다.
              </div>
            </div>
          </div>

          {/* Notice bar */}
          <div className="bg-white border border-gray-200 px-4 py-2 mb-4 text-[11px] text-gray-500">
            * 배너위치는 실시간으로 랜덤 배치됩니다.
          </div>

          {/* Company listing header */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-bold">
              {selectedRegion === '전체' ? '전국' : selectedRegion} <span className="text-accent">업체 등록 현황</span>
              <span className="text-[12px] text-gray-400 ml-2">{filteredBuyers.length}건</span>
            </h2>
            <Link href="/advertising" className="text-[11px] text-gray-400 hover:text-accent">광고문의</Link>
          </div>

          {/* Company cards grid */}
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
                {selectedRegion === '전체' ? '등록된 업체가 없습니다.' : `${selectedRegion} 지역에 등록된 업체가 없습니다.`}
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

export default function AreaCategoryPage() {
  return (
    <Suspense fallback={<div className="container-main py-10 text-center text-gray-400 text-[13px]">불러오는 중...</div>}>
      <AreaContent />
    </Suspense>
  );
}
