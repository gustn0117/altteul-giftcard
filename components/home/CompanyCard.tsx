'use client';

import Link from 'next/link';
import { Phone, Bell, MapPin, MessageSquare } from 'lucide-react';
import type { DBPremiumBuyer } from '@/lib/types';
import { addRecentBuyer } from '@/lib/recentBuyers';
import { useCallModal } from '@/contexts/CallModalContext';

const SMS_BODY = '예판상품권 보고 연락드립니다.';
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
  // ① 이미지 및 제목 — 헤드라인 우선, 없으면 업체명
  const displayTitle = company.headline?.trim() || company.name;
  const hasImage = !!company.image_url;
  const phoneDigits = stripPhone(company.phone);

  const handleClick = () => {
    addRecentBuyer({
      id: company.id,
      name: company.name,
      region: company.region,
      image_url: company.image_url,
    });
  };

  return (
    <div className="company-card card-hover group flex flex-col rounded-lg">
      {/* 본문: 좌측 이미지 + 우측 제목·홍보문구·알리미/지역 */}
      <Link
        href={`/buyer/${company.id}`}
        onClick={handleClick}
        className="flex gap-2.5 md:gap-3 p-2.5 md:p-3"
      >
        {/* 좌: 이미지 / 로고 */}
        <div
          className="relative shrink-0 w-16 md:w-28 aspect-square rounded-md overflow-hidden"
          style={!hasImage ? HASH_BG : undefined}
        >
          {hasImage ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={company.image_url!}
                alt={company.name}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-bold text-gray-400">로고</span>
            </div>
          )}
          {company.tier === 'premium' && (
            <span className="absolute top-1 left-1 text-[9px] text-white bg-accent px-1 py-0.5 rounded-sm font-bold z-10">BEST</span>
          )}
          {isNew && (
            <span className="absolute top-1 right-1 text-[9px] text-white bg-red-500 px-1 py-0.5 rounded-sm font-bold z-10">NEW</span>
          )}
        </div>

        {/* 우: 제목 + 홍보문구(2줄) + 알리미·지역 */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* ① 제목 */}
          <h3 className="text-[12.5px] md:text-[14.5px] font-bold text-gray-900 leading-tight line-clamp-1">
            {displayTitle}
          </h3>
          {/* ② 홍보 문구 — 최대 2줄, 넘으면 말줄임 */}
          <p className="mt-1 text-[11px] md:text-[12.5px] text-gray-600 leading-snug line-clamp-2 whitespace-pre-line flex-1 min-h-8">
            {company.description || '상품권 매입 전문 업체입니다.'}
          </p>
          {/* ③ 알리미 · 지역 */}
          <div className="mt-1.5 flex items-center justify-between gap-1 text-[10.5px]">
            <span className="text-accent font-bold flex items-center gap-1 truncate">
              <Bell size={10} className="shrink-0" />
              <span className="truncate">{company.name}</span>
            </span>
            <span className="text-gray-500 shrink-0 flex items-center gap-0.5">
              <MapPin size={9} className="shrink-0" /> {company.region || '전국'}
            </span>
          </div>
        </div>
      </Link>

      {/* 모바일 전용: 통화하기 / 문자하기 버튼 */}
      {phoneDigits && (
        <>
          <div className="mx-2.5 h-px bg-gray-200 md:hidden" />
          <div className="grid grid-cols-2 md:hidden">
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); openCall(company.name, company.phone); }}
              className="flex items-center justify-center gap-1.5 py-2 text-[12.5px] font-bold text-accent bg-white hover:bg-accent-bg transition-colors whitespace-nowrap"
              aria-label={`${company.name} 통화하기`}
            >
              <Phone size={13} /> 통화하기
            </button>
            <a
              href={`sms:${phoneDigits}?&body=${encodeURIComponent(SMS_BODY)}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-1.5 py-2 text-[12.5px] font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors whitespace-nowrap"
              aria-label={`${company.name} 문자하기`}
            >
              <MessageSquare size={13} /> 문자하기
            </a>
          </div>
        </>
      )}
    </div>
  );
}
