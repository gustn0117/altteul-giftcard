'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Home, Tag, ShoppingCart, Users, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Suspense } from 'react';

function NavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const { isLoggedIn } = useAuth();

  const isBoardSell = pathname?.startsWith('/board') && tab === 'sell';
  const isBoardBuy = pathname?.startsWith('/board') && tab !== 'sell';
  const isRecommended = pathname?.startsWith('/recommended');

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 z-50">
      <div className="flex justify-around items-center h-[52px]">
        <Link href="/"
          className={`flex flex-col items-center gap-0.5 text-[10px] ${pathname === '/' ? 'text-accent font-semibold' : 'text-gray-400'}`}>
          <Home size={18} strokeWidth={pathname === '/' ? 2 : 1.5} />
          홈
        </Link>
        <Link href="/board?tab=sell"
          className={`flex flex-col items-center gap-0.5 text-[10px] ${isBoardSell ? 'text-accent font-semibold' : 'text-gray-400'}`}>
          <Tag size={18} strokeWidth={isBoardSell ? 2 : 1.5} />
          팝니다
        </Link>
        <Link href="/board?tab=buy"
          className={`flex flex-col items-center gap-0.5 text-[10px] ${isBoardBuy ? 'text-accent font-semibold' : 'text-gray-400'}`}>
          <ShoppingCart size={18} strokeWidth={isBoardBuy ? 2 : 1.5} />
          삽니다
        </Link>
        <Link href="/recommended"
          className={`flex flex-col items-center gap-0.5 text-[10px] ${isRecommended ? 'text-accent font-semibold' : 'text-gray-400'}`}>
          <Users size={18} strokeWidth={isRecommended ? 2 : 1.5} />
          매입업체
        </Link>
        <Link href={isLoggedIn ? '/dashboard' : '/login'}
          className={`flex flex-col items-center gap-0.5 text-[10px] ${pathname === '/login' || pathname?.startsWith('/dashboard') ? 'text-accent font-semibold' : 'text-gray-400'}`}>
          <User size={18} strokeWidth={pathname === '/login' || pathname?.startsWith('/dashboard') ? 2 : 1.5} />
          {isLoggedIn ? '내정보' : '로그인'}
        </Link>
      </div>
    </nav>
  );
}

export default function MobileNav() {
  return (
    <Suspense fallback={null}>
      <NavInner />
    </Suspense>
  );
}
