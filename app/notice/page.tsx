'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Pin } from 'lucide-react';
import { getNotices } from '@/lib/api';
import type { DBNotice } from '@/lib/types';

export default function NoticePage() {
  const [notices, setNotices] = useState<DBNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    getNotices()
      .then((data) => setNotices(data))
      .catch((err) => setError(err.message || '공지사항을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-[740px] mx-auto px-5 py-6">
      <h1 className="section-title">공지사항</h1>

      {loading ? (
        <div className="py-16 text-center text-zinc-400 text-[13px]">불러오는 중...</div>
      ) : error ? (
        <div className="py-16 text-center text-red-400 text-[13px]">{error}</div>
      ) : notices.length === 0 ? (
        <div className="py-16 text-center text-zinc-400 text-[13px]">공지사항이 없습니다.</div>
      ) : (
        <div className="card overflow-hidden">
          {notices.map((notice, idx) => {
            const isOpen = openId === notice.id;
            const hasContent = !!notice.content?.trim();
            return (
              <div
                key={notice.id}
                className={idx < notices.length - 1 ? 'border-b border-zinc-100' : ''}
              >
                <button
                  type="button"
                  onClick={() => hasContent && setOpenId(isOpen ? null : notice.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 transition-colors text-left ${
                    hasContent ? 'hover:bg-zinc-50 cursor-pointer' : 'cursor-default'
                  }`}
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {notice.is_pinned && (
                      <span className="badge bg-zinc-900 text-white shrink-0 inline-flex items-center gap-1">
                        <Pin size={10} /> 고정
                      </span>
                    )}
                    <span className="badge bg-zinc-100 text-zinc-500 shrink-0">공지</span>
                    <p className="text-[13px] text-zinc-800 truncate">{notice.title}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-[11px] text-zinc-400 tabular-nums">
                      {new Date(notice.created_at).toLocaleDateString('ko-KR')}
                    </span>
                    {hasContent && (
                      <ChevronDown
                        size={14}
                        className={`text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    )}
                  </div>
                </button>
                {isOpen && hasContent && (
                  <div className="px-4 pb-4 pt-1 bg-zinc-50/60">
                    <p className="text-[13px] text-zinc-700 leading-relaxed whitespace-pre-wrap">
                      {notice.content}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
