'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Crown, Sparkles, TrendingUp } from 'lucide-react';
import LeftSidebar from '@/components/layout/LeftSidebar';
import RightSidebar from '@/components/layout/RightSidebar';
import CompanyCard from '@/components/home/CompanyCard';
import { getPremiumBuyers } from '@/lib/api';
import type { DBPremiumBuyer } from '@/lib/types';

export default function RecommendedPage() {
  const [buyers, setBuyers] = useState<DBPremiumBuyer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPremiumBuyers()
      .then(data => setBuyers(data))
      .catch(() => setBuyers([]))
      .finally(() => setLoading(false));
  }, []);

  const premiumTier = buyers.filter(b => b.tier === 'premium');
  const standardTier = buyers.filter(b => b.tier === 'standard');
  const basicTier = buyers.filter(b => b.tier === 'basic' || !b.tier);

  return (
    <div className="container-main py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[18px] font-bold text-gray-800">오늘의 추천업체</h1>
        <div className="breadcrumb">
          <Link href="/">HOME</Link> &gt; 오늘의 추천업체
        </div>
      </div>

      <div className="flex gap-4">
        <LeftSidebar />

        <div className="flex-1 min-w-0">
          {/* Hero stripe */}
          <div className="mb-5 p-5 bg-gradient-to-r from-accent to-accent-light text-white">
            <div className="flex items-center gap-3">
              <Sparkles size={22} />
              <div>
                <p className="text-[16px] font-bold">오늘의 추천업체</p>
                <p className="text-[12px] opacity-90">우선순위 및 등급 기준으로 엄선된 업체를 소개합니다</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-gray-400 text-[13px]">불러오는 중...</div>
          ) : buyers.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-gray-200 bg-white">
              <p className="text-[13px] text-gray-500">아직 등록된 추천업체가 없습니다.</p>
              <Link href="/register-business" className="inline-block mt-3 text-[12px] text-accent font-bold hover:underline">
                업체 등록하기 →
              </Link>
            </div>
          ) : (
            <div className="space-y-6 mb-6">
              {premiumTier.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Crown size={16} className="text-yellow-600" />
                    <h2 className="text-[15px] font-bold">프리미엄 추천업체</h2>
                    <span className="text-[12px] text-gray-400">{premiumTier.length}건</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
                    {premiumTier.map(b => <CompanyCard key={b.id} company={b} isNew={false} />)}
                  </div>
                </section>
              )}

              {standardTier.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={16} className="text-blue-600" />
                    <h2 className="text-[15px] font-bold">스탠다드 업체</h2>
                    <span className="text-[12px] text-gray-400">{standardTier.length}건</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
                    {standardTier.map(b => <CompanyCard key={b.id} company={b} isNew={false} />)}
                  </div>
                </section>
              )}

              {basicTier.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-[15px] font-bold">베이직 업체</h2>
                    <span className="text-[12px] text-gray-400">{basicTier.length}건</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
                    {basicTier.map(b => <CompanyCard key={b.id} company={b} isNew={false} />)}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>

        <RightSidebar />
      </div>
    </div>
  );
}
