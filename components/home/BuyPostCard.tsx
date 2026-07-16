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

// 이미지 없는 카드용 어두운 배경 (제목을 흰 글씨로 — 사진처럼 풍선 없이)
const DARK_BG = { background: 'linear-gradient(135deg, #475569 0%, #1e293b 100%)' };

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
    <div className="company-card card-hover group flex flex-col rounded-none overflow-hidden w-full max-w-42 min-[520px]:max-w-none mx-auto">
      {/* ① 이미지영역(어두운 배경 + 카테고리 + 제목) */}
      <Link href={`/board/${post.id}`} className="block">
        <div className="relative h-24 md:h-28 overflow-hidden" style={DARK_BG}>
          <span
            className="absolute top-1.5 left-1.5 z-10 text-[9px] font-bold px-1.5 py-0.5 rounded-none"
            style={{ background: bs.bg, color: bs.fg }}
          >
            {categoryName}
          </span>
          {isNew && (
            <span className="absolute top-1.5 right-1.5 z-10 text-[9px] text-white bg-red-500 px-1.5 py-0.5 rounded-none font-bold">NEW</span>
          )}
          <div className="absolute inset-0 flex items-center justify-center px-3">
            <h3 className="text-white text-[14px] md:text-[15px] font-bold text-center leading-tight drop-shadow-md line-clamp-2 break-keep">
              {post.title}
            </h3>
          </div>
        </div>
      </Link>

      {/* ② 설명 2줄 */}
      <Link href={`/board/${post.id}`} className="block px-3 pt-2 pb-0.5">
        <p className="text-[12.5px] text-gray-600 leading-snug text-center line-clamp-2 min-h-8 whitespace-pre-line">
          {post.description || '상품권 매입합니다.'}
        </p>
      </Link>

      {/* ③ 작성한 매입률 — 예판상품권 N% 매입 */}
      {post.percentage != null && (
        <p className="px-3 pb-1.5 text-center text-[11px] min-[360px]:text-[13px] font-extrabold text-accent whitespace-nowrap">
          예판상품권 {post.percentage}% 매입
        </p>
      )}

      {/* 구분선(양옆 인셋) + 업체명·지역 */}
      <div className="mx-3 h-px bg-gray-200" />
      <div className="flex justify-between items-center px-3 py-1 text-[11px]">
        <span className="text-accent font-bold flex items-center gap-1 min-w-0 flex-1">
          <User size={10} className="shrink-0" />
          <span className="truncate">{name}</span>
        </span>
        <span className="text-gray-500 shrink-0 ml-2 flex items-center gap-0.5">
          <MapPin size={9} className="shrink-0" /> {region}
        </span>
      </div>

      {/* 버튼: 전화하기(좌) / 문자하기(우) — 양옆·사이 여백 있는 둥근 박스 */}
      {phone && publicContact ? (
        <div className="flex gap-1.5 px-3 pt-1 pb-2.5">
          <button
            type="button"
            onClick={() => openCall(name, phone)}
            className="flex-1 min-w-0 overflow-hidden h-9 appearance-none rounded-none border border-transparent flex items-center justify-center gap-1 text-[11.5px] font-bold text-white bg-accent hover:bg-blue-700 transition-colors whitespace-nowrap"
            aria-label={`${name} 전화하기`}
          >
            <Phone size={12} className="shrink-0 hidden min-[360px]:block" /> 전화하기
          </button>
          <a
            href={`sms:${phoneDigits}?&body=${encodeURIComponent(SMS_BODY)}`}
            className="flex-1 min-w-0 overflow-hidden h-9 rounded-none border border-gray-300 flex items-center justify-center gap-1 text-[11.5px] font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors whitespace-nowrap"
            aria-label={`${name} 문자하기`}
          >
            <MessageSquare size={12} className="shrink-0 hidden min-[360px]:block" /> 문자하기
          </a>
        </div>
      ) : (
        <div className="px-3 pt-1 pb-2.5">
          <Link
            href={`/board/${post.id}`}
            className="h-9 rounded-none border border-gray-300 flex items-center justify-center gap-1 text-[11.5px] font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            <Search size={12} className="shrink-0" /> 상세보기
          </Link>
        </div>
      )}
    </div>
  );
}
