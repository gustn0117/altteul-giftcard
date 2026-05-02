'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';

interface UserMini { id: string; name: string; email: string; }
interface Report {
  id: string;
  reporter_id: string | null;
  reported_user_id: string | null;
  reason: string;
  description: string | null;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  reporter?: UserMini | null;
  reported?: UserMini | null;
}

export default function AdminReportsPage() {
  const [items, setItems] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/reports')
      .then(r => r.json()).then(d => setItems(d.items ?? []))
      .catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: Report['status']) => {
    setBusyId(id);
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error((await res.json()).error || '실패');
      load();
    } catch (err) { alert(err instanceof Error ? err.message : '실패'); }
    finally { setBusyId(null); }
  };

  const remove = async (id: string) => {
    if (!confirm('이 신고를 삭제하시겠습니까?')) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/reports?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || '실패');
      load();
    } catch (err) { alert(err instanceof Error ? err.message : '실패'); }
    finally { setBusyId(null); }
  };

  const filtered = filter === 'all' ? items : items.filter((it) => it.status === filter);
  const counts = {
    pending: items.filter((i) => i.status === 'pending').length,
    resolved: items.filter((i) => i.status === 'resolved').length,
    dismissed: items.filter((i) => i.status === 'dismissed').length,
  };

  return (
    <div className="container-main py-6">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/admin" className="text-[12px] text-gray-500 hover:text-accent flex items-center gap-1"><ArrowLeft size={12}/>운영자홈</Link>
        <h1 className="text-[18px] font-bold text-gray-800 flex items-center gap-2"><ShieldAlert size={18} className="text-rose-500"/>사기 신고 관리</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-1">
            {(['pending', 'resolved', 'dismissed', 'all'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`inline-flex items-center gap-1 text-[12px] px-2.5 py-1 rounded ${filter === f ? 'bg-accent text-white font-bold' : 'text-gray-500 hover:text-gray-800'}`}>
                {f === 'pending' && <Clock size={11}/>}
                {f === 'resolved' && <CheckCircle size={11}/>}
                {f === 'dismissed' && <XCircle size={11}/>}
                {f === 'pending' ? '대기' : f === 'resolved' ? '처리완료' : f === 'dismissed' ? '기각' : '전체'}
                {f !== 'all' && counts[f] > 0 && <span className={`text-[10px] px-1 rounded ${filter === f ? 'bg-white/30' : 'bg-rose-100 text-rose-600'}`}>{counts[f]}</span>}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-gray-500">{filtered.length}건</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400 text-[13px]">불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-[13px]">결과 없음</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((r) => (
              <div key={r.id} className={`px-4 py-3.5 ${r.status !== 'pending' ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">{r.reason}</span>
                      {r.status === 'resolved' && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">처리완료</span>}
                      {r.status === 'dismissed' && <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-bold">기각</span>}
                    </div>
                    <p className="text-[12.5px] text-gray-700 mb-2 whitespace-pre-wrap">{r.description || <span className="italic text-gray-400">설명 없음</span>}</p>
                    <div className="flex items-center gap-3 text-[10.5px] text-gray-500">
                      <span>신고자: <strong className="text-gray-700">{r.reporter?.name || '익명'}</strong></span>
                      <span>→</span>
                      <span>대상: <strong className="text-rose-600">{r.reported?.name || '알 수 없음'}</strong></span>
                      <span>·</span>
                      <span>{new Date(r.created_at).toLocaleString('ko-KR')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {r.status === 'pending' && (
                      <>
                        <button onClick={() => setStatus(r.id, 'resolved')} disabled={busyId === r.id}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-emerald-400 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">
                          <CheckCircle size={11}/> 처리
                        </button>
                        <button onClick={() => setStatus(r.id, 'dismissed')} disabled={busyId === r.id}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50">
                          <XCircle size={11}/> 기각
                        </button>
                      </>
                    )}
                    {r.status !== 'pending' && (
                      <button onClick={() => setStatus(r.id, 'pending')} disabled={busyId === r.id}
                        className="text-[11px] px-2 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50">
                        대기로
                      </button>
                    )}
                    <button onClick={() => remove(r.id)} disabled={busyId === r.id}
                      className="text-rose-500 hover:text-rose-700 disabled:opacity-50 p-1.5">
                      <Trash2 size={13}/>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
