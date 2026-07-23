'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Crown, PenSquare } from 'lucide-react';
import BuyPostCard from './BuyPostCard';
import { getAdPosts } from '@/lib/api';
import type { DBPost, DBUser } from '@/lib/types';

type Post = DBPost & { author?: DBUser };

/**
 * PC 전용 우측 레일 — '오늘의 추천업체'로 등록된 광고 중 2개를 랜덤 노출.
 * 접속/새로고침마다 매번 다시 뽑는다(기존 광고 셔플과 동일 방식).
 * 모바일에서는 렌더하지 않는다(부모에서 hidden lg:block 처리).
 */
export default function RecommendRail() {
  const [picks, setPicks] = useState<Post[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [publicContact, setPublicContact] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => setPublicContact(d.buy_contact_public !== false))
      .catch(() => {});
  }, []);

  useEffect(() => {
    getAdPosts('recommend', 200)
      .then((d) => {
        const arr = [...(d as Post[])];
        // 접속/새로고침마다 랜덤 2개
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        setPicks(arr.slice(0, 2));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  return (
    <aside className="lg:sticky lg:top-4 self-start space-y-2.5">
      <h2 className="flex items-center gap-1.5 text-[13px] font-bold text-gray-800">
        <Crown size={14} className="text-accent" /> 오늘의 추천업체
      </h2>

      {loaded && picks.length === 0 ? (
        <div className="py-8 px-3 text-center bg-white border border-dashed border-gray-200 rounded-lg">
          <p className="text-[12px] text-gray-500 mb-2">추천업체 모집중입니다.</p>
          <Link href="/board/write?type=buy" className="inline-flex items-center gap-1 text-[11.5px] text-accent font-bold hover:underline">
            <PenSquare size={11} /> 광고 신청 →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {picks.map((p) => (
            <BuyPostCard key={p.id} post={p} publicContact={publicContact} />
          ))}
        </div>
      )}
    </aside>
  );
}
