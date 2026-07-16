'use client';

import Link from 'next/link';
import { Phone, MessageSquare, User, MapPin, Search } from 'lucide-react';
import type { DBPremiumBuyer } from '@/lib/types';
import { addRecentBuyer } from '@/lib/recentBuyers';
import { useCallModal } from '@/contexts/CallModalContext';

const SMS_BODY = '예판상품권 보고 연락드립니다.';
const stripPhone = (p?: string | null) => (p || '').replace(/[^0-9+]/g, '');

// 이미지 없는 카드용 어두운 배경 (제목을 흰 글씨로 — 사진처럼 풍선 없이)
const DARK_BG = { background: 'linear-gradient(135deg, #475569 0%, #1e293b 100%)' };

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
    <div className="company-card card-hover group flex flex-col rounded-none overflow-hidden w-full max-w-42 min-[520px]:max-w-none mx-auto">
      {/* ① 이미지 + 제목 */}
      <Link href={`/buyer/${company.id}`} onClick={handleClick} className="block">
        <div className="relative h-24 md:h-28 overflow-hidden" style={!hasImage ? DARK_BG : undefined}>
          {hasImage && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={company.image_url!}
                alt={company.name}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-b from-black/20 via-black/40 to-black/70" />
            </>
          )}
          <div className="absolute inset-0 flex items-center justify-center px-3">
            <h3 className="text-white text-[14px] md:text-[15px] font-bold text-center leading-tight drop-shadow-md line-clamp-2 break-keep">
              {displayTitle}
            </h3>
          </div>
          {company.tier === 'premium' && (
            <span className="absolute top-1.5 left-1.5 text-[9px] text-white bg-accent px-1.5 py-0.5 rounded-none font-bold z-10">BEST</span>
          )}
          {isNew && (
            <span className="absolute top-1.5 right-1.5 text-[9px] text-white bg-red-500 px-1.5 py-0.5 rounded-none font-bold z-10">NEW</span>
          )}
        </div>
      </Link>

      {/* ② 홍보 문구 (2줄) */}
      <Link href={`/buyer/${company.id}`} onClick={handleClick} className="block px-3 pt-2 pb-0.5">
        <p className="text-[12.5px] text-gray-600 leading-snug text-center line-clamp-2 min-h-8 whitespace-pre-line">
          {company.description || '상품권 매입 전문 업체입니다.'}
        </p>
      </Link>

      {/* ③ 설정한 매입률 */}
      {rate != null && (
        <p className="px-3 pb-1.5 text-center text-[13px] font-extrabold text-accent whitespace-nowrap">
          예판상품권 {rate}% 매입
        </p>
      )}

      {/* 구분선 + 업체명·지역 */}
      <div className="mx-3 h-px bg-gray-200" />
      <div className="flex justify-between items-center px-3 py-1 text-[11px]">
        <span className="text-accent font-bold flex items-center gap-1 min-w-0 flex-1">
          <User size={10} className="shrink-0" />
          <span className="truncate">{company.name}</span>
        </span>
        <span className="text-gray-500 shrink-0 ml-2 flex items-center gap-0.5">
          <MapPin size={9} className="shrink-0" /> {company.region || '전국'}
        </span>
      </div>

      {/* 버튼: 전화하기(좌) / 문자하기(우) — 양옆·사이 여백 있는 둥근 박스 */}
      {phoneDigits ? (
        <div className="flex gap-1.5 px-3 pt-1 pb-2.5">
          <button
            type="button"
            onClick={() => openCall(company.name, company.phone)}
            className="flex-1 min-w-0 overflow-hidden h-9 appearance-none rounded-none border border-transparent flex items-center justify-center gap-1 text-[11.5px] font-bold text-white bg-accent hover:bg-blue-700 transition-colors whitespace-nowrap"
            aria-label={`${company.name} 전화하기`}
          >
            <Phone size={12} className="shrink-0 hidden min-[360px]:block" /> 전화하기
          </button>
          <a
            href={`sms:${phoneDigits}?&body=${encodeURIComponent(SMS_BODY)}`}
            className="flex-1 min-w-0 overflow-hidden h-9 rounded-none border border-gray-300 flex items-center justify-center gap-1 text-[11.5px] font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors whitespace-nowrap"
            aria-label={`${company.name} 문자하기`}
          >
            <MessageSquare size={12} className="shrink-0 hidden min-[360px]:block" /> 문자하기
          </a>
        </div>
      ) : (
        <div className="px-3 pt-1 pb-2.5">
          <Link
            href={`/buyer/${company.id}`}
            onClick={handleClick}
            className="h-9 rounded-none border border-gray-300 flex items-center justify-center gap-1 text-[11.5px] font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            <Search size={12} className="shrink-0" /> 상세보기
          </Link>
        </div>
      )}
    </div>
  );
}
