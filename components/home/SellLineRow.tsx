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
      className={`flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors ${isCompleted ? 'opacity-55 bg-gray-50/40' : ''}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[13.5px] text-gray-800 truncate min-w-0">{post.title}</span>
          {isNew && !isCompleted && (
            <span className="shrink-0 text-[9px] font-black text-white bg-orange-500 px-1 py-px rounded-sm">N</span>
          )}
        </div>
        <p className="text-[11.5px] text-orange-500 mt-0.5 truncate">
          <span className="font-medium">{post.author?.name ?? post.guest_name ?? '판매자'}</span>
          <span className="text-orange-300 mx-1.5">|</span>
          <span>{region}</span>
          {hasSend && (
            <>
              <span className="text-orange-300 mx-1.5">|</span>
              <span className="text-gray-500">{post.send_month}월 {post.send_day}일 발송</span>
            </>
          )}
        </p>
      </div>

      {/* 판매율 */}
      {post.percentage != null && (
        <span className="shrink-0 whitespace-nowrap text-accent leading-none">
          <span className="text-[10.5px] font-medium text-gray-400">판매율 </span>
          <span className="text-[15px] font-extrabold tabular-nums">{post.percentage}<span className="text-[11px]">%</span></span>
        </span>
      )}

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

      {/* 완료 배지 / 화살표 */}
      {isCompleted ? (
        <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full bg-zinc-700 text-white">
          <CheckCircle size={11} strokeWidth={3} /> 거래완료
        </span>
      ) : (
        <ChevronRight size={14} className="shrink-0 text-gray-300" />
      )}
    </Link>
  );
}
