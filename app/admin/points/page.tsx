'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CircleDollarSign } from 'lucide-react';

interface UserRow {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  type: string;
  points: number;
  created_at: string;
}

export default function AdminPointsPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  // 회원별 충전/차감 금액 입력값
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  const load = () => {
    setLoading(true);
    fetch('/api/admin/points')
      .then(r => r.json()).then(d => setUsers(d.users ?? []))
      .catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // "1,000" / "1000p" / "1000 원" 처럼 입력해도 숫자만 뽑아낸다 (예전엔 Number("1,000")=NaN 이라 조용히 무시됐음)
  const parseAmount = (raw: string): number | null => {
    const n = Number(String(raw).replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
  };

  const adjustPoints = async (user_id: string, delta: number) => {
    setBusyId(user_id);
    try {
      const res = await fetch('/api/admin/points', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id, delta, reason: delta > 0 ? '운영자 충전' : '운영자 차감' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '실패');
      setAmounts((p) => ({ ...p, [user_id]: '' }));
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : '실패');
    } finally {
      setBusyId(null);
    }
  };

  // 입력한 금액 그대로 충전/차감 (sign: +1 충전, -1 차감)
  const submitAmount = (u: { id: string; name?: string; points?: number | null }, sign: 1 | -1) => {
    const amt = parseAmount(amounts[u.id] ?? '');
    if (amt === null) { alert('충전/차감할 포인트를 숫자로 입력해주세요.'); return; }
    const after = (u.points ?? 0) + sign * amt;
    if (after < 0) { alert(`잔액보다 많이 차감할 수 없습니다.\n현재 ${(u.points ?? 0).toLocaleString()}p → ${after.toLocaleString()}p`); return; }
    const label = sign > 0 ? '충전' : '차감';
    if (!confirm(`${u.name} 님에게 ${amt.toLocaleString()}p ${label}합니다.\n${(u.points ?? 0).toLocaleString()}p → ${after.toLocaleString()}p`)) return;
    adjustPoints(u.id, sign * amt);
  };

  const filtered = search
    ? users.filter(u => u.name?.includes(search) || u.phone?.includes(search))
    : users;

  return (
    <div className="container-main py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Link href="/admin" className="text-[12px] text-gray-500 hover:text-accent flex items-center gap-1"><ArrowLeft size={12}/>운영자홈</Link>
          <h1 className="text-[18px] font-bold text-gray-800 ml-3 flex items-center gap-2"><CircleDollarSign size={18} className="text-accent"/>포인트 관리</h1>
        </div>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="이름/연락처 검색"
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
                <th className="py-2.5 px-3 text-left text-[11px] text-gray-500">연락처</th>
                <th className="py-2.5 px-3 text-center text-[11px] text-gray-500">유형</th>
                <th className="py-2.5 px-3 text-right text-[11px] text-gray-500">잔액</th>
                <th className="py-2.5 px-3 text-center text-[11px] text-gray-500">조정</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-bold text-gray-800">{u.name}</td>
                  <td className="py-2.5 px-3 text-[12px] text-gray-500">{u.phone || '-'}</td>
                  <td className="py-2.5 px-3 text-center text-[11px]">
                    <span className={`px-2 py-0.5 rounded ${u.type === 'business' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {u.type === 'business' ? '업체' : '개인'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-accent tabular-nums">{(u.points ?? 0).toLocaleString()}p</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                      <input
                        value={amounts[u.id] ?? ''}
                        onChange={(e) => setAmounts((p) => ({ ...p, [u.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') submitAmount(u, 1); }}
                        inputMode="numeric"
                        placeholder="금액 입력"
                        disabled={busyId === u.id}
                        className="h-8 w-28 px-2 border border-gray-300 text-[12px] text-right tabular-nums focus:border-accent focus:outline-none disabled:opacity-50"
                      />
                      <button onClick={() => submitAmount(u, 1)} disabled={busyId === u.id}
                        className="h-8 px-3 text-[12px] font-bold border border-emerald-300 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">
                        충전
                      </button>
                      <button onClick={() => submitAmount(u, -1)} disabled={busyId === u.id}
                        className="h-8 px-3 text-[12px] font-bold border border-rose-300 text-rose-700 hover:bg-rose-50 disabled:opacity-50">
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
