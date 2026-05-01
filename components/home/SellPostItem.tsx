'use client';

import Link from 'next/link';
import { Lock, CheckCircle, Rocket } from 'lucide-react';
import type { DBPost, DBUser } from '@/lib/types';
import { getCategoryName } from '@/data/mock';
import { BRAND_STYLES, normalizeBrandKey } from '@/components/BrandLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

interface SellPostItemProps {
  post: DBPost & { author?: DBUser };
  num?: number;
  showStatus?: boolean;
  onJumped?: () => void;
}

const TAG_COLORS: { pattern: RegExp; cls: string }[] = [
  { pattern: /모바일/, cls: 'bg-rose-50 text-rose-500' },
  { pattern: /전국/, cls: 'bg-sky-50 text-sky-500' },
  { pattern: /서울|경기|부산|대구|광주|인천|대전|울산|제주/, cls: 'bg-indigo-50 text-indigo-500' },
  { pattern: /택배/, cls: 'bg-amber-50 text-amber-600' },
  { pattern: /직접|만남/, cls: 'bg-zinc-100 text-zinc-500' },
  { pattern: /이내|발송|일/, cls: 'bg-emerald-50 text-emerald-600' },
];

function tagClass(tag: string) {
  const clean = tag.replace(/^#/, '');
  for (const { pattern, cls } of TAG_COLORS) {
    if (pattern.test(clean)) return cls;
  }
  return 'bg-zinc-100 text-zinc-500';
}

export default function SellPostItem({ post, num, showStatus, onJumped }: SellPostItemProps) {
  const { user } = useAuth();
  const [jumping, setJumping] = useState(false);
  const isCompleted = !!post.completed_at;
  const isBlinded = post.blind_locked === true;
  const isOwner = !!user && post.author_id === user.id;

  const isNew = Date.now() - new Date(post.created_at).getTime() < 3 * 86400000;
  const categoryName = getCategoryName(post.category);
  const date = new Date(post.created_at);
  const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

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
      const msg = data.used_free
        ? `점프 완료! (오늘 무료 ${data.free_remaining}회 남음)`
        : `점프 완료! (포인트 ${data.points_used}p 차감, 잔액 ${data.balance}p)`;
      alert(msg);
      onJumped?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : '점프 실패');
    } finally {
      setJumping(false);
    }
  };

  const dimmed = isCompleted || isBlinded;
  const wrapperCls = `flex items-center py-3 px-4 hover:bg-zinc-50 border-b border-zinc-100 transition-colors last:border-b-0 gap-2.5 ${dimmed ? 'opacity-60 bg-zinc-50/60' : ''}`;

  return (
    <Link href={`/board/${post.id}`} className="block">
      <div className={wrapperCls}>
        {num !== undefined && (
          <span className="text-[12px] text-zinc-400 w-6 text-center shrink-0 tabular-nums hidden md:inline-block">{num}</span>
        )}

        {/* 상태 라벨 (완료 / 잠금) — 맨 왼쪽 */}
        {isCompleted && (
          <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded bg-zinc-700 text-white whitespace-nowrap">
            <CheckCircle size={10} /> 완료
          </span>
        )}
        {!isCompleted && isBlinded && (
          <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500 text-white whitespace-nowrap">
            <Lock size={10} /> 운영자 검토중
          </span>
        )}

        {/* 카테고리 뱃지 */}
        {(() => {
          const brandKey = normalizeBrandKey(categoryName);
          const bs = BRAND_STYLES[brandKey];
          return (
            <span
              className="shrink-0 inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded"
              style={{ background: bs.bg, color: bs.fg }}
            >
              {categoryName}
            </span>
          );
        })()}

        {/* 제목 — 블라인드는 제목만 보이고 내용/연락처 가림 */}
        <span className="text-[13px] text-zinc-800 truncate shrink-0 max-w-[180px] md:max-w-[260px]">
          {post.title}
        </span>

        {/* 태그 */}
        <div className="hidden md:flex items-center gap-1 min-w-0 overflow-hidden flex-nowrap">
          {post.tags?.slice(0, 3).map((tag) => {
            const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
            return (
              <span key={tag} className={`shrink-0 text-[11px] px-1.5 py-px rounded whitespace-nowrap ${tagClass(tag)}`}>
                {cleanTag}
              </span>
            );
          })}
          {isNew && !isCompleted && !isBlinded && (
            <span className="shrink-0 text-[10px] font-bold px-1.5 py-px rounded bg-red-500 text-white whitespace-nowrap">N</span>
          )}
        </div>

        <div className="flex-1" />

        {/* 가격/매입률 영역 */}
        <div className="shrink-0 text-right flex flex-col items-end">
          {post.type === 'sell' && post.percentage != null ? (
            <span className="text-[13px] font-bold text-accent whitespace-nowrap">{post.percentage}%</span>
          ) : post.price != null && post.price > 0 ? (
            <div className="flex items-baseline gap-1.5 whitespace-nowrap">
              <span className="text-[11px] text-zinc-400 line-through hidden lg:inline">
                {post.face_value?.toLocaleString()}
              </span>
              <span className="text-[12px] font-bold text-rose-500">
                {post.type === 'buy' ? `+${Math.abs(post.discount ?? 0)}%` : `${post.discount ?? 0}%`}
              </span>
              <span className="text-[13px] font-bold text-zinc-900">
                {post.price.toLocaleString()}
              </span>
            </div>
          ) : (
            <span className="text-[13px] font-bold text-amber-600">가격 협의</span>
          )}
        </div>

        {/* 점프 버튼 (작성자만, 완료/블라인드 아닐 때) */}
        {isOwner && !isCompleted && !isBlinded && (
          <button
            type="button"
            onClick={handleJump}
            disabled={jumping}
            className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-1 text-[10px] font-bold rounded border border-accent text-accent hover:bg-accent hover:text-white transition-colors disabled:opacity-50"
            title="이 글을 맨 위로 점프 (무료 일 3회, 이후 100p)"
          >
            <Rocket size={10} /> 점프
          </button>
        )}

        {/* 작성자 + 날짜 */}
        <div className="hidden lg:flex flex-col items-end text-[10px] text-zinc-400 shrink-0 ml-3 w-[110px]">
          <span className="text-zinc-500">{post.author?.name ?? '-'}</span>
          <span>{dateStr}</span>
        </div>
      </div>
    </Link>
  );
}
