'use client';

import Link from 'next/link';
import { Phone, User, MessageSquare } from 'lucide-react';
import type { DBPremiumBuyer } from '@/lib/types';
import { addRecentBuyer } from '@/lib/recentBuyers';

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
  const displayTitle = company.headline?.trim() || company.description?.split('\n')[0]?.slice(0, 20) || company.name;
  const hasImage = !!company.image_url;

  const handleClick = () => {
    addRecentBuyer({
      id: company.id,
      name: company.name,
      region: company.region,
      image_url: company.image_url,
    });
  };

  const phoneDigits = stripPhone(company.phone);

  return (
    <div className="company-card card-hover group flex flex-col">
      <Link
        href={`/buyer/${company.id}`}
        onClick={handleClick}
        className="block"
      >
        {/* Header: 이미지가 있으면 이미지 + 오버레이, 없으면 빗금 + 흰 패널 */}
        <div className="relative h-25 md:h-30 overflow-hidden" style={!hasImage ? HASH_BG : undefined}>
          {hasImage ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={company.image_url!}
                alt={company.name}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-b from-black/20 via-black/40 to-black/75" />
              <div className="absolute inset-0 flex items-center justify-center px-3">
                <h3 className="text-white text-[14px] md:text-[15px] font-bold text-center leading-tight drop-shadow-md">
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
          {/* Badges */}
          {isNew && (
            <span className="absolute top-1.5 right-1.5 text-[9px] text-white bg-red-500 px-1.5 py-0.5 rounded-sm font-bold z-10">NEW</span>
          )}
          {company.tier === 'premium' && (
            <span className="absolute top-1.5 left-1.5 text-[9px] text-white bg-accent px-1.5 py-0.5 rounded-sm font-bold z-10">BEST</span>
          )}
        </div>

        {/* Body */}
        <div className="px-3 pt-2 pb-1.5">
          <p className="text-[12.5px] text-gray-600 leading-snug text-center line-clamp-2 min-h-7">
            {company.description || '상품권 매입 전문 업체입니다.'}
          </p>
        </div>

        {/* Footer (inset divider) */}
        <div className="mx-3 h-px bg-gray-200" />
        <div className="flex justify-between items-center px-3 py-1.5 text-[11px]">
          <span className="text-accent font-bold flex items-center gap-1 truncate">
            <User size={10} className="shrink-0" />
            <span className="truncate">{company.name}</span>
          </span>
          <span className="text-gray-500 shrink-0 ml-2">{company.region || '전국'}</span>
        </div>
      </Link>

      {/* 모바일 전용: 통화하기 / 문자하기 버튼 */}
      {phoneDigits && (
        <>
          <div className="mx-3 h-px bg-gray-200 md:hidden" />
          <div className="grid grid-cols-2 md:hidden">
            <a
              href={`tel:${phoneDigits}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-1.5 py-2 text-[12.5px] font-bold text-accent bg-white hover:bg-accent-bg transition-colors whitespace-nowrap"
              aria-label={`${company.name} 통화하기`}
            >
              <Phone size={13} /> 통화하기
            </a>
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
