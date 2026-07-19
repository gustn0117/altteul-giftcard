'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Megaphone, Trash2, CheckCircle, RotateCcw } from 'lucide-react';
import { formatPhone } from '@/lib/format';

interface AdInquiry {
  id: string;
  name: string;
  company: string | null;
  phone: string;
  email: string;
  ad_type: string;
  budget: string | null;
  message: string;
  is_resolved: boolean;
  created_at: string;
}

interface ContactInquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  is_resolved: boolean;
  created_at: string;
}

type Tab = 'ad' | 'contact';

export default function AdminInquiriesPage() {
  const [tab, setTab] = useState<Tab>('ad');
  const [ads, setAds] = useState<AdInquiry[]>([]);
  const [contacts, setContacts] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('pending');

  const load = () => {
    setLoading(true);
    fetch('/api/admin/inquiries')
      .then(r => r.json())
      .then(d => { setAds(d.ads ?? []); setContacts(d.contacts ?? []); })
      .catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const toggle = async (id: string, type: Tab, current: boolean) => {
    setBusyId(id);
    try {
      const res = await fetch('/api/admin/inquiries', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type, is_resolved: !current }),
      });
      if (!res.ok) throw new Error((await res.json()).error || '실패');
      load();
    } catch (err) { alert(err instanceof Error ? err.message : '실패'); }
    finally { setBusyId(null); }
  };

  const remove = async (id: string, type: Tab) => {
    if (!confirm('이 문의를 삭제하시겠습니까? 복구 불가합니다.')) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/inquiries?id=${id}&type=${type}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || '실패');
      load();
    } catch (err) { alert(err instanceof Error ? err.message : '실패'); }
    finally { setBusyId(null); }
  };

  const list = tab === 'ad' ? ads : contacts;
  const filtered = filter === 'all' ? list : list.filter((it) => filter === 'pending' ? !it.is_resolved : it.is_resolved);
  const pendingAd = ads.filter((a) => !a.is_resolved).length;
  const pendingContact = contacts.filter((c) => !c.is_resolved).length;

  return (
    <div className="container-main py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-[12px] text-gray-500 hover:text-accent flex items-center gap-1"><ArrowLeft size={12}/>운영자홈</Link>
          <h1 className="text-[18px] font-bold text-gray-800 flex items-center gap-2"><Mail size={18} className="text-accent"/>문의 관리</h1>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex items-center gap-1 mb-3">
        <button onClick={() => setTab('ad')}
          className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-t-lg text-[13px] font-bold transition-colors ${tab === 'ad' ? 'bg-white text-accent border border-b-0 border-gray-200' : 'text-gray-500 hover:text-gray-800'}`}>
          <Megaphone size={13}/> 광고 신청 {pendingAd > 0 && <span className="text-[10px] text-white bg-rose-500 rounded-full px-1.5">{pendingAd}</span>}
        </button>
        <button onClick={() => setTab('contact')}
          className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-t-lg text-[13px] font-bold transition-colors ${tab === 'contact' ? 'bg-white text-accent border border-b-0 border-gray-200' : 'text-gray-500 hover:text-gray-800'}`}>
          <Mail size={13}/> 1:1 문의 {pendingContact > 0 && <span className="text-[10px] text-white bg-rose-500 rounded-full px-1.5">{pendingContact}</span>}
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* 필터 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-1">
            {(['pending', 'resolved', 'all'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-[12px] px-2.5 py-1 rounded ${filter === f ? 'bg-accent text-white font-bold' : 'text-gray-500 hover:text-gray-800'}`}>
                {f === 'pending' ? '미처리' : f === 'resolved' ? '처리완료' : '전체'}
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
            {filtered.map((it) => (
              <div key={it.id} className={`px-4 py-3 ${it.is_resolved ? 'opacity-60 bg-gray-50/50' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[13px] font-bold text-gray-900">{it.name}</span>
                      {tab === 'ad' && (it as AdInquiry).company && (
                        <span className="text-[11px] text-gray-500">· {(it as AdInquiry).company}</span>
                      )}
                      {tab === 'ad' && (
                        <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{(it as AdInquiry).ad_type}</span>
                      )}
                      {tab === 'contact' && (
                        <span className="text-[11px] text-gray-700 font-medium">「{(it as ContactInquiry).subject}」</span>
                      )}
                      {it.is_resolved && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">완료</span>
                      )}
                    </div>
                    <p className="text-[12px] text-gray-700 leading-relaxed mb-1.5 whitespace-pre-wrap">{it.message}</p>
                    <div className="flex items-center gap-2 text-[10.5px] text-gray-400">
                      <a href={`tel:${it.phone}`} className="hover:text-accent">📞 {formatPhone(it.phone)}</a>
                      <span>·</span>
                      <a href={`mailto:${it.email}`} className="hover:text-accent">✉️ {it.email}</a>
                      {tab === 'ad' && (it as AdInquiry).budget && <><span>·</span><span>예산: {(it as AdInquiry).budget}</span></>}
                      <span>·</span>
                      <span>{new Date(it.created_at).toLocaleString('ko-KR')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggle(it.id, tab, it.is_resolved)} disabled={busyId === it.id}
                      className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border transition-colors disabled:opacity-50 ${it.is_resolved ? 'border-gray-300 text-gray-600 hover:bg-gray-100' : 'border-emerald-400 text-emerald-700 hover:bg-emerald-50'}`}>
                      {it.is_resolved ? <><RotateCcw size={11}/> 미처리로</> : <><CheckCircle size={11}/> 완료</>}
                    </button>
                    <button onClick={() => remove(it.id, tab)} disabled={busyId === it.id}
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
