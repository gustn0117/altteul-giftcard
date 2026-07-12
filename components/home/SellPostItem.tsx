'use client';

import Link from 'next/link';
import { CheckCircle, Calendar } from 'lucide-react';
import type { DBPost, DBUser } from '@/lib/types';
import { getCategoryName } from '@/data/mock';
import { BRAND_STYLES, normalizeBrandKey } from '@/components/BrandLogo';

interface SellPostItemProps {
  post: DBPost & { author?: DBUser };
  num?: number;
  showStatus?: boolean;
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

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}일 전`;
  const date = new Date(iso);
  return `${date.getMonth() + 1}.${String(date.getDate()).padStart(2, '0')}`;
}

export default function SellPostItem({ post, num }: SellPostItemProps) {
  const isCompleted = !!post.completed_at;

  const isNew = Date.now() - new Date(post.created_at).getTime() < 3 * 86400000;
  const categoryName = getCategoryName(post.category);
  const brandKey = normalizeBrandKey(categoryName);
  const bs = BRAND_STYLES[brandKey];

  const dimmed = isCompleted;

  return (
    <Link href={`/board/${post.id}`} className="block group">
      <div
        className={`relative flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-b-0 transition-colors ${dimmed ? 'opacity-55 bg-gray-50/40' : 'hover:bg-blue-50/30'}`}
      >
        {/* 좌측 카테고리 컬러 바 */}
        <span
          aria-hidden
          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
          style={{ background: bs.bg }}
        />

        {/* 번호 (데스크탑만) */}
        {num !== undefined && (
          <span className="hidden md:inline-block w-6 shrink-0 text-center text-[11.5px] text-gray-400 tabular-nums">
            {num}
          </span>
        )}

        {/* 상태 라벨 */}
        {isCompleted && (
          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 text-[10.5px] font-bold rounded-full bg-zinc-700 text-white">
            <CheckCircle size={10} strokeWidth={3} /> 완료
          </span>
        )}

        {/* 카테고리 뱃지 */}
        <span
          className="shrink-0 inline-flex items-center px-2 py-0.5 text-[11px] font-bold rounded"
          style={{ background: bs.bg, color: bs.fg }}
        >
          {categoryName}
        </span>

        {/* 제목 + 태그 (한 영역) */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[13.5px] font-medium text-gray-800 truncate group-hover:text-accent transition-colors">
              {post.title}
            </span>
            {isNew && !isCompleted && (
              <span className="shrink-0 text-[9.5px] font-black text-white bg-rose-500 px-1 rounded">N</span>
            )}
          </div>
          {/* 태그 — 작은 줄 */}
          <div className="hidden md:flex items-center gap-1 mt-1 overflow-hidden">
            {post.tags?.slice(0, 3).map((tag) => {
              const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
              return (
                <span key={tag} className={`shrink-0 text-[10.5px] px-1.5 py-px rounded ${tagClass(tag)}`}>
                  {cleanTag}
                </span>
              );
            })}
          </div>
        </div>

        {/* 가격/매입률 — 큰 숫자 강조 */}
        <div className="shrink-0 text-right">
          {post.type === 'sell' && post.percentage != null ? (
            <>
              <span className="text-[18px] font-extrabold text-accent tabular-nums">{post.percentage}<span className="text-[12px] ml-px">%</span></span>
              {post.send_month != null && post.send_day != null && (
                <p className="text-[10.5px] text-gray-500 mt-0.5 flex items-center gap-0.5 justify-end">
                  <Calendar size={10} /> {post.send_month}/{post.send_day} 발송
                </p>
              )}
            </>
          ) : post.price != null && post.price > 0 ? (
            <>
              <span className="text-[15px] font-extrabold text-gray-900 tabular-nums">{post.price.toLocaleString()}<span className="text-[10px] text-gray-400 font-normal ml-0.5">원</span></span>
              {post.discount != null && post.discount > 0 && (
                <p className="text-[10.5px] font-bold text-rose-500 mt-0.5">{post.type === 'buy' ? '+' : '-'}{Math.abs(post.discount)}%</p>
              )}
            </>
          ) : (
            <span className="text-[12px] font-bold text-amber-600">가격 협의</span>
          )}
        </div>

        {/* 작성자 + 시간 (데스크탑만) */}
        <div className="hidden lg:flex flex-col items-end shrink-0 w-[80px] text-[10.5px] text-gray-400">
          <span className="text-gray-500 truncate w-full text-right">{post.author?.name ?? '-'}</span>
          <span>{timeAgo(post.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}
