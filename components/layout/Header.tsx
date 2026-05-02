'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search, Menu, X, LogIn, UserPlus, LayoutDashboard, PenSquare, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from '@/components/layout/NotificationBell';

const PRIMARY_NAV = [
  { href: '/board?tab=sell', label: '상품권 팝니다', badge: 'HOT' },
  { href: '/board?tab=buy', label: '상품권 삽니다', badge: 'HOT' },
  { href: '/recommended', label: '매입업체', badge: 'N' },
  { href: '/community', label: '커뮤니티' },
];

const SECONDARY_NAV = [
  { href: '/custom-search', label: '상세검색' },
  { href: '/fraud', label: '사기방지' },
  { href: '/guide', label: '이용안내' },
  { href: '/faq', label: '고객센터' },
];

export default function Header() {
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white sticky top-0 z-50 border-b border-gray-200">
      {/* Main row: 로고 | 검색 | 우측 액션 */}
      <div className="container-main">
        <div className="flex items-center gap-3 md:gap-5 h-17 md:h-19">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <Image src="/logo-dark.svg" alt="알뜰상품권" width={180} height={40}
              className="h-8 md:h-9 w-auto object-contain" priority />
          </Link>

          {/* Search — 데스크탑에서 가운데 (둥근, 강조) */}
          <form onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-130 relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="상품권 / 업체 / 커뮤니티 통합검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              maxLength={80}
              className="w-full h-10 pl-10 pr-4 bg-gray-50 hover:bg-gray-100 focus:bg-white border border-gray-200 focus:border-accent rounded-full text-[13px] focus:outline-none transition-colors"
            />
          </form>

          {/* Spacer (모바일) */}
          <div className="flex-1 md:hidden" />

          {/* 우측 액션 — 강한 콘트라스트 (검정 / 흰 outline / 파란 그라디언트) */}
          <div className="hidden md:flex items-center gap-2">
            {isLoggedIn && <NotificationBell />}

            {/* 글쓰기 — 검정 솔리드 (눈에 확 띄는 어두운 톤) */}
            <Link
              href="/board/write?type=sell"
              className="inline-flex items-center gap-1.5 h-11 px-4 bg-gray-900 hover:bg-black text-white text-[13.5px] font-extrabold rounded-full shadow-sm hover:shadow-md transition-all"
            >
              <PenSquare size={15} strokeWidth={2.6} /> 글쓰기
            </Link>

            {isLoggedIn ? (
              <>
                {/* 대시보드 — 진한 파란 그라디언트 */}
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 h-11 px-5 text-white text-[13.5px] font-extrabold rounded-full shadow-md hover:shadow-lg transition-all"
                  style={{ background: 'linear-gradient(135deg, #1E3A8A, #2563EB)' }}
                >
                  <LayoutDashboard size={15} strokeWidth={2.6} />
                  <span className="max-w-24 truncate">{user?.name ?? '내 대시보드'}</span>
                </Link>
                <button
                  onClick={logout}
                  className="text-[12.5px] font-bold text-gray-500 hover:text-gray-900 px-2 transition-colors"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                {/* 로그인 — 흰 배경 + 진한 outline (명확한 박스) */}
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 h-11 px-4 bg-white border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 text-gray-900 text-[13.5px] font-extrabold rounded-full transition-colors"
                >
                  <LogIn size={15} strokeWidth={2.6} /> 로그인
                </Link>

                {/* 회원가입 — 그라디언트 + 강한 그림자 + 떠오름 (Primary CTA) */}
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 h-11 px-5 text-white text-[13.5px] font-extrabold rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                  style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)', boxShadow: '0 6px 20px -4px rgba(37, 99, 235, 0.5)' }}
                >
                  <UserPlus size={15} strokeWidth={2.6} /> 회원가입
                </Link>
              </>
            )}
          </div>

          {/* Mobile right cluster */}
          <div className="md:hidden flex items-center gap-1">
            {isLoggedIn && <NotificationBell />}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 -mr-2 text-gray-700" aria-label="메뉴">
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <form onSubmit={handleSearchSubmit} className="md:hidden pb-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="상품권 / 업체 / 커뮤니티 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              maxLength={80}
              className="w-full h-10 pl-9 pr-4 bg-gray-50 border border-gray-200 focus:border-accent focus:bg-white rounded-full text-[13px] focus:outline-none"
            />
          </div>
        </form>
      </div>

      {/* Sub Navigation — 데스크탑 카테고리 바 */}
      <nav className="hidden md:block bg-white border-t border-gray-100">
        <div className="container-main">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {PRIMARY_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group inline-flex items-center gap-1.5 px-4 py-3 text-[13px] font-bold text-gray-800 hover:text-accent border-b-2 border-transparent hover:border-accent transition-colors"
                >
                  {item.label}
                  {item.badge && (
                    <span className={`text-[10px] text-white px-1 rounded-sm ${item.badge === 'HOT' ? 'bg-accent' : 'bg-emerald-600'}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
            <div className="flex items-center">
              {SECONDARY_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center gap-1 px-3 py-3 text-[12px] text-gray-500 hover:text-accent transition-colors"
                >
                  {item.href === '/fraud' && <ShieldAlert size={11} />}
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu (drawer) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white shadow-lg">
          <div className="px-4 py-2">
            {PRIMARY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between py-2.5 text-[13px] text-gray-800 font-bold border-b border-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>{item.label}</span>
                {item.badge && <span className="text-[10px] text-accent font-bold">{item.badge}</span>}
              </Link>
            ))}
            {SECONDARY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block py-2.5 text-[13px] text-gray-600 font-medium border-b border-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-gray-200 mt-1 pt-2 space-y-1">
              {isLoggedIn ? (
                <>
                  <Link href="/dashboard" className="flex items-center gap-2 py-2.5 text-[13px] font-bold text-gray-900"
                    onClick={() => setMobileMenuOpen(false)}>
                    <LayoutDashboard size={14} /> 내 대시보드
                  </Link>
                  <Link href="/board/write?type=sell" className="flex items-center gap-2 py-2.5 text-[13px] text-gray-700 font-medium"
                    onClick={() => setMobileMenuOpen(false)}>
                    <PenSquare size={14} /> 글쓰기
                  </Link>
                  <button onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="w-full text-left text-[13px] text-rose-500 py-2.5">
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="flex items-center gap-2 py-2.5 text-[13px] text-gray-700 font-medium"
                    onClick={() => setMobileMenuOpen(false)}>
                    <LogIn size={14} /> 로그인
                  </Link>
                  <Link href="/register" className="flex items-center gap-2 py-2.5 text-[13px] font-bold text-accent"
                    onClick={() => setMobileMenuOpen(false)}>
                    <UserPlus size={14} /> 회원가입 (개인)
                  </Link>
                  <Link href="/register-business" className="block py-2.5 text-[13px] text-gray-600 pl-6"
                    onClick={() => setMobileMenuOpen(false)}>
                    매입 업체로 등록하기 →
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
