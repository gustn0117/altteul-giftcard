'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Users, User as UserIcon, Building2, Megaphone } from 'lucide-react';

type Target = 'all' | 'normal' | 'business' | 'one';

export default function AdminNotifyPage() {
  const [target, setTarget] = useState<Target>('all');
  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return alert('제목을 입력하세요.');
    if (target === 'one' && !userId.trim()) return alert('대상 사용자 ID를 입력하세요.');
    if (!confirm(`정말 ${target === 'all' ? '전체' : target === 'normal' ? '개인 회원' : target === 'business' ? '업체 회원' : '특정 사용자'}에게 발송하시겠습니까?`)) return;
    setBusy(true); setResult(null);
    try {
      const res = await fetch('/api/admin/notify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target,
          user_id: target === 'one' ? userId.trim() : undefined,
          title: title.trim(),
          body: body.trim() || undefined,
          link: link.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '발송 실패');
      setResult(`${data.sent}명에게 발송 완료${data.info ? ` (${data.info})` : ''}`);
      setTitle(''); setBody(''); setLink('');
    } catch (err) {
      alert(err instanceof Error ? err.message : '발송 실패');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-main py-6">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/admin" className="text-[12px] text-gray-500 hover:text-accent flex items-center gap-1"><ArrowLeft size={12}/>운영자홈</Link>
        <h1 className="text-[18px] font-bold text-gray-800 flex items-center gap-2"><Megaphone size={18} className="text-accent"/>알림 발송</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        <form onSubmit={send} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          {/* 대상 선택 */}
          <div>
            <label className="block text-[12px] font-bold text-gray-700 mb-2">발송 대상</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {([
                { v: 'all', label: '전체', Icon: Users },
                { v: 'normal', label: '개인', Icon: UserIcon },
                { v: 'business', label: '업체', Icon: Building2 },
                { v: 'one', label: '특정', Icon: UserIcon },
              ] as const).map(({ v, label, Icon }) => (
                <button key={v} type="button" onClick={() => setTarget(v)}
                  className={`flex items-center justify-center gap-1.5 h-10 rounded-lg text-[12.5px] font-bold border-2 transition-all ${target === v ? 'border-accent bg-accent/5 text-accent' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  <Icon size={14}/> {label}
                </button>
              ))}
            </div>
          </div>

          {target === 'one' && (
            <div>
              <label className="block text-[12px] font-bold text-gray-700 mb-1">대상 사용자 ID (UUID)</label>
              <input value={userId} onChange={(e) => setUserId(e.target.value)}
                placeholder="00000000-0000-0000-0000-000000000000" className="auth-input"/>
              <p className="text-[10.5px] text-gray-400 mt-1">운영자홈 → 회원 탭에서 사용자 ID를 복사하세요.</p>
            </div>
          )}

          <div>
            <label className="block text-[12px] font-bold text-gray-700 mb-1">제목 *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80}
              placeholder="예: 시스템 점검 안내" className="auth-input" required/>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-gray-700 mb-1">내용 (선택)</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} maxLength={500}
              placeholder="알림 본문 (최대 500자)"
              className="w-full p-3 border border-gray-200 rounded-lg text-[13px] resize-none focus:outline-none focus:border-accent focus:ring-3 focus:ring-blue-100"/>
            <p className="text-[10.5px] text-gray-400 mt-1">{body.length}/500자</p>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-gray-700 mb-1">연결 링크 (선택)</label>
            <input value={link} onChange={(e) => setLink(e.target.value)}
              placeholder="/notice 또는 /board/xxx" className="auth-input"/>
            <p className="text-[10.5px] text-gray-400 mt-1">사용자가 알림 클릭 시 이동할 경로</p>
          </div>

          {result && (
            <div className="px-3 py-2.5 bg-emerald-50 border border-emerald-200 text-[12px] text-emerald-700 rounded-md">{result}</div>
          )}

          <button type="submit" disabled={busy}
            className="w-full h-11 bg-accent hover:bg-blue-700 text-white text-[13px] font-bold rounded-md transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            <Send size={14}/> {busy ? '발송 중...' : '알림 발송'}
          </button>
        </form>

        <aside className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-[12px] font-bold text-amber-900 mb-1">⚠️ 발송 전 확인</p>
            <ul className="text-[11px] text-amber-800 space-y-1 leading-relaxed">
              <li>· 발송된 알림은 회수 불가</li>
              <li>· 전체 발송은 서버에 부하 가능 (1000명씩 분할)</li>
              <li>· 사용자 알림 종(Header)에 즉시 표시</li>
            </ul>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-[12px] font-bold text-blue-900 mb-1">💡 활용 예시</p>
            <ul className="text-[11px] text-blue-800 space-y-1 leading-relaxed">
              <li>· 점검 / 새 기능 안내</li>
              <li>· 업체 전체에게 정책 변경 통보</li>
              <li>· 특정 사용자에게 답변 알림</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
