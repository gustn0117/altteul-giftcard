'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * 다른 '페이지'(경로)로 앞으로 이동할 때만 최상단으로 올린다.
 * - 뒤로/앞으로 가기(popstate)는 브라우저가 직전 스크롤 위치를 복원하도록 그대로 둔다.
 * - 같은 화면에서 쿼리만 바뀌는 이동(목록 페이지 넘기기 ?page=2 등)은 최상단으로 밀지 않는다.
 *   → 광고칸 페이지를 넘겨도 화면이 위로 튀지 않고, 뒤로가면 보던 페이지가 그대로 복원됨.
 */
export default function ScrollToTop() {
  const pathname = usePathname();

  // 뒤로/앞으로 가기 여부를 표시하는 플래그. popstate 직후의 경로 변경에서만 true.
  useEffect(() => {
    const onPop = () => {
      (window as unknown as { __isPop?: boolean }).__isPop = true;
      setTimeout(() => { (window as unknown as { __isPop?: boolean }).__isPop = false; }, 300);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    // 뒤로가기(popstate)로 인한 이동이면 스크롤 복원을 방해하지 않는다.
    if ((window as unknown as { __isPop?: boolean }).__isPop) return;
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
