'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Search, Menu, X, Home, MapPin, Tag as TagIcon, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from '@/components/layout/NotificationBell';

const PRIMARY_NAV = [
  { href: '/category/area', label: '지역별 업체찾기', badge: 'N', Icon: MapPin },
  { href: '/category/product', label: '상품별 업체찾기', badge: 'N', Icon: TagIcon },
  { href: '/recommended', label: '오늘의 추천업체', badge: 'N', Icon: Star },
];

export default function Header() {
  const { isLoggedIn } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white sticky top-0 z-50 border-b border-gray-200">
      {/* Main row: 좌(아이콘) - 중앙(로고) - 우(햄버거/메뉴) */}
      <div className="container-main">
        <div className="grid grid-cols-3 items-center h-16 md:h-20">
          {/* 좌: 홈 + 검색 아이콘 */}
          <div className="flex items-center gap-1">
            <Link href="/" aria-label="홈"
              className="inline-flex items-center justify-center w-10 h-10 md:w-11 md:h-11 border border-gray-200 rounded-md text-gray-700 hover:border-accent hover:text-accent transition-colors">
              <Home size={18} strokeWidth={1.8} />
            </Link>
            <Link href="/search" aria-label="검색"
              className="inline-flex items-center justify-center w-10 h-10 md:w-11 md:h-11 border border-gray-200 rounded-md text-gray-700 hover:border-accent hover:text-accent transition-colors">
              <Search size={18} strokeWidth={1.8} />
            </Link>
          </div>

          {/* 중앙: 로고 */}
          <Link href="/" className="flex items-center justify-center">
            <Image src="/logo.svg" alt="예판상품권" width={240} height={64}
              className="h-11 md:h-14 w-auto object-contain" priority />
          </Link>

          {/* 우: 알림 + 햄버거(전체메뉴) */}
          <div className="flex items-center justify-end gap-1">
            {isLoggedIn && <NotificationBell />}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center gap-1.5 h-10 md:h-11 px-3 md:px-4 border border-gray-200 rounded-md text-gray-700 hover:border-accent hover:text-accent text-[12px] md:text-[13px] font-bold transition-colors"
              aria-label="전체메뉴">
              {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
              <span className="hidden md:inline">전체메뉴</span>
            </button>
          </div>
        </div>
      </div>

      {/* 카테고리 nav */}
      <nav className="bg-white border-t border-gray-100">
        <div className="container-main">
          <div className="flex items-center justify-around md:justify-start md:gap-2 py-2.5 overflow-x-auto">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.Icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group inline-flex items-center gap-1.5 h-10 px-3 md:px-4 rounded-lg text-[13.5px] md:text-[14.5px] font-extrabold text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  <Icon size={15} strokeWidth={2.2} className="text-accent" />
                  <span>{item.label}</span>
                  <span className="text-[9.5px] font-black text-white px-1 py-0.5 rounded bg-rose-500">
                    {item.badge}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* 전체메뉴 drawer */}
      {mobileMenuOpen && <FullMenu onClose={() => setMobileMenuOpen(false)} />}
    </header>
  );
}

function FullMenu({ onClose }: { onClose: () => void }) {
  const { isLoggedIn, user, logout } = useAuth();
  return (
    <div className="border-t border-gray-200 bg-white shadow-lg">
      <div className="container-main py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {PRIMARY_NAV.map((item) => {
            const Icon = item.Icon;
            return (
              <Link key={item.href} href={item.href} onClick={onClose}
                className="flex items-center gap-2 px-3 py-3 border border-gray-200 rounded-lg hover:border-accent hover:bg-accent/5 transition-colors">
                <Icon size={15} className="text-accent" />
                <span className="text-[13px] font-bold text-gray-800">{item.label}</span>
              </Link>
            );
          })}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
          {[
            { href: '/board/write?type=sell', label: '판매글 작성' },
            { href: '/board?tab=sell', label: '지역별 판매찾기' },
            { href: '/board?tab=buy', label: '지역별 매입찾기' },
            { href: '/guide', label: '이용안내' },
            { href: '/fraud', label: '사기방지 가이드' },
            { href: '/notice', label: '공지사항' },
            { href: '/contact', label: '1:1 문의' },
            { href: '/advertising', label: '광고 신청' },
          ].map((item) => (
            <Link key={item.href} href={item.href} onClick={onClose}
              className="px-3 py-2.5 text-[12.5px] text-gray-600 hover:text-accent transition-colors">
              {item.label}
            </Link>
          ))}
        </div>
        <div className="border-t border-gray-200 mt-3 pt-3 flex flex-wrap items-center gap-2">
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" onClick={onClose}
                className="inline-flex items-center gap-1.5 h-9 px-4 bg-accent text-white text-[12.5px] font-bold rounded-md">
                {user?.name ?? '내 대시보드'}
              </Link>
              <button onClick={() => { logout(); onClose(); }}
                className="h-9 px-4 text-[12.5px] text-gray-500 hover:text-gray-900">로그아웃</button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={onClose}
                className="inline-flex items-center justify-center h-9 px-4 border border-gray-300 text-gray-800 text-[12.5px] font-bold rounded-md hover:border-accent hover:text-accent">
                로그인
              </Link>
              <Link href="/register" onClick={onClose}
                className="inline-flex items-center justify-center h-9 px-4 bg-accent text-white text-[12.5px] font-bold rounded-md hover:bg-blue-700">
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
