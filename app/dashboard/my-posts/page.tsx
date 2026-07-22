'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Pencil, Trash2, Eye, ExternalLink } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getMyPosts, deletePost } from '@/lib/api';
import type { DBPost } from '@/lib/types';

type Filter = 'all' | 'sell' | 'buy';

function statusOf(p: DBPost): { label: string; cls: string } {
  if (p.completed_at) return { label: '거래완료', cls: 'bg-zinc-700 text-white' };
  if (p.extension_requested_at) return { label: '연장 신청됨', cls: 'bg-blue-100 text-blue-700' };
  // 만료를 먼저 판단 — 만료되면 승인이 해제되므로 '승인 대기'로 잘못 보이던 문제
  if (p.expires_at && new Date(p.expires_at).getTime() < Date.now()) return { label: '기간 만료', cls: 'bg-rose-100 text-rose-700' };
  if (p.type === 'buy' && !p.approved_at) return { label: '승인 대기', cls: 'bg-amber-100 text-amber-700' };
  return { label: '노출중', cls: 'bg-emerald-100 text-emerald-700' };
}

export default function MyPostsPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<DBPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  const load = () => {
    if (!user?.id) return;
    setLoading(true);
    getMyPosts(user.id)
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [user?.id]);

  const remove = async (id: string) => {
    if (!confirm('이 글을 삭제할까요? 되돌릴 수 없습니다.')) return;
    try {
      await deletePost(id);
      load();
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  const list = filter === 'all' ? posts : posts.filter((p) => p.type === filter);
  const tabs: { k: Filter; label: string; n: number }[] = [
    { k: 'all', label: '전체', n: posts.length },
    { k: 'sell', label: '팝니다', n: posts.filter((p) => p.type === 'sell').length },
    { k: 'buy', label: '삽니다(광고)', n: posts.filter((p) => p.type === 'buy').length },
  ];

  return (
    <DashboardLayout>
      <div className="card p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title mb-0">내 상품 (작성한 글)</h3>
          <Link href="/board/write?type=buy" className="btn-primary h-9 px-4 text-[12px]">글 작성</Link>
        </div>

        {/* 유형 필터 */}
        <div className="flex items-center gap-1 mb-4">
          {tabs.map((t) => (
            <button key={t.k} onClick={() => setFilter(t.k)}
              className={`h-8 px-3 text-[12px] font-bold border transition-colors ${
                filter === t.k ? 'border-accent bg-accent text-white' : 'border-zinc-200 bg-white text-zinc-600 hover:border-accent hover:text-accent'
              }`}>
              {t.label} {t.n}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-12 text-center text-zinc-400 text-[13px]">불러오는 중...</div>
        ) : list.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-zinc-200">
            <p className="text-[13px] text-zinc-500 mb-2">작성한 글이 없습니다.</p>
            <Link href="/board/write?type=buy" className="text-[12px] text-accent font-bold hover:underline">첫 글 작성하기 →</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-150 text-[13px]">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="py-2.5 px-3 text-left text-[11px] text-zinc-500">유형</th>
                  <th className="py-2.5 px-3 text-left text-[11px] text-zinc-500">제목 / 상단문구</th>
                  <th className="py-2.5 px-3 text-center text-[11px] text-zinc-500">상태</th>
                  <th className="py-2.5 px-3 text-center text-[11px] text-zinc-500">율(%)</th>
                  <th className="py-2.5 px-3 text-center text-[11px] text-zinc-500">조회</th>
                  <th className="py-2.5 px-3 text-left text-[11px] text-zinc-500">작성일</th>
                  <th className="py-2.5 px-3 text-center text-[11px] text-zinc-500">관리</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => {
                  const st = statusOf(p);
                  return (
                    <tr key={p.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                      <td className="py-2.5 px-3">
                        <span className={`badge ${p.type === 'sell' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                          {p.type === 'sell' ? '팝니다' : '삽니다'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium max-w-60 truncate">{p.title}</td>
                      <td className="py-2.5 px-3 text-center"><span className={`badge ${st.cls}`}>{st.label}</span></td>
                      <td className="py-2.5 px-3 text-center text-accent font-bold tabular-nums">{p.percentage != null ? `${p.percentage}%` : '-'}</td>
                      <td className="py-2.5 px-3 text-center tabular-nums text-zinc-600">{p.views ?? 0}</td>
                      <td className="py-2.5 px-3 text-zinc-400 text-[11px] whitespace-nowrap">{new Date(p.created_at).toLocaleDateString('ko-KR')}</td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <Link href={`/board/${p.id}`} target="_blank" aria-label="보기" className="inline-flex align-middle mr-2 text-zinc-400 hover:text-accent"><Eye size={14} /></Link>
                        <Link href={`/board/write?edit=${p.id}`} aria-label="수정" className="inline-flex align-middle mr-2 text-zinc-400 hover:text-accent"><Pencil size={14} /></Link>
                        <button onClick={() => remove(p.id)} aria-label="삭제" className="align-middle text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-[11px] text-zinc-400 flex items-center gap-1">
          <ExternalLink size={11} /> 눈 아이콘은 실제 노출 화면, 연필은 수정입니다. 삽니다 광고는 수정 후에도 관리자 승인 상태가 유지됩니다.
        </p>
      </div>
    </DashboardLayout>
  );
}
