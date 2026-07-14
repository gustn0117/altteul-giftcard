'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { Bell, Check, Lock, Timer, CircleDollarSign, Megaphone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { DBNotification, NotificationType } from '@/lib/types';

const POLL_MS = 60_000;

function iconFor(type: NotificationType) {
  switch (type) {
    case 'post_expiry_soon':
    case 'banner_expiry_soon':
      return <Timer size={14} className="text-amber-500" />;
    case 'post_locked':
    case 'banner_locked':
      return <Lock size={14} className="text-rose-500" />;
    case 'post_unlocked':
      return <Check size={14} className="text-emerald-500" />;
    case 'point_charged':
      return <CircleDollarSign size={14} className="text-accent" />;
    default:
      return <Megaphone size={14} className="text-zinc-400" />;
  }
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return '방금';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  return `${d}일 전`;
}

export default function NotificationBell() {
  const { user, isLoggedIn } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<DBNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/notifications?user_id=${user.id}`);
      const data = await res.json();
      if (res.ok) {
        setItems(data.items ?? []);
        setUnread(data.unread ?? 0);
      }
    } catch {
      /* 무시 */
    }
  }, [user?.id]);

  useEffect(() => {
    if (!isLoggedIn) return;
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [isLoggedIn, load]);

  // 외부 클릭으로 닫기
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const markAllRead = async () => {
    if (!user?.id) return;
    await fetch('/api/notifications/read-all', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id }),
    });
    setUnread(0);
    setItems((prev) => prev.map((it) => ({ ...it, read_at: it.read_at ?? new Date().toISOString() })));
  };

  const markRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, read_at: new Date().toISOString() } : it));
    setUnread((u) => Math.max(0, u - 1));
  };

  if (!isLoggedIn) return null;

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex flex-col items-center gap-1 text-gray-600 hover:text-accent transition-colors"
        aria-label="알림"
      >
        <Bell size={22} strokeWidth={1.5} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
        <span className="text-[10px]">알림</span>
      </button>

      {open && (
        <div className="fixed left-3 right-3 top-16 w-auto sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[360px] bg-white border border-gray-200 rounded-lg overflow-hidden shadow-lg z-[60]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="text-[13px] font-bold text-gray-800">알림 {unread > 0 && <span className="text-accent">({unread})</span>}</h3>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-[11px] text-accent hover:underline">모두 읽음</button>
            )}
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="py-12 text-center text-[12px] text-gray-400">알림이 없습니다.</div>
            ) : (
              items.map((it) => {
                const Wrapper = ({ children }: { children: React.ReactNode }) =>
                  it.link ? (
                    <Link href={it.link} onClick={() => { if (!it.read_at) markRead(it.id); setOpen(false); }} className="block">{children}</Link>
                  ) : (
                    <button onClick={() => { if (!it.read_at) markRead(it.id); }} className="w-full text-left">{children}</button>
                  );
                return (
                  <Wrapper key={it.id}>
                    <div className={`flex items-start gap-2 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${it.read_at ? 'opacity-60' : 'bg-blue-50/30'}`}>
                      <span className="mt-0.5">{iconFor(it.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-gray-800 truncate">{it.title}</p>
                        {it.body && <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{it.body}</p>}
                        <p className="text-[10px] text-gray-400 mt-1">{timeAgo(it.created_at)}</p>
                      </div>
                      {!it.read_at && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />}
                    </div>
                  </Wrapper>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
