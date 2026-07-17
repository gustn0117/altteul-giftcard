'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Building2, Mail, Lock, Phone, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AuthShell from '@/components/auth/AuthShell';

type LoginType = 'normal' | 'business';

function safeRedirect(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    if (!decoded.startsWith('/') || decoded.startsWith('//')) return null;
    return decoded;
  } catch {
    return null;
  }
}

function LoginContent() {
  const [loginType, setLoginType] = useState<LoginType>('normal');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeRedirect(searchParams.get('redirect'));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      // 일반/업체 모두 휴대폰 번호가 아이디 (예전엔 업체를 가짜 이메일로 변환해 조회했음)
      const identifier = loginType === 'business' ? businessPhone.trim() : email.trim();

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: identifier, password, loginType }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '로그인에 실패했습니다.');
        setSubmitting(false);
        return;
      }
      login(data.user);
      if (redirectTo) router.push(redirectTo);
      else router.push(loginType === 'business' ? '/dashboard' : '/');
    } catch {
      setError('로그인에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell eyebrow="로그인">
      <h1 className="text-[26px] font-bold text-gray-900 leading-tight">다시 만나서 반가워요 👋</h1>
      <p className="text-[13px] text-gray-500 mt-2">계정 정보를 입력해 로그인하세요.</p>
      {redirectTo && (
        <p className="text-[12px] text-accent mt-1.5">로그인 후 이전 페이지로 돌아갑니다.</p>
      )}

      <div className="mt-6 grid grid-cols-2 p-1 bg-gray-100 rounded-lg">
        {([
          { v: 'normal', label: '개인', Icon: User },
          { v: 'business', label: '업체', Icon: Building2 },
        ] as const).map(({ v, label, Icon }) => (
          <button
            key={v}
            type="button"
            onClick={() => { setLoginType(v); setError(null); }}
            className={`flex items-center justify-center gap-1.5 py-2 text-[13px] font-bold rounded-md transition-all ${
              loginType === v ? 'bg-white text-accent shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleLogin} className="space-y-3 mt-5">
        {loginType === 'normal' ? (
          <Field icon={Phone} label="휴대폰 번호" hint="가입 시 입력한 휴대폰 번호">
            <input
              type="tel"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="010-0000-0000"
              className="auth-input"
              required
              autoComplete="tel"
            />
          </Field>
        ) : (
          <Field icon={Phone} label="휴대폰 번호" hint="가입 시 입력한 휴대폰 번호">
            <input
              type="tel"
              value={businessPhone}
              onChange={(e) => setBusinessPhone(e.target.value)}
              placeholder="010-0000-0000"
              className="auth-input"
              required
            />
          </Field>
        )}

        <Field icon={Lock} label="비밀번호">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요"
            className="auth-input"
            required
            autoComplete="current-password"
          />
        </Field>

        {error && (
          <div className="px-3 py-2.5 bg-rose-50 border border-rose-200 text-[12px] text-rose-600 rounded-md">{error}</div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full h-11 bg-accent hover:bg-accent/90 text-white text-[13px] font-bold rounded-md transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {submitting ? '로그인 중...' : <>로그인 <ArrowRight size={14} /></>}
        </button>

        <div className="flex items-center justify-between text-[12px] text-gray-500 pt-1">
          <Link
            href={loginType === 'business' ? '/register-business' : '/register'}
            className="hover:text-accent transition-colors"
          >
            {loginType === 'business' ? '업체 회원가입' : '개인 회원가입'}
          </Link>
          <button type="button" className="hover:text-accent transition-colors">비밀번호 찾기</button>
        </div>
      </form>

      <div className="mt-6 p-3.5 rounded-lg bg-blue-50/60 border border-blue-100 text-[12px] text-gray-700 leading-relaxed">
        {loginType === 'normal' ? (
          <>
            <strong className="text-blue-900">개인 회원이세요?</strong> 상품권을 직접 사고 팔며,
            업체와 전화·문자로 거래할 수 있습니다.{' '}
            <Link href="/register" className="font-bold text-accent hover:underline">개인 회원가입 →</Link>
          </>
        ) : (
          <>
            <strong className="text-blue-900">매입 업체이세요?</strong> 사업자 등록 후 광고 노출 및
            프리미엄 활동이 가능합니다.{' '}
            <Link href="/register-business" className="font-bold text-accent hover:underline">업체 등록 신청 →</Link>
          </>
        )}
      </div>
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-gray-400 text-[13px]">불러오는 중...</div>}>
      <LoginContent />
    </Suspense>
  );
}
