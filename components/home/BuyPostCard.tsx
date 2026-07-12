'use client';

import Link from 'next/link';
import { Phone, MessageSquare, MapPin } from 'lucide-react';
import type { DBPost, DBUser } from '@/lib/types';
import { getCategoryName } from '@/data/mock';
import { BRAND_STYLES, normalizeBrandKey } from '@/components/BrandLogo';
import { useCallModal } from '@/contexts/CallModalContext';

interface BuyPostCardProps {
  post: DBPost & { author?: DBUser };
}

const HASH_BG = {
  backgroundImage: `repeating-linear-gradient(
    45deg,
    #f1f5f9, #f1f5f9 8px,
    #e2e8f0 8px, #e2e8f0 16px
  )`,
};

/**
 * 삽니다(buy) 박스 광고 카드.
 * 그리드(2~5열)로 배치되며 새로고침마다 랜덤 순서.
 * 표시 정보: 카테고리·제목·태그(지역/배송)·매입가/액면가
 */
export default function BuyPostCard({ post }: BuyPostCardProps) {
  const { openCall } = useCallModal();
  const categoryName = getCategoryName(post.category);
  const brandKey = normalizeBrandKey(categoryName);
  const bs = BRAND_STYLES[brandKey];
  const phone = post.guest_phone || post.author?.phone || '';
  const phoneDigits = phone.replace(/[^0-9]/g, '');
  const region = post.tags?.find((t) => /서울|경기|부산|대구|광주|인천|대전|울산|제주|전국/.test(t))?.replace(/^#/, '') || '전국';

  return (
    <div className="company-card card-hover group flex flex-col">
      <Link href={`/board/${post.id}`} className="block">
        {/* Header — 카테고리 컬러 + 제목 */}
        <div
          className="relative h-[110px] md:h-[120px] overflow-hidden border-b border-gray-200 flex items-center justify-center px-3"
          style={HASH_BG}
        >
          <span
            className="absolute top-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm"
            style={{ background: bs.bg, color: bs.fg }}
          >
            {categoryName}
          </span>
          <h3 className="relative z-10 text-gray-900 text-[13.5px] md:text-[14px] font-bold text-center leading-tight bg-white/90 backdrop-blur-sm px-3 py-2 rounded-md shadow-sm line-clamp-2">
            {post.title}
          </h3>
        </div>

        {/* Body */}
        <div className="px-3 py-2.5 space-y-1.5">
          {post.price != null && post.price > 0 ? (
            <p className="text-center">
              <span className="text-[16px] font-extrabold text-accent tabular-nums">
                {post.price.toLocaleString()}
              </span>
              <span className="text-[10.5px] text-gray-400 ml-0.5">원</span>
              {post.discount != null && post.discount > 0 && (
                <span className="ml-1.5 text-[10px] font-bold text-rose-500">+{Math.abs(post.discount)}%</span>
              )}
            </p>
          ) : post.percentage != null ? (
            <p className="text-center text-[16px] font-extrabold text-accent tabular-nums">
              {post.percentage}<span className="text-[10.5px] ml-0.5">%</span>
            </p>
          ) : (
            <p className="text-center text-[12px] font-bold text-amber-600">가격 협의</p>
          )}
          <p className="flex items-center justify-center gap-1 text-[10.5px] text-gray-500">
            <MapPin size={10} className="text-gray-400" /> {region}
          </p>
        </div>

        {/* Footer — 작성자 */}
        <div className="px-3 py-1.5 border-t border-gray-100 flex items-center justify-between text-[10.5px] text-gray-500">
          <span className="truncate">{post.author?.name ?? post.guest_name ?? '회원'}</span>
          <span className="text-gray-400 shrink-0 ml-1">{new Date(post.created_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '')}</span>
        </div>
      </Link>

      {/* 모바일/공통: 전화·문자 버튼 (연락처 권한 회원만 실제 작동, 비회원은 상세로 라우팅) */}
      {phone && (
        <div className="grid grid-cols-2 border-t border-gray-100">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); openCall(post.author?.name || post.guest_name || '업체', phone); }}
            className="flex items-center justify-center gap-1 py-1.5 text-[10.5px] font-bold text-accent bg-white hover:bg-blue-50 transition-colors border-r border-gray-100"
          >
            <Phone size={11} /> 통화
          </button>
          <a
            href={`sms:${phoneDigits}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-1 py-1.5 text-[10.5px] font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <MessageSquare size={11} /> 문자
          </a>
        </div>
      )}
    </div>
  );
}
