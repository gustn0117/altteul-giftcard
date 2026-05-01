'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { User, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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

  const handleChange = (field: keyof typeof form, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      // 자동 로그인
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim(), password: form.password, loginType: 'normal' }),
      });
      const loginData = await loginRes.json();
      if (loginRes.ok && loginData.user) {
        login(loginData.user);
        router.push('/');
      } else {
        router.push('/login');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-5 py-8">
      <div className="w-full max-w-[460px]">
        <div className="text-center mb-6">
          <Image src="/logo-dark.png" alt="알뜰상품권" width={140} height={40} className="h-10 w-auto object-contain mx-auto mb-3" priority />
          <h1 className="text-[16px] font-bold text-gray-900">회원가입</h1>
          <p className="text-[12px] text-gray-500 mt-1">무료로 가입하고 상품권을 사고파세요.</p>
        </div>

        {/* 가입 유형 선택 */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="border-2 border-accent bg-accent/5 p-3 text-center">
            <User size={18} className="mx-auto text-accent mb-1" />
            <p className="text-[12px] font-bold text-accent">개인 회원가입</p>
            <p className="text-[10px] text-gray-500 mt-0.5">상품권 매입/매도</p>
          </div>
          <Link href="/register-business" className="border border-gray-200 bg-white p-3 text-center hover:border-accent transition-colors">
            <Building2 size={18} className="mx-auto text-gray-500 mb-1" />
            <p className="text-[12px] font-bold text-gray-700">업체 회원가입</p>
            <p className="text-[10px] text-gray-500 mt-0.5">매입 업체 등록</p>
          </Link>
        </div>

        <div className="bg-white border border-gray-200 p-5">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">이름 / 닉네임 *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => handleChange('name', e.target.value)}
                placeholder="게시글에 표시될 이름"
                maxLength={30}
                className="w-full h-10 px-3 border border-gray-300 text-[13px] focus:border-accent focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">이메일 *</label>
              <input
                type="email"
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                placeholder="example@email.com"
                className="w-full h-10 px-3 border border-gray-300 text-[13px] focus:border-accent focus:outline-none"
                required
              />
              <p className="text-[11px] text-gray-400 mt-1">로그인 시 사용됩니다. 유효한 이메일을 입력해주세요.</p>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">연락처 (선택)</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => handleChange('phone', e.target.value)}
                placeholder="010-0000-0000"
                className="w-full h-10 px-3 border border-gray-300 text-[13px] focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">비밀번호 *</label>
              <input
                type="password"
                value={form.password}
                onChange={e => handleChange('password', e.target.value)}
                placeholder="6자 이상"
                minLength={6}
                className="w-full h-10 px-3 border border-gray-300 text-[13px] focus:border-accent focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">비밀번호 확인 *</label>
              <input
                type="password"
                value={form.passwordConfirm}
                onChange={e => handleChange('passwordConfirm', e.target.value)}
                placeholder="다시 한번 입력"
                className="w-full h-10 px-3 border border-gray-300 text-[13px] focus:border-accent focus:outline-none"
                required
              />
            </div>

            <label className="flex items-start gap-2 text-[12px] text-gray-600 py-1">
              <input
                type="checkbox"
                checked={form.agree}
                onChange={e => handleChange('agree', e.target.checked)}
                className="w-4 h-4 mt-0.5 shrink-0"
              />
              <span>
                <Link href="/terms" target="_blank" className="text-accent hover:underline">이용약관</Link> 및{' '}
                <Link href="/privacy" target="_blank" className="text-accent hover:underline">개인정보 처리방침</Link>에 동의합니다.
              </span>
            </label>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-[12px] text-red-600">{error}</div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-accent w-full h-11 text-[13px] disabled:opacity-60"
            >
              {submitting ? '가입 중...' : '가입하기'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-100 text-center text-[12px] text-gray-500">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-accent font-bold hover:underline">로그인</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
