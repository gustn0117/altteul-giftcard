'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getPosts, getChats } from '@/lib/api';
import type { DBPost, DBUser, DBChat } from '@/lib/types';

type PostWithAuthor = DBPost & { author: DBUser };

export default function DashboardPage() {
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [chats, setChats] = useState<DBChat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn || !user) {
      router.push('/login');
      return;
    }
    setLoading(true);
    Promise.all([
      getPosts(),
      getChats(user.id),
    ])
      .then(([allPosts, userChats]) => {
        const myPosts = allPosts.filter(p => p.author_id === user.id);
        setPosts(myPosts);
        setChats(userChats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, isLoggedIn, router]);

  const completedChats = chats.filter(c => c.current_step >= 6 || c.status === '거래완료');
  const activeChats = chats.filter(c => c.current_step >= 2 && c.current_step < 6 && c.status !== '거래완료');
  const delayedChats = chats.filter(c => c.status === '지연');

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-16 text-center text-zinc-400 text-[13px]">불러오는 중...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="card p-4">
          <p className="text-[11px] text-zinc-400 mb-1">거래완료</p>
          <p className="text-2xl font-semibold">{completedChats.length}<span className="text-[13px] font-normal text-zinc-400 ml-0.5">건</span></p>
          <p className="text-[11px] text-zinc-400 mt-2">거래중 {activeChats.length}건 / 지연중 {delayedChats.length}건</p>
        </div>
        <div className="card p-4">
          <p className="text-[11px] text-zinc-400 mb-1">내 게시글</p>
          <p className="text-2xl font-semibold">{posts.length}<span className="text-[13px] font-normal text-zinc-400 ml-0.5">건</span></p>
          <div className="text-[13px] space-y-1 mt-2">
            <div className="flex justify-between"><span className="text-zinc-500">판매글</span><span className="font-medium">{posts.filter(p => p.type === 'sell').length}건</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">구매글</span><span className="font-medium">{posts.filter(p => p.type === 'buy').length}건</span></div>
          </div>
        </div>
        <div className="card p-4">
          <p className="text-[11px] text-zinc-400 mb-1">통계</p>
          <div className="text-[13px] space-y-1 mt-2">
            <div className="flex justify-between"><span className="text-zinc-500">총 완료 건수</span><span className="font-medium">{completedChats.length}건</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">총 채팅 수</span><span className="font-medium">{chats.length}건</span></div>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="section-title">거래 내역</h3>
        <div className="flex gap-4 text-[13px] mb-4">
          <span>거래완료 <span className="font-medium">{completedChats.length}건</span></span>
          <span>거래중 <span className="font-medium text-blue-600">{activeChats.length}건</span></span>
          <span>지연중 <span className="font-medium text-red-500">{delayedChats.length}건</span></span>
        </div>

        {chats.length === 0 ? (
          <div className="text-center text-zinc-400 text-[13px] py-10 bg-zinc-50 rounded-lg">
            최근 거래 내역이 없습니다.
          </div>
        ) : (
          <div className="space-y-2">
            {chats.slice(0, 10).map((chat) => {
              const isBuyer = chat.buyer_id === user?.id;
              const partner = isBuyer ? chat.seller : chat.buyer;
              const statusLabel = chat.current_step >= 6 ? '거래완료' : chat.current_step >= 2 ? '거래중' : '견적대기';
              return (
                <Link key={chat.id} href={`/chat/${chat.id}`} className="block card card-hover p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`badge ${
                        statusLabel === '거래완료' ? 'bg-zinc-100 text-zinc-900' :
                        statusLabel === '거래중' ? 'bg-blue-50 text-blue-600' :
                        'bg-yellow-50 text-yellow-600'
                      }`}>{statusLabel}</span>
                      <span className="text-[13px] text-zinc-800">{chat.post?.title ?? '삭제된 게시글'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                      <span>{partner?.name ?? '알 수 없음'}</span>
                      <span>{new Date(chat.updated_at).toLocaleDateString('ko-KR')}</span>
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
