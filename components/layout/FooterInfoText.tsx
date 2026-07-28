'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_FOOTER_INFO } from '@/lib/site';

/**
 * 하단 사업자 정보 텍스트 — 관리자(대시보드)에서 작성한 내용을 표시.
 * 비어있으면 기본 문구(DEFAULT_FOOTER_INFO)를 보여준다. 줄바꿈 그대로 유지.
 */
export default function FooterInfoText({ className = '' }: { className?: string }) {
  const [text, setText] = useState<string>(DEFAULT_FOOTER_INFO);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        const v = typeof d.footer_info === 'string' ? d.footer_info.trim() : '';
        if (v) setText(v);
      })
      .catch(() => {});
  }, []);

  return <p className={`whitespace-pre-line ${className}`}>{text}</p>;
}
