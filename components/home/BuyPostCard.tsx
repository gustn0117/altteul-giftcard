'use client';

import Link from 'next/link';
import { Phone, MessageSquare, User, MapPin, Search } from 'lucide-react';
import type { DBPost, DBUser } from '@/lib/types';
import { getCategoryName } from '@/data/mock';
import { BRAND_STYLES, normalizeBrandKey } from '@/components/BrandLogo';
import { useCallModal } from '@/contexts/CallModalContext';

interface BuyPostCardProps {
  post: DBPost & { author?: DBUser };
  /** 삽니다 연락처 공개 여부 (관리자 설정). false면 전화/문자 대신 상세보기 */
  publicContact?: boolean;
}

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

/**
 * 삽니다(buy) 박스 광고 카드 — 메인광고(CompanyCard)와 동일한 크기·간격.
 * 이미지영역(카테고리+제목) / 설명 2줄 / "예판상품권 N% 매입"(작성한 매입률) / 업체·지역 / 전화·문자
 */
export default function BuyPostCard({ post, publicContact = true }: BuyPostCardProps) {
  const { openCall } = useCallModal();
  const categoryName = getCategoryName(post.category);
  const brandKey = normalizeBrandKey(categoryName);
  const bs = BRAND_STYLES[brandKey];
  const name = post.author?.name ?? post.guest_name ?? '업체';
  const phone = post.guest_phone || post.author?.phone || '';
  const phoneDigits = stripPhone(phone);
  const region = post.region || post.tags?.find((t) => /서울|경기|부산|대구|광주|인천|대전|울산|제주|세종|강원|충북|충남|전북|전남|경북|경남/.test(t))?.replace(/^#/, '') || '전국';
  const isNew = Date.now() - new Date(post.created_at).getTime() < 3 * 86400000;

  return (
    <div className="company-card card-hover group flex flex-col rounded-lg overflow-hidden">
      {/* ① 이미지영역(빗금 + 카테고리 + 제목) */}
      <Link href={`/board/${post.id}`} className="block">
        <div className="relative h-28 md:h-32 overflow-hidden" style={HASH_BG}>
          <span
            className="absolute top-1.5 left-1.5 z-10 text-[9px] font-bold px-1.5 py-0.5 rounded-sm"
            style={{ background: bs.bg, color: bs.fg }}
          >
            {categoryName}
          </span>
          {isNew && (
            <span className="absolute top-1.5 right-1.5 z-10 text-[9px] text-white bg-red-500 px-1.5 py-0.5 rounded-sm font-bold">NEW</span>
          )}
          <div className="absolute inset-0 flex items-center justify-center px-3">
            <h3 className="text-gray-900 text-[14px] md:text-[15px] font-bold text-center leading-tight bg-white/85 backdrop-blur-sm px-3 py-2 rounded-md line-clamp-2">
              {post.title}
            </h3>
          </div>
        </div>
      </Link>

      {/* ② 설명 2줄 */}
      <Link href={`/board/${post.id}`} className="block px-3 pt-2.5 pb-1">
        <p className="text-[12.5px] text-gray-600 leading-snug text-center line-clamp-2 min-h-9 whitespace-pre-line">
          {post.description || '상품권 매입합니다.'}
        </p>
      </Link>

      {/* ③ 작성한 매입률 — 예판상품권 N% 매입 */}
      {post.percentage != null && (
        <p className="px-3 pb-2 text-center text-[13px] font-extrabold text-accent whitespace-nowrap">
          예판상품권 {post.percentage}% 매입
        </p>
      )}

      {/* 구분선(양옆 인셋) + 업체명·지역 */}
      <div className="mx-3 h-px bg-gray-200" />
      <div className="flex justify-between items-center px-3 py-1.5 text-[11px]">
        <span className="text-accent font-bold flex items-center gap-1 min-w-0 flex-1">
          <User size={10} className="shrink-0" />
          <span className="truncate">{name}</span>
        </span>
        <span className="text-gray-500 shrink-0 ml-2 flex items-center gap-0.5">
          <MapPin size={9} className="shrink-0" /> {region}
        </span>
      </div>

      {/* 버튼: 전화하기 / 문자하기 (공개 설정 ON일 때) */}
      {phone && publicContact ? (
        <div className="grid grid-cols-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => openCall(name, phone)}
            className="flex items-center justify-center gap-1.5 py-2.5 text-[12.5px] font-bold text-white bg-accent hover:bg-blue-700 transition-colors border-r border-gray-100"
            aria-label={`${name} 전화하기`}
          >
            <Phone size={13} /> 전화하기
          </button>
          <a
            href={`sms:${phoneDigits}?&body=${encodeURIComponent(SMS_BODY)}`}
            className="flex items-center justify-center gap-1.5 py-2.5 text-[12.5px] font-bold text-gray-600 bg-white hover:bg-gray-50 transition-colors"
            aria-label={`${name} 문자하기`}
          >
            <MessageSquare size={13} /> 문자하기
          </a>
        </div>
      ) : (
        <Link
          href={`/board/${post.id}`}
          className="flex items-center justify-center gap-1.5 py-2.5 text-[12.5px] font-bold text-gray-600 bg-white hover:bg-gray-50 transition-colors border-t border-gray-100"
        >
          <Search size={13} /> 상세보기
        </Link>
      )}
    </div>
  );
}
