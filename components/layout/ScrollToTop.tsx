'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * 링크로 '앞으로' 이동할 때만 최상단으로 올린다.
 * 뒤로/앞으로 가기(popstate)는 브라우저가 직전 스크롤 위치를 복원하도록 그대로 둔다.
 * (예전엔 뒤로가기까지 최상단으로 밀어서 '들어오기 전 화면'이 안 보였음)
 */
export default function ScrollToTop() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 뒤로/앞으로 가기 여부를 표시하는 플래그. popstate 직후의 경로 변경에서만 true.
  useEffect(() => {
    const onPop = () => {
      (window as unknown as { __isPop?: boolean }).__isPop = true;
      // 다음 렌더/복원 이후 플래그 해제
      setTimeout(() => { (window as unknown as { __isPop?: boolean }).__isPop = false; }, 300);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    // 뒤로가기(popstate)로 인한 경로 변경이면 스크롤 복원을 방해하지 않는다.
    if ((window as unknown as { __isPop?: boolean }).__isPop) return;
    window.scrollTo(0, 0);
  }, [pathname, searchParams]);

  return null;
}
