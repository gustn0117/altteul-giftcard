'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock, Unlock } from 'lucide-react';

interface BlindedPost {
  id: string;
  type: string;
  title: string;
  author_id: string | null;
  guest_name: string | null;
  expires_at: string | null;
  created_at: string;
}

interface BlindedBanner {
  id: string;
  position: number;
  title: string;
  expires_at: string;
}

export default function AdminBlindedPage() {
  const [posts, setPosts] = useState<BlindedPost[]>([]);
  const [banners, setBanners] = useState<BlindedBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/unblind')
      .then(r => r.json())
      .then(d => { setPosts(d.posts ?? []); setBanners(d.banners ?? []); })
      .catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const unblindPost = async (post_id: string) => {
    if (!confirm('이 글을 다시 활성화 (7일 연장)하시겠습니까?')) return;
    setBusyId(post_id);
    try {
      const res = await fetch('/api/admin/unblind', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '실패');
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : '실패');
    } finally {
      setBusyId(null);
    }
  };

  const unblindBanner = async (banner_id: string) => {
    if (!confirm('이 배너를 다시 활성화 (30일 연장)하시겠습니까?')) return;
    setBusyId(banner_id);
    try {
      const res = await fetch('/api/admin/unblind', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banner_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '실패');
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : '실패');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="container-main py-6">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/admin" className="text-[12px] text-gray-500 hover:text-accent flex items-center gap-1"><ArrowLeft size={12}/>운영자홈</Link>
        <h1 className="text-[18px] font-bold text-gray-800 ml-3 flex items-center gap-2"><Lock size={18} className="text-amber-500"/>블라인드 관리</h1>
      </div>

      <h2 className="text-[14px] font-bold text-gray-800 mb-2">잠긴 글 ({posts.length})</h2>
      <div className="bg-white border border-gray-200 mb-6">
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-[13px]">불러오는 중...</div>
        ) : posts.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-[13px]">잠긴 글이 없습니다.</div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-2.5 px-3 text-left text-[11px] text-gray-500">유형</th>
                <th className="py-2.5 px-3 text-left text-[11px] text-gray-500">제목</th>
                <th className="py-2.5 px-3 text-left text-[11px] text-gray-500">작성</th>
                <th className="py-2.5 px-3 text-left text-[11px] text-gray-500">만료일</th>
                <th className="py-2.5 px-3 text-center text-[11px] text-gray-500">조치</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2.5 px-3 text-[11px]">
                    <span className={`px-2 py-0.5 rounded ${p.type === 'sell' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}>
                      {p.type === 'sell' ? '팝니다' : '삽니다'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <Link href={`/board/${p.id}`} className="text-gray-800 hover:text-accent font-medium">{p.title}</Link>
                  </td>
                  <td className="py-2.5 px-3 text-[12px] text-gray-500">
                    {p.guest_name || (p.author_id ? '회원' : '비회원')}
                    <span className="block text-[10px] text-gray-400">{new Date(p.created_at).toLocaleDateString('ko-KR')}</span>
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-rose-500">{p.expires_at && new Date(p.expires_at).toLocaleString('ko-KR')}</td>
                  <td className="py-2.5 px-3 text-center">
                    <button onClick={() => unblindPost(p.id)} disabled={busyId === p.id}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-1 border border-emerald-400 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">
                      <Unlock size={11}/> 풀기
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <h2 className="text-[14px] font-bold text-gray-800 mb-2">비활성 배너 ({banners.length})</h2>
      <div className="bg-white border border-gray-200">
        {banners.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-[13px]">비활성 배너 없음.</div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-2.5 px-3 text-left text-[11px] text-gray-500">위치</th>
                <th className="py-2.5 px-3 text-left text-[11px] text-gray-500">제목</th>
                <th className="py-2.5 px-3 text-left text-[11px] text-gray-500">만료일</th>
                <th className="py-2.5 px-3 text-center text-[11px] text-gray-500">조치</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((b) => (
                <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-bold text-accent">{b.position}번</td>
                  <td className="py-2.5 px-3">{b.title}</td>
                  <td className="py-2.5 px-3 text-[11px] text-gray-500">{new Date(b.expires_at).toLocaleString('ko-KR')}</td>
                  <td className="py-2.5 px-3 text-center">
                    <button onClick={() => unblindBanner(b.id)} disabled={busyId === b.id}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-1 border border-emerald-400 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">
                      <Unlock size={11}/> 활성화
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
