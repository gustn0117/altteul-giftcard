'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Building2, Mail, Lock, Phone, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AuthShell from '@/components/auth/AuthShell';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    passwordConfirm: '',
    agree: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const change = (k: keyof typeof form, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) return setError('이름(닉네임)을 입력해주세요.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('유효한 이메일 주소를 입력해주세요.');
    if (form.password.length < 6) return setError('비밀번호는 6자 이상이어야 합니다.');
    if (form.password !== form.passwordConfirm) return setError('비밀번호가 일치하지 않습니다.');
    if (!form.agree) return setError('이용약관 및 개인정보 처리방침에 동의해야 가입할 수 있습니다.');

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          password: form.password,
          type: 'normal',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '회원가입에 실패했습니다.');
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim(), password: form.password, loginType: 'normal' }),
      });
      const loginData = await loginRes.json();
      if (loginRes.ok && loginData.user) { login(loginData.user); router.push('/'); }
      else router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell eyebrow="개인 회원가입" headline={'무료로 시작하세요.\n알뜰상품권에서.'} sub="가입하면 매입 업체의 매입률을 한 눈에 비교하고 거래할 수 있습니다.">
      <h1 className="text-[24px] font-bold text-gray-900 leading-tight">계정 만들기</h1>
      <p className="text-[13px] text-gray-500 mt-2">아래 정보를 입력해 회원가입을 진행하세요.</p>

      {/* 가입 유형 */}
      <div className="mt-5 grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 px-3 py-3 border-2 border-accent bg-accent/5 rounded-lg">
          <User size={16} className="text-accent" />
          <div>
            <p className="text-[12px] font-bold text-accent">개인</p>
            <p className="text-[10px] text-gray-500">상품권 매입/매도</p>
          </div>
        </div>
        <Link href="/register-business" className="flex items-center gap-2 px-3 py-3 border border-gray-200 bg-white rounded-lg hover:border-accent transition-colors">
          <Building2 size={16} className="text-gray-500" />
          <div>
            <p className="text-[12px] font-bold text-gray-700">업체</p>
            <p className="text-[10px] text-gray-500">매입 업체 등록</p>
          </div>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 mt-5">
        <Field icon={User} label="이름 / 닉네임">
          <input type="text" value={form.name} onChange={(e) => change('name', e.target.value)}
            placeholder="게시글에 표시될 이름" maxLength={30} className="auth-input" required />
        </Field>

        <Field icon={Mail} label="이메일" hint="로그인 시 사용됩니다.">
          <input type="email" value={form.email} onChange={(e) => change('email', e.target.value)}
            placeholder="example@email.com" className="auth-input" required autoComplete="email" />
        </Field>

        <Field icon={Phone} label="연락처 (선택)">
          <input type="tel" value={form.phone} onChange={(e) => change('phone', e.target.value)}
            placeholder="010-0000-0000" className="auth-input" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field icon={Lock} label="비밀번호">
            <input type="password" value={form.password} onChange={(e) => change('password', e.target.value)}
              placeholder="6자 이상" minLength={6} className="auth-input" required autoComplete="new-password" />
          </Field>
          <Field icon={Lock} label="비밀번호 확인">
            <input type="password" value={form.passwordConfirm} onChange={(e) => change('passwordConfirm', e.target.value)}
              placeholder="다시 한번 입력" className="auth-input" required autoComplete="new-password" />
          </Field>
        </div>

        <label className="flex items-start gap-2 text-[12px] text-gray-600 py-1">
          <input type="checkbox" checked={form.agree} onChange={(e) => change('agree', e.target.checked)}
            className="w-4 h-4 mt-0.5 shrink-0 accent-blue-700" />
          <span>
            <Link href="/terms" target="_blank" className="text-accent hover:underline">이용약관</Link> 및{' '}
            <Link href="/privacy" target="_blank" className="text-accent hover:underline">개인정보 처리방침</Link>에 동의합니다.
          </span>
        </label>

        {error && (
          <div className="px-3 py-2.5 bg-rose-50 border border-rose-200 text-[12px] text-rose-600 rounded-md">{error}</div>
        )}

        <button type="submit" disabled={submitting}
          className="w-full h-11 bg-accent hover:bg-accent/90 text-white text-[13px] font-bold rounded-md transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          {submitting ? '가입 중...' : <>가입하기 <ArrowRight size={14} /></>}
        </button>

        <div className="text-center text-[12px] text-gray-500 pt-1">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-accent font-bold hover:underline">로그인</Link>
        </div>
      </form>
    </AuthShell>
  );
}

function Field({ icon: Icon, label, hint, children }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[12px] font-medium text-gray-700 mb-1">
        <Icon size={12} className="text-gray-400" /> {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}
