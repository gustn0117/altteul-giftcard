'use client';

import Link from 'next/link';
import { useState } from 'react';
import { User, MapPin, Search, Rocket, CheckCircle, Calendar } from 'lucide-react';
import type { DBPost, DBUser } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';

interface SellPostCardProps {
  post: DBPost & { author?: DBUser };
  onJumped?: () => void;
}

const REGION_RE = /서울|경기|부산|대구|광주|인천|대전|울산|제주|세종|강원|충북|충남|전북|전남|경북|경남/;
const DARK_BG = { background: 'linear-gradient(135deg, #475569 0%, #1e293b 100%)' };

/**
 * 팝니다(sell) 박스 광고 카드 — 삽니다 카드(BuyPostCard)와 같은 2칸 격자로 보이게 한다.
 * 사진칸(상단문구=title) / 중앙문구 / 판매율 N% · 발송일 / 판매자 · 지역 / 상세보기(+점프)
 * 팝니다는 연락처 블라인드라 전화/문자 대신 '상세보기'만 노출한다.
 */
export default function SellPostCard({ post, onJumped }: SellPostCardProps) {
  const { user } = useAuth();
  const [jumping, setJumping] = useState(false);

  const name = post.author?.name ?? post.guest_name ?? '판매자';
  const region = post.region || post.tags?.find((t) => REGION_RE.test(t))?.replace(/^#/, '') || '전국';
  const isCompleted = !!post.completed_at;
  const isNew = Date.now() - new Date(post.created_at).getTime() < 3 * 86400000;
  const isOwner = !!user && post.author_id === user.id;
  const canJump = isOwner && !isCompleted;
  const hasImage = !!post.image_url;
  const hasSend = post.send_month != null && post.send_day != null;
  const centerLines = (post.center_text || '').split('\n').filter(Boolean).slice(0, 2);

  const handleJump = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (jumping) return;
    setJumping(true);
    try {
      const res = await fetch('/api/posts/jump', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: post.id, user_id: user?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '점프에 실패했습니다.');
      alert(`점프 완료! (오늘 무료 점프 ${data.free_remaining}회 남음)`);
      onJumped?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : '점프 실패');
    } finally {
      setJumping(false);
    }
  };

  return (
    <div className={`company-card card-hover group flex flex-col rounded-none overflow-hidden w-full max-w-42 min-[520px]:max-w-none mx-auto ${isCompleted ? 'opacity-60' : ''}`}>
      <Link href={`/board/${post.id}`} className="block">
        {/* ① 사진칸 — 상단문구(title) */}
        <div className="relative overflow-hidden h-20 md:h-24" style={!hasImage ? DARK_BG : undefined}>
          {hasImage && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.image_url!} alt={post.title} loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-linear-to-b from-black/25 via-black/40 to-black/65" />
            </>
          )}
          {isNew && !isCompleted && (
            <span className="absolute top-1.5 left-1.5 z-10 text-[9.5px] font-black text-white bg-rose-500 px-1 rounded">N</span>
          )}
          <div className="absolute inset-0 flex items-center justify-center px-2">
            <h3 className="w-full text-white text-[12.5px] md:text-[14px] font-bold text-center leading-tight drop-shadow-md whitespace-nowrap overflow-hidden text-ellipsis">
              {post.title}
            </h3>
          </div>
        </div>

        {/* ② 중앙문구 — 최대 2줄 (높이 고정) */}
        <div className="px-2 pt-1.5">
          <div className="h-8 flex flex-col items-center justify-center gap-px">
            {centerLines.map((line, i) => (
              <p key={i} className="w-full text-[11px] min-[360px]:text-[12px] text-gray-700 font-medium text-center leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                {line}
              </p>
            ))}
          </div>
        </div>

        {/* ③ 판매율 + 발송일 (높이 고정) */}
        <div className="h-6 flex items-center justify-center gap-2 px-3">
          {post.percentage != null && (
            <p className="text-center text-[11px] min-[360px]:text-[13px] font-extrabold text-accent whitespace-nowrap">
              판매율 {post.percentage}%
            </p>
          )}
          {hasSend && (
            <span className="text-[10.5px] text-gray-500 flex items-center gap-0.5 whitespace-nowrap">
              <Calendar size={10} className="shrink-0" /> {post.send_month}/{post.send_day} 발송
            </span>
          )}
        </div>

        {/* 구분선 + 판매자 · 지역 */}
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
      </Link>

      {/* 하단 버튼 — 완료 배지 / (점프) + 상세보기 */}
      {isCompleted ? (
        <div className="px-3 pt-1 pb-2.5">
          <span className="h-9 rounded-none flex items-center justify-center gap-1 text-[11.5px] font-bold text-white bg-zinc-700 whitespace-nowrap">
            <CheckCircle size={12} strokeWidth={3} className="shrink-0" /> 거래완료
          </span>
        </div>
      ) : (
        <div className="flex gap-1.5 px-3 pt-1 pb-2.5">
          {canJump && (
            <button
              type="button"
              onClick={handleJump}
              disabled={jumping}
              className="shrink-0 h-9 px-2.5 appearance-none rounded-none border border-accent/40 flex items-center justify-center gap-1 text-[11.5px] font-bold text-accent bg-accent/5 hover:bg-accent hover:text-white transition-colors whitespace-nowrap disabled:opacity-50"
              title="이 글을 맨 위로 점프 (하루 10회 무료, 밤 12시 초기화)"
            >
              <Rocket size={12} className="shrink-0" /> 점프
            </button>
          )}
          <Link
            href={`/board/${post.id}`}
            className="flex-1 min-w-0 h-9 rounded-none border border-gray-300 flex items-center justify-center gap-1 text-[11.5px] font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            <Search size={12} className="shrink-0" /> 상세보기
          </Link>
        </div>
      )}
    </div>
  );
}
