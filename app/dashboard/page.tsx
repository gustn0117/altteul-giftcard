'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getMyPosts } from '@/lib/api';
import type { DBPost } from '@/lib/types';

/** 거래(채팅) 기능이 없는 사이트라 거래 현황 대신 내 글/광고 현황을 보여준다 */
export default function DashboardPage() {
  const { user, isLoggedIn, ready } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<DBPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 로그인 정보를 다 읽기 전에는 판단하지 않는다 (로그인했는데 /login 으로 튕기던 문제)
    if (!ready) return;
    if (!isLoggedIn || !user) {
      router.push('/login');
      return;
    }
    setLoading(true);
    getMyPosts(user.id)
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [ready, user, isLoggedIn, router]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-16 text-center text-zinc-400 text-[13px]">불러오는 중...</div>
      </DashboardLayout>
    );
  }

  const sell = posts.filter((p) => p.type === 'sell');
  const buy = posts.filter((p) => p.type === 'buy');
  const pending = buy.filter((p) => !p.approved_at && !p.completed_at);
  const live = posts.filter((p) => !p.completed_at && (p.type === 'sell' || p.approved_at));
  const totalViews = posts.reduce((s, p) => s + (p.views ?? 0), 0);

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="card p-4">
          <p className="text-[11px] text-zinc-400 mb-1">내 게시글</p>
          <p className="text-2xl font-semibold">{posts.length}<span className="text-[13px] font-normal text-zinc-400 ml-0.5">건</span></p>
          <div className="text-[13px] space-y-1 mt-2">
            <div className="flex justify-between"><span className="text-zinc-500">팝니다</span><span className="font-medium">{sell.length}건</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">삽니다(광고)</span><span className="font-medium">{buy.length}건</span></div>
          </div>
        </div>
        <div className="card p-4">
          <p className="text-[11px] text-zinc-400 mb-1">노출중</p>
          <p className="text-2xl font-semibold text-emerald-600">{live.length}<span className="text-[13px] font-normal text-zinc-400 ml-0.5">건</span></p>
          {pending.length > 0 ? (
            <p className="text-[11px] text-amber-600 mt-2">승인 대기 {pending.length}건</p>
          ) : (
            <p className="text-[11px] text-zinc-400 mt-2">승인 대기 없음</p>
          )}
        </div>
        <div className="card p-4">
          <p className="text-[11px] text-zinc-400 mb-1">총 조회수</p>
          <p className="text-2xl font-semibold text-accent">{totalViews.toLocaleString()}</p>
          <Link href="/dashboard/my-posts" className="text-[11px] text-zinc-400 hover:text-accent mt-2 inline-block">글별 조회수 보기 →</Link>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-title mb-0">최근 내 글</h3>
          <Link href="/dashboard/my-posts" className="text-[11px] text-zinc-500 hover:text-accent">전체 보기 →</Link>
        </div>

        {posts.length === 0 ? (
          <div className="text-center text-zinc-400 text-[13px] py-10 bg-zinc-50 rounded-lg">
            작성한 글이 없습니다.
            <Link href="/board/write?type=buy" className="block mt-2 text-accent font-bold hover:underline">첫 글 작성하기 →</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {posts.slice(0, 10).map((p) => {
              const status = p.completed_at ? '거래완료'
                : (p.type === 'buy' && !p.approved_at) ? '승인 대기' : '노출중';
              return (
                <Link key={p.id} href={`/board/${p.id}`} className="block card card-hover p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className={`shrink-0 badge ${
                        status === '노출중' ? 'bg-emerald-50 text-emerald-600'
                        : status === '승인 대기' ? 'bg-amber-50 text-amber-600'
                        : 'bg-zinc-100 text-zinc-500'
                      }`}>{status}</span>
                      <span className="text-[13px] text-zinc-800 truncate">{p.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400 shrink-0">
                      <span className="whitespace-nowrap">조회 {p.views ?? 0}</span>
                      <span className="whitespace-nowrap">{new Date(p.created_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
