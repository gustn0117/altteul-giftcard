'use client';

import { MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function ChatPage() {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return (
      <div className="max-w-[640px] mx-auto px-5 py-20 text-center">
        <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <MessageCircle size={20} className="text-zinc-400" />
        </div>
        <p className="text-[13px] text-zinc-500 mb-4">로그인 후 이용할 수 있습니다.</p>
        <Link href="/login" className="btn-primary inline-flex h-9 px-5 text-[12px]">로그인</Link>
      </div>
    );
  }

  return (
    <div className="max-w-[640px] mx-auto px-5 py-20 text-center">
      <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <MessageCircle size={20} className="text-zinc-400" />
      </div>
      <p className="text-[14px] font-medium text-zinc-700 mb-2">채팅</p>
      <p className="text-[12px] text-zinc-400 mb-4">우측 하단의 채팅 버튼을 눌러 대화를 시작하세요.</p>
    </div>
  );
}
