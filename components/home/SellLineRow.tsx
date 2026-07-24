'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronRight, CheckCircle, Rocket } from 'lucide-react';
import type { DBPost, DBUser } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';

const REGION_RE = /서울|경기|부산|대구|광주|인천|대전|울산|제주|강원|충남|충북|전남|전북|경남|경북|세종/;

function extractRegion(post: DBPost): string {
  if (post.region) return post.region;
  const fromTag = post.tags?.find((t) => REGION_RE.test(t));
  const m = (fromTag || post.title).match(REGION_RE);
  return m ? m[0] : '전국';
}

interface SellLineRowProps {
  post: DBPost & { author?: DBUser };
  onJumped?: () => void;
}

/**
 * 팝니다 줄광고 한 줄 — 홈(SellLineAds)과 판매찾기(board sell)가 공용으로 써서
 * 두 화면이 완전히 동일하게 보이도록 한다.
 * 제목 / 판매자 · 지역 · 발송예정일 / 판매율 / (작성자면 점프) / 완료·화살표
 */
export default function SellLineRow({ post, onJumped }: SellLineRowProps) {
  const { user } = useAuth();
  const [jumping, setJumping] = useState(false);
  const isNew = Date.now() - new Date(post.created_at).getTime() < 3 * 86400000;
  const isCompleted = !!post.completed_at;
  const isOwner = !!user && post.author_id === user.id;
  const canJump = isOwner && !isCompleted;
  const region = extractRegion(post);
  const hasSend = post.send_month != null && post.send_day != null;
  const sellerName = post.author?.name ?? post.guest_name ?? '판매자';

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
    <Link
      href={`/board/${post.id}`}
      className={`group relative flex items-center gap-3 pl-4 pr-3 py-2.5 lg:py-3 border-b border-gray-100 last:border-b-0 transition-colors ${
        isCompleted ? 'bg-gray-50/60' : 'hover:bg-accent/4'
      }`}
    >
      {/* 호버 시 왼쪽 강조 바 — 어느 줄을 보고 있는지 눈에 걸리게 */}
      <span
        aria-hidden
        className={`absolute left-0 top-0 bottom-0 w-0.5 bg-accent transition-opacity ${
          isCompleted ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
        }`}
      />

      {/* 지역 — 표의 첫 칸 (연한 배경 칩) */}
      <span
        className={`shrink-0 w-12 inline-flex items-center justify-center h-6 text-[11px] font-bold rounded-md ${
          isCompleted ? 'bg-gray-100 text-gray-400' : 'bg-accent/10 text-accent'
        }`}
      >
        {region}
      </span>

      {/* 제목 (모바일은 아래에 판매자·발송일 한 줄 더) */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`text-[13.5px] font-medium truncate min-w-0 ${isCompleted ? 'text-gray-400' : 'text-gray-900'}`}>
            {post.title}
          </span>
          {isNew && !isCompleted && (
            <span className="shrink-0 text-[9px] font-black text-white bg-orange-500 px-1 py-px rounded-sm">N</span>
          )}
        </div>
        <p className="lg:hidden text-[11px] text-gray-500 mt-0.5 truncate">
          <span className="text-orange-500 font-medium">{sellerName}</span>
          {hasSend && <span> · {post.send_month}월 {post.send_day}일 발송</span>}
        </p>
      </div>

      {/* 발송일 — PC 전용 칸 (넓은 화면의 빈 공간을 정보로 채운다) */}
      <span className="hidden lg:block shrink-0 w-20 text-right text-[11.5px] text-gray-500 tabular-nums whitespace-nowrap">
        {hasSend ? `${post.send_month}/${post.send_day} 발송` : '—'}
      </span>

      {/* 판매율 — 이 표에서 제일 먼저 읽히는 숫자 (세로로 쭉 훑을 수 있게 우측 정렬) */}
      <span className="shrink-0 w-14 text-right whitespace-nowrap leading-none">
        {post.percentage != null ? (
          <span className={`tabular-nums font-extrabold ${isCompleted ? 'text-gray-400 text-[14px]' : 'text-accent text-[17px]'}`}>
            {post.percentage}
            <span className="text-[10.5px] font-bold">%</span>
          </span>
        ) : (
          <span className="text-[11.5px] text-gray-300">—</span>
        )}
      </span>

      {/* 업체명(판매자) — PC에서만 별도 칸 */}
      <span className="hidden lg:block shrink-0 w-20 text-right text-[11.5px] text-gray-500 truncate">
        {sellerName}
      </span>

      {/* 점프 (작성자 본인만) */}
      {canJump && (
        <button
          type="button"
          onClick={handleJump}
          disabled={jumping}
          title="이 글을 맨 위로 점프 (하루 10회 무료, 밤 12시 초기화)"
          className="shrink-0 inline-flex items-center gap-1 h-7 px-2 text-[10.5px] font-bold rounded-full border border-accent/40 text-accent bg-accent/5 hover:bg-accent hover:text-white transition-colors disabled:opacity-50"
        >
          <Rocket size={11} /> 점프
        </button>
      )}

      {/* 완료 표시 / 화살표 — 완료 줄은 조용히 물러나게 */}
      <span className="shrink-0 w-14 flex justify-end">
        {isCompleted ? (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded bg-gray-200 text-gray-500">
            <CheckCircle size={10} strokeWidth={3} /> 완료
          </span>
        ) : (
          <ChevronRight size={14} className="text-gray-300 group-hover:text-accent transition-colors" />
        )}
      </span>
    </Link>
  );
}
