'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import type { DBMainBanner } from '@/lib/types';

export default function AdminBannersPage() {
  const [items, setItems] = useState<DBMainBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    position: 1,
    title: '',
    subtitle: '',
    image_url: '',
    link_url: '',
    bg_color: '#1E40AF',
    duration_days: 30,
  });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/banners')
      .then(r => r.json())
      .then(d => setItems(d.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return alert('제목 필수');
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/banners', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '등록 실패');
      setShowForm(false);
      setForm({ ...form, title: '', subtitle: '', image_url: '', link_url: '' });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : '실패');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 배너를 삭제하시겠습니까?')) return;
    const res = await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' });
    if (!res.ok) { alert('삭제 실패'); return; }
    load();
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    const res = await fetch(`/api/admin/banners/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current }),
    });
    if (!res.ok) { alert('변경 실패'); return; }
    load();
  };

  return (
    <div className="container-main py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Link href="/admin" className="text-[12px] text-gray-500 hover:text-accent flex items-center gap-1"><ArrowLeft size={12}/>운영자홈</Link>
          <h1 className="text-[18px] font-bold text-gray-800 ml-3">전국 광고 관리 (2×2)</h1>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn-accent h-9 px-4 text-[13px] flex items-center gap-1">
          <Plus size={14}/> 새 배너
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-5 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium text-gray-600">위치 (1~6)</label>
              <select value={form.position} onChange={(e) => setForm({...form, position: Number(e.target.value)})} className="input">
                {[1,2,3,4].map(n => <option key={n} value={n}>{n}번</option>)}
              </select>
            </div>
            <div>
              <label className="text-[12px] font-medium text-gray-600">노출 기간 (일)</label>
              <input type="number" value={form.duration_days} onChange={(e) => setForm({...form, duration_days: Number(e.target.value)})} className="input"/>
            </div>
          </div>
          <div>
            <label className="text-[12px] font-medium text-gray-600">제목 *</label>
            <input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} className="input" required/>
          </div>
          <div>
            <label className="text-[12px] font-medium text-gray-600">부제 (선택)</label>
            <input value={form.subtitle} onChange={(e) => setForm({...form, subtitle: e.target.value})} className="input"/>
          </div>
          <div>
            <label className="text-[12px] font-medium text-gray-600">이미지 URL (선택)</label>
            <input value={form.image_url} onChange={(e) => setForm({...form, image_url: e.target.value})} placeholder="https://..." className="input"/>
          </div>
          <div>
            <label className="text-[12px] font-medium text-gray-600">링크 URL (선택)</label>
            <input value={form.link_url} onChange={(e) => setForm({...form, link_url: e.target.value})} placeholder="/buyer/xxx 또는 https://..." className="input"/>
          </div>
          <div>
            <label className="text-[12px] font-medium text-gray-600">배경 색상</label>
            <input type="color" value={form.bg_color} onChange={(e) => setForm({...form, bg_color: e.target.value})} className="h-10 w-20 border border-gray-300"/>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary h-9 px-4 text-[13px]">취소</button>
            <button type="submit" disabled={submitting} className="btn-accent h-9 px-4 text-[13px]">{submitting ? '등록 중...' : '등록'}</button>
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200">
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-[13px]">불러오는 중...</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-[13px]">등록된 배너가 없습니다.</div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-2.5 px-3 text-left text-[11px] text-gray-500">위치</th>
                <th className="py-2.5 px-3 text-left text-[11px] text-gray-500">제목 / 부제</th>
                <th className="py-2.5 px-3 text-left text-[11px] text-gray-500">만료</th>
                <th className="py-2.5 px-3 text-center text-[11px] text-gray-500">상태</th>
                <th className="py-2.5 px-3 text-center text-[11px] text-gray-500">관리</th>
              </tr>
            </thead>
            <tbody>
              {items.map((b) => (
                <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-bold text-accent">{b.position}번</td>
                  <td className="py-2.5 px-3">
                    <p className="font-bold text-gray-800">{b.title}</p>
                    {b.subtitle && <p className="text-[11px] text-gray-500">{b.subtitle}</p>}
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-gray-500">{new Date(b.expires_at).toLocaleString('ko-KR')}</td>
                  <td className="py-2.5 px-3 text-center">
                    <button onClick={() => handleToggleActive(b.id, b.is_active)}
                      className={`text-[11px] px-2 py-0.5 rounded ${b.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
                      {b.is_active ? '활성' : '비활성'}
                    </button>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button onClick={() => handleDelete(b.id)} className="text-rose-500 hover:text-rose-700"><Trash2 size={14}/></button>
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
