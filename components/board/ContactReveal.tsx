'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Phone, MessageSquare, Lock, Eye, RotateCcw } from 'lucide-react';
import { useCallModal } from '@/contexts/CallModalContext';

interface Props {
  postId: string;
  postType: 'sell' | 'buy';
  rawPhone: string;
  authorName: string;
  isAuthor: boolean;
  isCompleted: boolean;
  isLoggedIn: boolean;
  currentUserId?: string;
  buyPublic: boolean;
}

function maskPhone(phone: string): string {
  const d = phone.replace(/[^0-9]/g, '');
  if (d.length < 8) return '연락처 비공개';
  if (d.length === 11) return `${d.slice(0, 3)}-****-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-***-${d.slice(6)}`;
  return `${d.slice(0, 3)}-****-****`;
}

export default function ContactReveal(props: Props) {
  const { postId, postType, rawPhone, authorName, isAuthor, isCompleted, isLoggedIn, currentUserId, buyPublic } = props;
  const { openCall } = useCallModal();

  // 삽니다 공개 설정이 켜져 있으면 전체 공개
  const publicNow = postType === 'buy' && buyPublic;

  const [revealed, setRevealed] = useState(isAuthor || publicNow);
  const [phone, setPhone] = useState(isAuthor || publicNow ? rawPhone : '');
  const [count, setCount] = useState(0);
  const [limit, setLimit] = useState(5);
  const [cost, setCost] = useState(500);
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const qs = new URLSearchParams({ post_id: postId });
      if (currentUserId) qs.set('user_id', currentUserId);
      const res = await fetch(`/api/posts/reveal-contact?${qs}`);
      const data = await res.json();
      if (!res.ok) return;
      setCount(data.count ?? 0);
      setLimit(data.limit ?? 5);
      setCost(data.cost ?? 500);
      setLocked(!!data.locked);
      if (data.revealed && data.phone) { setRevealed(true); setPhone(data.phone); }
    } catch { /* noop */ }
  }, [postId, currentUserId]);

  useEffect(() => {
    // 전체공개(공개설정/작성자)면 상태조회 불필요. 단, 작성자는 열람 현황을 보여주려 조회.
    if (publicNow && !isAuthor) return;
    fetchStatus();
  }, [publicNow, isAuthor, fetchStatus]);

  const handleReveal = async () => {
    if (!isLoggedIn || !currentUserId) return;
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/posts/reveal-contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, user_id: currentUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '열람에 실패했습니다.');
      setRevealed(true);
      setPhone(data.phone);
      if (data.charged) alert(`연락처를 열람했습니다. (${cost}P 차감, 잔액 ${data.balance}P)`);
      fetchStatus();
    } catch (err) {
      alert(err instanceof Error ? err.message : '열람 실패');
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    if (!currentUserId) return;
    if (!confirm('블라인드를 리셋하면 열람 인원이 초기화되어 다시 5명이 연락처를 볼 수 있습니다. 진행할까요?')) return;
    setBusy(true);
    try {
      const res = await fetch('/api/posts/reveal-reset', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, user_id: currentUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '리셋에 실패했습니다.');
      alert('블라인드를 리셋했습니다. 다시 5명이 열람할 수 있습니다.');
      setCount(0); setLocked(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : '리셋 실패');
    } finally {
      setBusy(false);
    }
  };

  // 전화/문자 버튼 (연락처가 공개된 상태)
  const ContactButtons = () => (
    <>
      <div className="flex items-center justify-center gap-2 py-2 text-[14px] font-bold text-gray-900 whitespace-nowrap">
        <Phone size={16} className="text-accent shrink-0" />
        <span className="tabular-nums">{phone}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => openCall(authorName, phone)} className="btn-accent w-full h-11 text-[13px]">
          <Phone size={14} /> 전화하기
        </button>
        <a href={`sms:${phone.replace(/[^0-9]/g, '')}`} className="btn-secondary w-full h-11 text-[13px] flex items-center justify-center gap-1">
          <MessageSquare size={14} /> 문자하기
        </a>
      </div>
    </>
  );

  if (!rawPhone) {
    return <p className="text-[12px] text-gray-500 text-center py-4">연락처가 등록되지 않았습니다.</p>;
  }

  // 작성자 본인
  if (isAuthor) {
    return (
      <div className="space-y-3">
        <ContactButtons />
        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-[11.5px] text-gray-600">
          <div className="flex items-center justify-between">
            <span>연락처 열람 현황 <strong className="text-accent">{count}/{limit}명</strong></span>
            <button onClick={handleReset} disabled={busy}
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full border border-accent/40 text-accent bg-accent/5 hover:bg-accent hover:text-white transition-colors text-[11px] font-bold disabled:opacity-50">
              <RotateCcw size={11} /> 블라인드 리셋
            </button>
          </div>
          <p className="mt-1 text-[10.5px] text-gray-400">리셋하면 열람 인원이 초기화되어 다시 {limit}명이 볼 수 있습니다.</p>
        </div>
      </div>
    );
  }

  // 공개 or 이미 열람
  if (revealed) {
    return <div className="space-y-2"><ContactButtons /></div>;
  }

  // 블라인드 상태
  return (
    <div className="text-center py-4 space-y-3">
      <p className="text-[14px] font-bold text-zinc-500 tabular-nums">{maskPhone(rawPhone)}</p>
      {isCompleted ? (
        <p className="text-[11px] text-zinc-400">거래완료된 글입니다. 연락처가 비공개되었습니다.</p>
      ) : !isLoggedIn ? (
        <>
          <p className="text-[11.5px] text-zinc-500">연락처는 로그인 후 {cost}P로 열람할 수 있습니다.</p>
          <Link href={`/login?redirect=${encodeURIComponent(`/board/${postId}`)}`}
            className="inline-flex items-center gap-1 h-9 px-4 bg-accent hover:bg-blue-700 text-white text-[12.5px] font-bold rounded-full transition-colors">
            로그인 →
          </Link>
        </>
      ) : locked ? (
        <>
          <p className="inline-flex items-center gap-1 text-[12px] font-bold text-zinc-500">
            <Lock size={13} /> 열람 인원 마감 ({limit}/{limit})
          </p>
          <p className="text-[10.5px] text-zinc-400">작성자가 블라인드를 리셋하면 다시 열람할 수 있습니다.</p>
        </>
      ) : (
        <>
          <button onClick={handleReveal} disabled={busy}
            className="inline-flex items-center gap-1.5 h-10 px-5 bg-accent hover:bg-blue-700 text-white text-[13px] font-bold rounded-full transition-colors disabled:opacity-50">
            <Eye size={15} /> {busy ? '처리 중...' : `연락처 보기 (${cost}P)`}
          </button>
          <p className="text-[10.5px] text-zinc-400">현재 {count}/{limit}명 열람 · 한 번 열람하면 이후 무료로 다시 볼 수 있어요.</p>
        </>
      )}
    </div>
  );
}
