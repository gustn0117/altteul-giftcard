'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CircleDollarSign } from 'lucide-react';

interface UserRow {
  id: string;
  name: string;
  email: string;
  type: string;
  points: number;
  created_at: string;
}

export default function AdminPointsPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/points')
      .then(r => r.json()).then(d => setUsers(d.users ?? []))
      .catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const adjustPoints = async (user_id: string, delta: number) => {
    const reason = prompt('사유를 입력하세요 (선택)') || (delta > 0 ? '운영자 충전' : '운영자 차감');
    setBusyId(user_id);
    try {
      const res = await fetch('/api/admin/points', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id, delta, reason }),
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

  const filtered = search
    ? users.filter(u => u.name?.includes(search) || u.email?.includes(search))
    : users;

  return (
    <div className="container-main py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Link href="/admin" className="text-[12px] text-gray-500 hover:text-accent flex items-center gap-1"><ArrowLeft size={12}/>운영자홈</Link>
          <h1 className="text-[18px] font-bold text-gray-800 ml-3 flex items-center gap-2"><CircleDollarSign size={18} className="text-accent"/>포인트 관리</h1>
        </div>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="이름/이메일 검색"
          className="h-9 px-3 border border-gray-300 text-[13px] w-32 sm:w-60 focus:border-accent focus:outline-none"/>
      </div>

      <div className="bg-white border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-[13px]">불러오는 중...</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-2.5 px-3 text-left text-[11px] text-gray-500">이름</th>
                <th className="py-2.5 px-3 text-left text-[11px] text-gray-500">이메일</th>
                <th className="py-2.5 px-3 text-center text-[11px] text-gray-500">유형</th>
                <th className="py-2.5 px-3 text-right text-[11px] text-gray-500">잔액</th>
                <th className="py-2.5 px-3 text-center text-[11px] text-gray-500">조정</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-bold text-gray-800">{u.name}</td>
                  <td className="py-2.5 px-3 text-[12px] text-gray-500">{u.email}</td>
                  <td className="py-2.5 px-3 text-center text-[11px]">
                    <span className={`px-2 py-0.5 rounded ${u.type === 'business' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {u.type === 'business' ? '업체' : '개인'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-accent tabular-nums">{(u.points ?? 0).toLocaleString()}p</td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="inline-flex gap-1">
                      {[100, 500, 1000, 5000].map(amt => (
                        <button key={amt} onClick={() => adjustPoints(u.id, amt)} disabled={busyId === u.id}
                          className="text-[11px] px-2 py-0.5 border border-emerald-300 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">
                          +{amt}
                        </button>
                      ))}
                      <button onClick={() => {
                        const v = prompt('차감할 포인트 (양수)');
                        if (v && Number(v) > 0) adjustPoints(u.id, -Math.abs(Number(v)));
                      }} disabled={busyId === u.id}
                        className="text-[11px] px-2 py-0.5 border border-rose-300 text-rose-700 hover:bg-rose-50 disabled:opacity-50">
                        차감
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="py-12 text-center text-gray-400">결과 없음</td></tr>
              )}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
