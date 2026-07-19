'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Phone, HelpCircle, Lock, ArrowRight } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [loginType, setLoginType] = useState<'normal' | 'business'>('normal');
  const [phone, setPhone] = useState('');
  const [question, setQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const fetchQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phone.trim()) return setError('휴대폰 번호를 입력해주세요.');
    setBusy(true);
    try {
      const res = await fetch('/api/auth/find-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'question', phone: phone.trim(), type: loginType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '조회에 실패했습니다.');
      setQuestion(data.question);
    } catch (err) {
      setError(err instanceof Error ? err.message : '조회 실패');
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!answer.trim()) return setError('답변을 입력해주세요.');
    if (newPassword.length < 6) return setError('새 비밀번호는 6자 이상이어야 합니다.');
    if (newPassword !== newPasswordConfirm) return setError('새 비밀번호가 일치하지 않습니다.');
    setBusy(true);
    try {
      const res = await fetch('/api/auth/find-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'reset', phone: phone.trim(), type: loginType, answer: answer.trim(), newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '재설정에 실패했습니다.');
      setDone(true);
      setTimeout(() => router.push('/login'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : '재설정 실패');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <AuthShell eyebrow="비밀번호 찾기">
        <h1 className="text-[24px] font-bold text-gray-900">비밀번호가 변경되었습니다 ✅</h1>
        <p className="text-[13px] text-gray-500 mt-2">잠시 후 로그인 화면으로 이동합니다.</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow="비밀번호 찾기">
      <h1 className="text-[24px] font-bold text-gray-900 leading-tight">비밀번호 찾기</h1>
      <p className="text-[13px] text-gray-500 mt-2">가입한 휴대폰 번호와 보안질문 답변으로 재설정합니다.</p>

      {/* 회원 유형 */}
      <div className="flex gap-2 mt-5">
        {(['normal', 'business'] as const).map((t) => (
          <button key={t} type="button" onClick={() => { setLoginType(t); setQuestion(null); }}
            className={`flex-1 h-10 text-[13px] font-bold border transition-colors ${
              loginType === t ? 'border-accent bg-accent text-white' : 'border-gray-200 text-gray-600 hover:border-accent'
            }`}>
            {t === 'normal' ? '일반 회원' : '업체 회원'}
          </button>
        ))}
      </div>

      {!question ? (
        <form onSubmit={fetchQuestion} className="space-y-3 mt-4">
          <div className="relative">
            <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="가입한 휴대폰 번호 (010-0000-0000)" className="auth-input pl-9" required autoComplete="tel" />
          </div>
          {error && <div className="px-3 py-2.5 bg-rose-50 border border-rose-200 text-[12px] text-rose-600 rounded-md">{error}</div>}
          <button type="submit" disabled={busy}
            className="w-full h-11 bg-accent hover:bg-blue-700 text-white text-[13px] font-bold rounded-md transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {busy ? '조회 중...' : <>보안질문 확인 <ArrowRight size={14} /></>}
          </button>
        </form>
      ) : (
        <form onSubmit={resetPassword} className="space-y-3 mt-4">
          <div className="px-3 py-2.5 bg-blue-50 border border-blue-200 text-[12.5px] text-blue-800 rounded-md flex items-center gap-2">
            <HelpCircle size={15} className="shrink-0" /> {question}
          </div>
          <div className="relative">
            <HelpCircle size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={answer} onChange={(e) => setAnswer(e.target.value)}
              placeholder="답변" className="auth-input pl-9" required />
          </div>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              placeholder="새 비밀번호 (6자 이상)" minLength={6} className="auth-input pl-9" required autoComplete="new-password" />
          </div>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="password" value={newPasswordConfirm} onChange={(e) => setNewPasswordConfirm(e.target.value)}
              placeholder="새 비밀번호 확인" className="auth-input pl-9" required autoComplete="new-password" />
          </div>
          {error && <div className="px-3 py-2.5 bg-rose-50 border border-rose-200 text-[12px] text-rose-600 rounded-md">{error}</div>}
          <button type="submit" disabled={busy}
            className="w-full h-11 bg-accent hover:bg-blue-700 text-white text-[13px] font-bold rounded-md transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {busy ? '변경 중...' : <>비밀번호 재설정 <ArrowRight size={14} /></>}
          </button>
        </form>
      )}

      <p className="text-center text-[12px] text-gray-500 mt-5">
        <Link href="/login" className="text-accent font-bold hover:underline">로그인으로 돌아가기</Link>
      </p>
    </AuthShell>
  );
}
