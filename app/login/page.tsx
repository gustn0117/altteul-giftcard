'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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
  const [businessNumber, setBusinessNumber] = useState('');
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
      // 업체는 사업자번호를 내부 이메일 형식으로 변환
      const loginEmail =
        loginType === 'business'
          ? `${businessNumber.replace(/-/g, '')}@biz.altteul-giftcard`
          : email.trim();

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password, loginType }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '로그인에 실패했습니다.');
        setSubmitting(false);
        return;
      }
      login(data.user);
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.push(loginType === 'business' ? '/dashboard' : '/');
      }
    } catch {
      setError('로그인에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-5 py-8">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-6">
          <Image src="/logo-dark.svg" alt="알뜰상품권" width={140} height={40} className="h-10 w-auto object-contain mx-auto mb-3" priority />
          <h1 className="text-[16px] font-bold text-gray-900">로그인</h1>
          <p className="text-[12px] text-gray-500 mt-1">알뜰상품권에 오신 것을 환영합니다.</p>
          {redirectTo && (
            <p className="text-[11px] text-accent mt-1">로그인 후 이전 페이지로 이동합니다.</p>
          )}
        </div>

        {/* 로그인 타입 탭 */}
        <div className="grid grid-cols-2 gap-0 mb-0 bg-white border border-gray-200 border-b-0">
          <button
            type="button"
            onClick={() => { setLoginType('normal'); setError(null); }}
            className={`flex items-center justify-center gap-1.5 py-3 text-[13px] font-bold transition-colors border-b-2 ${
              loginType === 'normal' ? 'text-accent border-accent bg-accent/5' : 'text-gray-500 border-transparent hover:text-accent'
            }`}
          >
            <User size={14} /> 개인 로그인
          </button>
          <button
            type="button"
            onClick={() => { setLoginType('business'); setError(null); }}
            className={`flex items-center justify-center gap-1.5 py-3 text-[13px] font-bold transition-colors border-b-2 ${
              loginType === 'business' ? 'text-accent border-accent bg-accent/5' : 'text-gray-500 border-transparent hover:text-accent'
            }`}
          >
            <Building2 size={14} /> 업체 로그인
          </button>
        </div>

        <div className="bg-white border border-gray-200 p-5">
          <form onSubmit={handleLogin} className="space-y-3">
            {loginType === 'normal' ? (
              <div>
                <label className="block text-[12px] font-medium text-gray-600 mb-1">이메일 *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full h-10 px-3 border border-gray-300 text-[13px] focus:border-accent focus:outline-none"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-[12px] font-medium text-gray-600 mb-1">사업자 등록번호 *</label>
                <input
                  type="text"
                  value={businessNumber}
                  onChange={(e) => setBusinessNumber(e.target.value)}
                  placeholder="000-00-00000"
                  className="w-full h-10 px-3 border border-gray-300 text-[13px] focus:border-accent focus:outline-none"
                  required
                />
                <p className="text-[11px] text-gray-400 mt-1">업체 등록 시 입력한 사업자등록번호를 입력하세요.</p>
              </div>
            )}

            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">비밀번호 *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full h-10 px-3 border border-gray-300 text-[13px] focus:border-accent focus:outline-none"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-[12px] text-red-600">{error}</div>
            )}

            <button type="submit" disabled={submitting} className="btn-accent w-full h-11 text-[13px] disabled:opacity-60">
              {submitting ? '로그인 중...' : '로그인'}
            </button>
          </form>

          {/* 안내 */}
          <div className="flex items-center justify-between mt-4 text-[11px] text-gray-400">
            <Link href={loginType === 'business' ? '/register-business' : '/register'} className="hover:text-accent transition-colors">
              {loginType === 'business' ? '업체 회원가입' : '개인 회원가입'}
            </Link>
            <button type="button" className="hover:text-accent transition-colors">비밀번호 찾기</button>
          </div>

          <div className="mt-5 bg-gray-50 border border-gray-100 p-3 text-[12px] text-gray-600">
            {loginType === 'normal' ? (
              <>
                <p className="font-medium text-gray-800 mb-1">개인 회원이세요?</p>
                <p className="text-[11px] text-gray-500">상품권을 직접 사고 팔며, 업체와 전화·문자로 거래할 수 있습니다.</p>
                <Link href="/register" className="block mt-2 font-medium text-accent">개인 회원가입 →</Link>
              </>
            ) : (
              <>
                <p className="font-medium text-gray-800 mb-1">매입 업체이세요?</p>
                <p className="text-[11px] text-gray-500">사업자 등록 후 광고 노출 및 프리미엄 업체로 활동할 수 있습니다.</p>
                <Link href="/register-business" className="block mt-2 font-medium text-accent">업체 등록 신청하기 →</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center text-gray-400 text-[13px]">불러오는 중...</div>}>
      <LoginContent />
    </Suspense>
  );
}
