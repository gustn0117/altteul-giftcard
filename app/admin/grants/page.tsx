'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye, Plus, X, Clock, Search } from 'lucide-react';

interface GrantUser {
  id: string;
  name: string;
  email: string;
  type: 'normal' | 'business';
  phone: string | null;
  points: number;
  contact_view_until: string | null;
  is_active: boolean;
  created_at: string;
}

const QUICK_HOURS: { label: string; hours: number }[] = [
  { label: '+1시간', hours: 1 },
  { label: '+24시간 (1일)', hours: 24 },
  { label: '+7일', hours: 24 * 7 },
  { label: '+30일', hours: 24 * 30 },
];

function timeLeft(iso: string | null): string {
  if (!iso) return '없음';
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return '만료';
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (d > 0) return `${d}일 ${h}시간 남음`;
  if (h > 0) return `${h}시간 ${m}분 남음`;
  return `${m}분 남음`;
}

export default function AdminGrantsPage() {
  const [users, setUsers] = useState<GrantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'never'>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/grants')
      .then(r => r.json()).then(d => setUsers(d.users ?? []))
      .catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const grant = async (user_id: string, hours: number, mode: 'extend' | 'replace' = 'extend') => {
    const reason = prompt(`사유를 입력하세요 (선택, 예: "5월 입금 1만원")`) || undefined;
    setBusyId(user_id);
    try {
      const res = await fetch('/api/admin/grants', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id, hours, reason, mode }),
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

  const revoke = async (user_id: string) => {
    if (!confirm('이 회원의 연락처 열람 권한을 즉시 회수하시겠습니까?')) return;
    setBusyId(user_id);
    try {
      const res = await fetch(`/api/admin/grants?user_id=${user_id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || '실패');
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : '실패');
    } finally {
      setBusyId(null);
    }
  };

  const customGrant = async (user_id: string) => {
    const v = prompt('부여할 시간(시간 단위, 예: 1=1시간, 24=1일, 720=30일):');
    const hours = Number(v);
    if (!hours || hours <= 0) return;
    await grant(user_id, hours, 'extend');
  };

  const filtered = users.filter((u) => {
    if (search && !u.name?.includes(search) && !u.email?.includes(search)) return false;
    if (filter === 'active') return u.is_active;
    if (filter === 'expired') return !u.is_active && !!u.contact_view_until;
    if (filter === 'never') return !u.contact_view_until;
    return true;
  });

  const counts = {
    active: users.filter((u) => u.is_active).length,
    expired: users.filter((u) => !u.is_active && !!u.contact_view_until).length,
    never: users.filter((u) => !u.contact_view_until).length,
  };

  return (
    <div className="container-main py-6">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/admin" className="text-[12px] text-gray-500 hover:text-accent flex items-center gap-1"><ArrowLeft size={12}/>운영자홈</Link>
        <h1 className="text-[18px] font-bold text-gray-800 flex items-center gap-2"><Eye size={18} className="text-accent"/>연락처 열람 권한 관리</h1>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-[12.5px] text-blue-900 leading-relaxed">
        <strong>운영 가이드</strong> · 팝니다 글의 <strong>전화/문자 연락처는 권한이 활성된 회원만</strong> 볼 수 있습니다.
        입금 확인 후 아래 버튼으로 시간/일 단위로 권한을 부여하세요. 권한 만료 시 자동 회수, 작성자가 판매완료 처리한 글은 권한 회원에게도 가려집니다.
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 gap-3">
          <div className="flex items-center gap-1 flex-wrap">
            {(['all', 'active', 'expired', 'never'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-[12px] px-2.5 py-1 rounded ${filter === f ? 'bg-accent text-white font-bold' : 'text-gray-500 hover:text-gray-800'}`}>
                {f === 'all' ? '전체' : f === 'active' ? `활성 (${counts.active})` : f === 'expired' ? `만료 (${counts.expired})` : `미부여 (${counts.never})`}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="이름/이메일"
              className="h-8 pl-8 pr-3 border border-gray-200 rounded text-[12px] focus:border-accent focus:outline-none w-48"/>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400 text-[13px]">불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-[13px]">결과 없음</div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-2.5 px-3 text-left text-[11px] text-gray-500 font-bold">회원</th>
                <th className="py-2.5 px-3 text-center text-[11px] text-gray-500 font-bold">유형</th>
                <th className="py-2.5 px-3 text-left text-[11px] text-gray-500 font-bold">상태 / 만료</th>
                <th className="py-2.5 px-3 text-center text-[11px] text-gray-500 font-bold">권한 부여 (연장)</th>
                <th className="py-2.5 px-3 text-center text-[11px] text-gray-500 font-bold">관리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 last:border-b-0">
                  <td className="py-2.5 px-3">
                    <p className="font-bold text-gray-900">{u.name}</p>
                    <p className="text-[11px] text-gray-500 truncate max-w-[200px]">{u.email}</p>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`text-[10.5px] font-bold px-1.5 py-0.5 rounded ${u.type === 'business' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                      {u.type === 'business' ? '업체' : '개인'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    {u.is_active ? (
                      <span className="inline-flex items-center gap-1 text-[12px] font-bold text-emerald-700">
                        <Clock size={11}/> 활성 — {timeLeft(u.contact_view_until)}
                      </span>
                    ) : u.contact_view_until ? (
                      <span className="text-[11.5px] text-gray-500">만료됨 ({new Date(u.contact_view_until).toLocaleDateString('ko-KR')})</span>
                    ) : (
                      <span className="text-[11.5px] text-gray-400">권한 없음</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="inline-flex flex-wrap gap-1 justify-center">
                      {QUICK_HOURS.map((q) => (
                        <button key={q.hours} onClick={() => grant(u.id, q.hours, 'extend')} disabled={busyId === u.id}
                          className="text-[10.5px] px-2 py-0.5 border border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded disabled:opacity-50">
                          {q.label}
                        </button>
                      ))}
                      <button onClick={() => customGrant(u.id)} disabled={busyId === u.id}
                        className="text-[10.5px] px-2 py-0.5 border border-blue-300 text-blue-700 hover:bg-blue-50 rounded disabled:opacity-50">
                        <Plus size={10} className="inline"/> 직접
                      </button>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {u.is_active && (
                      <button onClick={() => revoke(u.id)} disabled={busyId === u.id}
                        className="inline-flex items-center gap-1 text-[10.5px] px-2 py-1 border border-rose-300 text-rose-600 hover:bg-rose-50 rounded disabled:opacity-50">
                        <X size={10}/> 회수
                      </button>
                    )}
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
