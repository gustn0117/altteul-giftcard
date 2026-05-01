'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  useEffect(() => {
    // 위젯으로 열기
    window.dispatchEvent(new CustomEvent('open-chat-widget', { detail: { chatId: id } }));
    router.replace('/');
  }, [id, router]);

  return (
    <div className="max-w-[640px] mx-auto px-5 py-20 text-center text-zinc-400 text-[13px]">
      채팅으로 이동 중...
    </div>
  );
}
