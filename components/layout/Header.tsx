'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search, Menu, X, LogIn, UserPlus, LayoutDashboard, PenSquare, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from '@/components/layout/NotificationBell';

const PRIMARY_NAV = [
  { href: '/board?tab=sell', label: '상품권 팝니다', badge: 'HOT', dot: 'bg-rose-500', glow: 'group-hover:shadow-[0_0_8px_2px_rgba(244,63,94,0.5)]' },
  { href: '/board?tab=buy', label: '상품권 삽니다', badge: 'HOT', dot: 'bg-blue-500', glow: 'group-hover:shadow-[0_0_8px_2px_rgba(59,130,246,0.5)]' },
  { href: '/recommended', label: '매입업체', badge: 'N', dot: 'bg-emerald-500', glow: 'group-hover:shadow-[0_0_8px_2px_rgba(16,185,129,0.5)]' },
  { href: '/community', label: '커뮤니티', dot: 'bg-violet-500', glow: 'group-hover:shadow-[0_0_8px_2px_rgba(139,92,246,0.5)]' },
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
      {/* Main row: 3분할 그리드 (좌:로고 / 중:검색 / 우:액션) */}
      <div className="container-main">
        <div className="md:grid md:grid-cols-[auto_1fr_auto] md:gap-6 flex items-center h-17 md:h-19">
          {/* Logo (좌) */}
          <Link href="/" className="flex items-center shrink-0">
            <Image src="/logo-dark.svg" alt="알뜰상품권" width={180} height={40}
              className="h-8 md:h-9 w-auto object-contain" priority />
          </Link>

          {/* Search (가운데, 데스크탑) */}
          <form onSubmit={handleSearchSubmit}
            className="hidden md:flex w-full max-w-130 mx-auto relative">
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

          {/* 우측 액션 — 라이트, 텍스트 링크 + 1개 CTA */}
          <div className="hidden md:flex items-center gap-1">
            {isLoggedIn && <NotificationBell />}

            {/* 글쓰기 — 텍스트 링크 */}
            <Link
              href="/board/write?type=sell"
              className="inline-flex items-center gap-1.5 h-9 px-3 text-[13px] font-semibold text-gray-600 hover:text-gray-900 transition-colors"
            >
              <PenSquare size={14} /> 글쓰기
            </Link>

            <span className="w-px h-3.5 bg-gray-200 mx-0.5" aria-hidden />

            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 h-9 px-3 text-[13px] font-semibold text-gray-700 hover:text-accent transition-colors"
                >
                  <LayoutDashboard size={14} />
                  <span className="max-w-24 truncate">{user?.name ?? '내 대시보드'}</span>
                </Link>
                <button
                  onClick={logout}
                  className="h-9 px-3 text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                {/* 로그인 — 텍스트 링크 */}
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 h-9 px-3 text-[13px] font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <LogIn size={14} /> 로그인
                </Link>

                {/* 회원가입 — 유일한 CTA (흰 글씨 강제) */}
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 h-9 px-4 ml-1 rounded-full text-[13px] font-bold transition-colors"
                  style={{ background: '#1E40AF', color: '#FFFFFF' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#1D4ED8')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#1E40AF')}
                >
                  <UserPlus size={14} /> 회원가입
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

      {/* Sub Navigation — 칩(pill) 스타일 카테고리 바 */}
      <nav className="hidden md:block bg-white border-t border-gray-100">
        <div className="container-main py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-0.5 flex-wrap">
              {PRIMARY_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group inline-flex items-center gap-2 h-10 px-4 rounded-lg text-[14px] font-extrabold text-gray-800 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  <span className={`w-2 h-2 rounded-full ${item.dot} ${item.glow} group-hover:scale-125 transition-all`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] font-black text-white px-1.5 py-0.5 rounded ${item.badge === 'HOT' ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {SECONDARY_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center gap-1 h-8 px-2.5 text-[11.5px] text-gray-500 hover:text-accent transition-colors"
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
