'use client';

import Link from 'next/link';
import { Phone, User, MapPin, Search } from 'lucide-react';
import type { DBPremiumBuyer } from '@/lib/types';
import { addRecentBuyer } from '@/lib/recentBuyers';
import { useCallModal } from '@/contexts/CallModalContext';

const stripPhone = (p?: string | null) => (p || '').replace(/[^0-9+]/g, '');

const HASH_BG = {
  backgroundImage: `repeating-linear-gradient(
    45deg,
    #f1f5f9,
    #f1f5f9 8px,
    #e2e8f0 8px,
    #e2e8f0 16px
  )`,
};

interface CompanyCardProps {
  company: DBPremiumBuyer;
  isNew?: boolean;
}

export default function CompanyCard({ company, isNew }: CompanyCardProps) {
  const { openCall } = useCallModal();
  const displayTitle = company.headline?.trim() || company.name;
  const hasImage = !!company.image_url;
  const phoneDigits = stripPhone(company.phone);
  const rate = company.buy_rate;

  const handleClick = () => {
    addRecentBuyer({
      id: company.id,
      name: company.name,
      region: company.region,
      image_url: company.image_url,
    });
  };

  return (
    <div className="company-card card-hover group flex flex-col rounded-lg overflow-hidden">
      {/* ① 이미지 + 제목 */}
      <Link href={`/buyer/${company.id}`} onClick={handleClick} className="block">
        <div className="relative h-28 md:h-32 overflow-hidden" style={!hasImage ? HASH_BG : undefined}>
          {hasImage ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={company.image_url!}
                alt={company.name}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-b from-black/20 via-black/40 to-black/70" />
              <div className="absolute inset-0 flex items-center justify-center px-3">
                <h3 className="text-white text-[15px] md:text-[16px] font-bold text-center leading-tight drop-shadow-md">
                  {displayTitle}
                </h3>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center px-3">
              <h3 className="text-gray-900 text-[14px] md:text-[15px] font-bold text-center leading-tight bg-white/85 backdrop-blur-sm px-3 py-2 rounded-md">
                {displayTitle}
              </h3>
            </div>
          )}
          {company.tier === 'premium' && (
            <span className="absolute top-1.5 left-1.5 text-[9px] text-white bg-accent px-1.5 py-0.5 rounded-sm font-bold z-10">BEST</span>
          )}
          {isNew && (
            <span className="absolute top-1.5 right-1.5 text-[9px] text-white bg-red-500 px-1.5 py-0.5 rounded-sm font-bold z-10">NEW</span>
          )}
        </div>
      </Link>

      {/* ② 홍보 문구 (2줄) */}
      <Link href={`/buyer/${company.id}`} onClick={handleClick} className="block px-3 pt-2.5 pb-1">
        <p className="text-[12.5px] text-gray-600 leading-snug text-center line-clamp-2 min-h-9 whitespace-pre-line">
          {company.description || '상품권 매입 전문 업체입니다.'}
        </p>
      </Link>

      {/* ③ 설정한 매입률 */}
      {rate != null && (
        <p className="px-3 pb-2 text-center text-[13px] font-extrabold text-accent whitespace-nowrap">
          예판상품권 {rate}% 매입
        </p>
      )}

      {/* 구분선 + 업체명·지역 */}
      <div className="mx-3 h-px bg-gray-200" />
      <div className="flex justify-between items-center px-3 py-1.5 text-[11px]">
        <span className="text-accent font-bold flex items-center gap-1 min-w-0 flex-1">
          <User size={10} className="shrink-0" />
          <span className="truncate">{company.name}</span>
        </span>
        <span className="text-gray-500 shrink-0 ml-2 flex items-center gap-0.5">
          <MapPin size={9} className="shrink-0" /> {company.region || '전국'}
        </span>
      </div>

      {/* 버튼: 상세보기 / 통화하기 */}
      <div className="grid grid-cols-2 border-t border-gray-100">
        <Link
          href={`/buyer/${company.id}`}
          onClick={handleClick}
          className="flex items-center justify-center gap-1.5 py-2.5 text-[12.5px] font-bold text-gray-600 bg-white hover:bg-gray-50 transition-colors border-r border-gray-100"
        >
          <Search size={13} /> 상세보기
        </Link>
        {phoneDigits ? (
          <button
            type="button"
            onClick={() => openCall(company.name, company.phone)}
            className="flex items-center justify-center gap-1.5 py-2.5 text-[12.5px] font-bold text-white bg-accent hover:bg-blue-700 transition-colors"
            aria-label={`${company.name} 통화하기`}
          >
            <Phone size={13} /> 통화하기
          </button>
        ) : (
          <Link
            href={`/buyer/${company.id}`}
            onClick={handleClick}
            className="flex items-center justify-center gap-1.5 py-2.5 text-[12.5px] font-bold text-white bg-accent hover:bg-blue-700 transition-colors"
          >
            <Phone size={13} /> 통화하기
          </Link>
        )}
      </div>
    </div>
  );
}
