'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Building2, Mail, Lock, Phone, Hash, MessageCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AuthShell from '@/components/auth/AuthShell';

type RegisterType = 'normal' | 'business';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = (searchParams.get('type') as RegisterType) === 'business' ? 'business' : 'normal';
  const { login } = useAuth();
  const [type, setType] = useState<RegisterType>(initialType);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 공통 + 분기 필드
  const [form, setForm] = useState({
    // 개인
    name: '',
    email: '',
    phone: '',
    // 업체
    businessName: '',
    businessNumber: '',
    representative: '',
    messenger: '',
    messengerId: '',
    // 공통
    password: '',
    passwordConfirm: '',
    agree: false,
  });

  const change = (k: keyof typeof form, v: string | boolean) => {
    setForm((p) => ({ ...p, [k]: v }));
    setError(null);
  };

  const switchType = (next: RegisterType) => {
    setType(next);
    setError(null);
    // URL 동기화 (뒤로가기 호환)
    const params = new URLSearchParams();
    if (next === 'business') params.set('type', 'business');
    router.replace(`/register${params.toString() ? '?' + params : ''}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 공통 검증
    if (form.password.length < 6) return setError('비밀번호는 6자 이상이어야 합니다.');
    if (form.password !== form.passwordConfirm) return setError('비밀번호가 일치하지 않습니다.');
    if (!form.agree) return setError('이용약관 및 개인정보 처리방침에 동의해야 가입할 수 있습니다.');

    let payload: Record<string, unknown>;
    if (type === 'normal') {
      if (!form.name.trim()) return setError('이름(닉네임)을 입력해주세요.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('유효한 이메일 주소를 입력해주세요.');
      payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        password: form.password,
        type: 'normal',
      };
    } else {
      if (!form.businessName.trim()) return setError('사업체명을 입력해주세요.');
      if (!/^\d{10}$/.test(form.businessNumber.replace(/-/g, ''))) return setError('사업자등록번호는 숫자 10자리여야 합니다.');
      if (!form.representative.trim()) return setError('대표자명을 입력해주세요.');
      if (!form.phone.trim()) return setError('연락처를 입력해주세요.');
      if (!form.messenger || !form.messengerId.trim()) return setError('메신저 종류와 아이디를 모두 입력해주세요.');
      payload = {
        name: form.businessName.trim(),
        email: `${form.businessNumber.replace(/-/g, '')}@biz.altteul-giftcard`,
        password: form.password,
        phone: form.phone || null,
        type: 'business',
      };
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '회원가입에 실패했습니다.');

      if (type === 'normal') {
        // 자동 로그인
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email.trim(), password: form.password, loginType: 'normal' }),
        });
        const loginData = await loginRes.json();
        if (loginRes.ok && loginData.user) { login(loginData.user); router.push('/'); }
        else router.push('/login');
      } else {
        setDone(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 업체 가입 완료 화면
  if (done) {
    return (
      <AuthShell eyebrow="등록 완료" headline={'업체 등록이 완료됐어요.\n바로 로그인 해보세요.'} sub="">
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 mb-4">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h1 className="text-[22px] font-bold text-gray-900 mb-2">신청이 완료되었습니다</h1>
          <p className="text-[13px] text-gray-500 mb-6">
            사업자등록번호와 설정하신 비밀번호로<br/>바로 로그인할 수 있습니다.
          </p>
          <Link href="/login" className="inline-flex items-center gap-2 h-11 px-6 bg-accent hover:bg-blue-700 text-white text-[13px] font-bold rounded-md transition-colors">
            로그인 하러가기 <ArrowRight size={14} />
          </Link>
        </div>
      </AuthShell>
    );
  }

  const headline = type === 'normal'
    ? '무료로 시작하세요.\n알뜰상품권에서.'
    : '매입 업체로\n등록해보세요.';
  const sub = type === 'normal'
    ? '가입하면 매입 업체의 매입률을 한 눈에 비교하고 거래할 수 있습니다.'
    : '등록 후 광고 노출, 프리미엄 활동, 상담 문의를 받아보실 수 있습니다.';

  return (
    <AuthShell eyebrow="회원가입" headline={headline} sub={sub}>
      <h1 className="text-[24px] font-bold text-gray-900 leading-tight">계정 만들기</h1>
      <p className="text-[13px] text-gray-500 mt-2">
        {type === 'normal' ? '아래 정보를 입력해 회원가입을 진행하세요.' : '사업자 정보와 담당 메신저를 입력해주세요.'}
      </p>

      {/* 가입 유형 토글 */}
      <div className="mt-5 grid grid-cols-2 p-1 bg-gray-100 rounded-lg">
        {([
          { v: 'normal', label: '개인 회원', Icon: User, desc: '상품권 매입/매도' },
          { v: 'business', label: '업체 회원', Icon: Building2, desc: '매입 업체 등록' },
        ] as const).map(({ v, label, Icon, desc }) => (
          <button
            key={v}
            type="button"
            onClick={() => switchType(v)}
            className={`flex items-center justify-center gap-2 py-2.5 text-[13px] font-bold rounded-md transition-all ${
              type === v ? 'bg-white text-accent shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}
            title={desc}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 mt-5">
        {type === 'normal' ? (
          /* 개인 폼 */
          <>
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
          </>
        ) : (
          /* 업체 폼 */
          <>
            <Field icon={Building2} label="사업체명">
              <input type="text" value={form.businessName} onChange={(e) => change('businessName', e.target.value)}
                placeholder="사업체명을 입력하세요" className="auth-input" required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field icon={Hash} label="사업자등록번호" hint="10자리 숫자">
                <input type="text" value={form.businessNumber} onChange={(e) => change('businessNumber', e.target.value)}
                  placeholder="000-00-00000" className="auth-input" required />
              </Field>
              <Field icon={User} label="대표자명">
                <input type="text" value={form.representative} onChange={(e) => change('representative', e.target.value)}
                  placeholder="대표자 이름" className="auth-input" required />
              </Field>
            </div>
            <Field icon={Phone} label="연락처">
              <input type="tel" value={form.phone} onChange={(e) => change('phone', e.target.value)}
                placeholder="010-0000-0000" className="auth-input" required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field icon={MessageCircle} label="메신저">
                <select value={form.messenger} onChange={(e) => change('messenger', e.target.value)}
                  className="auth-input" required>
                  <option value="">선택</option>
                  <option value="kakaotalk">카카오톡</option>
                  <option value="line">라인 (LINE)</option>
                  <option value="telegram">텔레그램</option>
                </select>
              </Field>
              <Field icon={MessageCircle} label="메신저 아이디">
                <input type="text" value={form.messengerId} onChange={(e) => change('messengerId', e.target.value)}
                  placeholder="아이디" className="auth-input" required />
              </Field>
            </div>
          </>
        )}

        {/* 비밀번호는 두 타입 공통 */}
        <div className="grid grid-cols-2 gap-3">
          <Field icon={Lock} label="비밀번호">
            <input type="password" value={form.password} onChange={(e) => change('password', e.target.value)}
              placeholder="6자 이상" minLength={6} className="auth-input" required autoComplete="new-password" />
          </Field>
          <Field icon={Lock} label="비밀번호 확인">
            <input type="password" value={form.passwordConfirm} onChange={(e) => change('passwordConfirm', e.target.value)}
              placeholder="다시 입력" className="auth-input" required autoComplete="new-password" />
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
          className="w-full h-11 bg-accent hover:bg-blue-700 text-white text-[13px] font-bold rounded-md transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          {submitting ? '처리 중...' : <>{type === 'normal' ? '가입하기' : '제휴 신청하기'} <ArrowRight size={14} /></>}
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

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-gray-400 text-[13px]">불러오는 중...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
