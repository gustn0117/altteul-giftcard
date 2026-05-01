'use client';

import { useEffect } from 'react';

export default function VisitorTracker() {
  useEffect(() => {
    // 세션당 1회만 기록
    if (sessionStorage.getItem('visited')) return;
    sessionStorage.setItem('visited', '1');
    fetch('/api/visitors', { method: 'POST' }).catch(() => {});
  }, []);

  return null;
}
