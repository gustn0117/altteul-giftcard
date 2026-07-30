'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

function KakaoComplete() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const [msg, setMsg] = useState('카카오 로그인 처리 중...');
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const token = params.get('t');
    if (!token) {
      setMsg('잘못된 접근입니다.');
      return;
    }
    fetch('/api/auth/kakao/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          login(d.user);
          router.replace('/');
        } else {
          setMsg(d.error || '로그인에 실패했습니다.');
        }
      })
      .catch(() => setMsg('로그인 처리 중 오류가 발생했습니다.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className="min-h-[60vh] flex items-center justify-center text-[14px] text-gray-500">{msg}</div>;
}

export default function KakaoAuthPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-[14px] text-gray-500">불러오는 중...</div>}>
      <KakaoComplete />
    </Suspense>
  );
}
