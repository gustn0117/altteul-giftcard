'use client';

import Link from 'next/link';
import SellPostItem from './SellPostItem';
import type { DBPost, DBUser } from '@/lib/types';
import { ChevronRight } from 'lucide-react';

type PostWithAuthor = DBPost & { author: DBUser };

interface LineAdsSectionProps {
  posts: PostWithAuthor[];
}

export default function LineAdsSection({ posts }: LineAdsSectionProps) {
  if (posts.length === 0) return null;

  const visible = posts.slice(0, 10);

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-baseline gap-2">
          <h2 className="section-title mb-0">매입 업체 구매글</h2>
          <span className="badge bg-zinc-100 text-zinc-400">AD</span>
        </div>
        <Link href="/board?tab=buy" className="text-[12px] text-zinc-500 hover:text-zinc-900 flex items-center gap-0.5">
          전체보기 <ChevronRight size={11} />
        </Link>
      </div>
      <div className="card overflow-hidden">
        {visible.map((post, idx) => (
          <SellPostItem key={post.id} post={post} num={idx + 1} />
        ))}
        {posts.length > 10 && (
          <Link href="/board?tab=buy"
            className="block py-2.5 text-center text-[12px] text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 border-t border-zinc-100 transition-colors">
            + {posts.length - 10}건 더보기
          </Link>
        )}
      </div>
    </section>
  );
}
