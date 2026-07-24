'use client';

import type { DBPost, DBUser } from '@/lib/types';
import SellLineRow from './SellLineRow';

type SellPost = DBPost & { author?: DBUser };

/** 표 머리글 — 행의 칸 너비와 1:1로 맞춘다 (지역12 / 제목flex / 발송20 / 판매율14 / 업체20 / 상태14) */
function HeadRow({ className = '' }: { className?: string }) {
  return (
    <div className={`items-center gap-3 pl-4 pr-3 py-2 bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-400 ${className}`}>
      <span className="shrink-0 w-12 text-center">지역</span>
      <span className="flex-1 min-w-0">제목</span>
      <span className="hidden lg:block shrink-0 w-20 text-right">발송일</span>
      <span className="shrink-0 w-14 text-right">판매율</span>
      <span className="hidden lg:block shrink-0 w-20 text-right">업체명</span>
      <span className="shrink-0 w-14" aria-hidden />
    </div>
  );
}

/**
 * 팝니다 줄광고 목록 — 지역 배지 · 제목 · 판매율 · 업체명의 표 형태.
 * PC에서는 좌우 2열로 나누고 각 열에 머리글을 붙인다(모바일은 한 줄씩, 머리글 1개).
 * 앞쪽 절반이 왼쪽, 뒤쪽 절반이 오른쪽 → 모바일로 접혀도 순서가 그대로 유지된다.
 */
export default function SellLineTable({ posts, onJumped }: { posts: SellPost[]; onJumped?: () => void }) {
  const mid = Math.ceil(posts.length / 2);
  const columns = [posts.slice(0, mid), posts.slice(mid)];

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="lg:grid lg:grid-cols-2 lg:divide-x lg:divide-gray-200">
        {columns.map((col, i) => (
          <div key={i} className="min-w-0">
            {/* 오른쪽 열 머리글은 모바일에서 중복이라 숨긴다 */}
            <HeadRow className={i === 0 ? 'flex' : 'hidden lg:flex'} />
            {col.map((post) => (
              <SellLineRow key={post.id} post={post} onJumped={onJumped} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
