'use client';

import Link from 'next/link';
import { Phone, MessageSquare, User, MapPin, Search } from 'lucide-react';
import type { DBPost, DBUser } from '@/lib/types';
import { useCallModal } from '@/contexts/CallModalContext';
import { addRecentBuyer } from '@/lib/recentBuyers';
import { trackAdEvent } from '@/lib/trackEvent';

interface BuyPostCardProps {
  post: DBPost & { author?: DBUser };
  /** 삽니다 연락처 공개 여부 (관리자 설정). false면 전화/문자 대신 상세보기 */
  publicContact?: boolean;
}

const SMS_BODY = '예판상품권 보고 연락드립니다.';
const stripPhone = (p?: string | null) => (p || '').replace(/[^0-9+]/g, '');

// 이미지 없는 카드용 어두운 배경 (중앙문구를 흰 글씨로)
const DARK_BG = { background: 'linear-gradient(135deg, #475569 0%, #1e293b 100%)' };

/**
 * 삽니다(buy) 박스 광고 카드.
 * 이미지영역(중앙문구=title) / "예판상품권 N% 매입" / 업체·지역 / 전화·문자
 * (상세설명 description 은 카드에 표시하지 않고 클릭 시 상세페이지에서만 보여준다)
 */
export default function BuyPostCard({ post, publicContact = true }: BuyPostCardProps) {
  const { openCall } = useCallModal();
  const name = post.author?.name ?? post.guest_name ?? '업체';
  const phone = post.guest_phone || post.author?.phone || '';
  const phoneDigits = stripPhone(phone);
  const region = post.region || post.tags?.find((t) => /서울|경기|부산|대구|광주|인천|대전|울산|제주|세종|강원|충북|충남|전북|전남|경북|경남/.test(t))?.replace(/^#/, '') || '전국';

  // 카드/상세 클릭 → 최근 본 업체 기록 + 조회 이벤트(업체별 통계)
  const onOpen = () => {
    addRecentBuyer({ id: post.id, name, region });
    trackAdEvent(post.id, 'view');
  };

  return (
    <div className="company-card card-hover group flex flex-col rounded-none overflow-hidden w-full max-w-42 min-[520px]:max-w-none mx-auto">
      {/* ① 이미지영역 — 중앙문구(title) */}
      <Link href={`/board/${post.id}`} onClick={onOpen} className="block">
        <div className="relative h-16 md:h-20 overflow-hidden" style={DARK_BG}>
          <div className="absolute inset-0 flex items-center justify-center px-3">
            <h3 className="text-white text-[13px] md:text-[14px] font-bold text-center leading-tight drop-shadow-md line-clamp-2 break-keep">
              {post.title}
            </h3>
          </div>
        </div>
      </Link>

      {/* ② 작성한 매입률 — 예판상품권 N% 매입 */}
      {post.percentage != null && (
        <p className="px-3 pt-2 pb-1.5 text-center text-[11px] min-[360px]:text-[13px] font-extrabold text-accent whitespace-nowrap">
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

      {/* 버튼: 전화하기(좌) / 문자하기(우) */}
      {phone && publicContact ? (
        <div className="flex gap-1.5 px-3 pt-1 pb-2.5">
          <button
            type="button"
            onClick={() => { trackAdEvent(post.id, 'phone'); openCall(name, phone); }}
            className="flex-1 min-w-0 overflow-hidden h-9 appearance-none rounded-none border border-transparent flex items-center justify-center gap-1 text-[11.5px] font-bold text-white bg-accent hover:bg-blue-700 transition-colors whitespace-nowrap"
            aria-label={`${name} 전화하기`}
          >
            <Phone size={12} className="shrink-0 hidden min-[360px]:block" /> 전화하기
          </button>
          <a
            href={`sms:${phoneDigits}?&body=${encodeURIComponent(SMS_BODY)}`}
            onClick={() => trackAdEvent(post.id, 'sms')}
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
            onClick={onOpen}
            className="h-9 rounded-none border border-gray-300 flex items-center justify-center gap-1 text-[11.5px] font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            <Search size={12} className="shrink-0" /> 상세보기
          </Link>
        </div>
      )}
    </div>
  );
}
