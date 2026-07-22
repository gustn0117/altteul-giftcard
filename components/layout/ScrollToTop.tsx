'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * 페이지 이동 시 항상 최상단부터 보이게 한다.
 * (브라우저 스크롤 복원 때문에 홈/팝니다/삽니다를 눌러도 살짝 내려간 상태로 뜨던 문제)
 */
export default function ScrollToTop() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 브라우저 자동 스크롤 복원 끄기
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    // 데이터가 늦게 로드되며 레이아웃이 밀리는 경우까지 보정
    const t = setTimeout(() => window.scrollTo(0, 0), 120);
    return () => clearTimeout(t);
  }, [pathname, searchParams]);

  return null;
}
