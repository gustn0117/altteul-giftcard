import Link from 'next/link';
import type { DBPost, DBUser } from '@/lib/types';
import { getCategoryName } from '@/data/mock';
import { BRAND_STYLES, normalizeBrandKey } from '@/components/BrandLogo';

interface SellPostItemProps {
  post: DBPost & { author?: DBUser };
  num?: number;
  showStatus?: boolean;
}

function getStatusBadge(post: DBPost) {
  if (post.price === 0 || post.discount === 0) {
    return { label: '가격 협의', cls: 'bg-amber-50 text-amber-600' };
  }
  if (!post.is_active) {
    return { label: '판매완료', cls: 'bg-zinc-100 text-zinc-500' };
  }
  return { label: '판매중', cls: 'bg-emerald-50 text-emerald-600' };
}

// 태그 색상 매핑
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

export default function SellPostItem({ post, num, showStatus }: SellPostItemProps) {
  const status = getStatusBadge(post);
  const isNew = Date.now() - new Date(post.created_at).getTime() < 3 * 86400000;
  const categoryName = getCategoryName(post.category);
  const date = new Date(post.created_at);
  const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

  // 할인율 표시 방식: sell(팝니다)는 - , buy(삽니다)는 +
  const discountDisplay = post.type === 'buy' ? `+${Math.abs(post.discount)}%` : `${post.discount}%`;
  const discountColor = post.type === 'buy' ? 'text-rose-500' : 'text-rose-500';

  return (
    <Link href={`/board/${post.id}`} className="block">
      <div className="flex items-center py-3 px-4 hover:bg-zinc-50 border-b border-zinc-100 transition-colors last:border-b-0 gap-2.5">
        {/* 번호 */}
        {num !== undefined && (
          <span className="text-[12px] text-zinc-400 w-6 text-center shrink-0 tabular-nums hidden md:inline-block">{num}</span>
        )}

        {/* 카테고리 뱃지 (브랜드 색상 적용) */}
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

        {/* 제목 */}
        <span className="text-[13px] text-zinc-800 truncate shrink-0 max-w-[180px] md:max-w-[260px]">
          {post.title}
        </span>

        {/* 태그들 (한 줄 고정, 넘치면 잘림) */}
        <div className="hidden md:flex items-center gap-1 min-w-0 overflow-hidden flex-nowrap">
          {post.tags?.slice(0, 3).map((tag) => {
            const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
            return (
              <span key={tag} className={`shrink-0 text-[11px] px-1.5 py-px rounded whitespace-nowrap ${tagClass(tag)}`}>
                {cleanTag}
              </span>
            );
          })}
          {isNew && (
            <span className="shrink-0 text-[10px] font-bold px-1.5 py-px rounded bg-red-500 text-white whitespace-nowrap">N</span>
          )}
          {showStatus && (
            <span className={`shrink-0 text-[11px] px-1.5 py-px rounded whitespace-nowrap ${status.cls}`}>{status.label}</span>
          )}
        </div>

        {/* 스페이서 */}
        <div className="flex-1" />

        {/* 가격 영역 */}
        <div className="shrink-0 text-right flex flex-col items-end">
          {post.price > 0 ? (
            <div className="flex items-baseline gap-1.5 whitespace-nowrap">
              <span className="text-[11px] text-zinc-400 line-through hidden lg:inline">
                {post.face_value.toLocaleString()}
              </span>
              <span className={`text-[12px] font-bold ${discountColor}`}>
                {discountDisplay}
              </span>
              <span className="text-[13px] font-bold text-zinc-900">
                {post.price.toLocaleString()}
              </span>
            </div>
          ) : (
            <span className="text-[13px] font-bold text-amber-600">가격 협의</span>
          )}
        </div>

        {/* 작성자 + 날짜 (데스크탑만) */}
        <div className="hidden lg:flex flex-col items-end text-[10px] text-zinc-400 shrink-0 ml-3 w-[110px]">
          <span className="text-zinc-500">{post.author?.name ?? '-'}</span>
          <span>{dateStr}</span>
        </div>
      </div>
    </Link>
  );
}
