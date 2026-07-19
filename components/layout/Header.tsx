'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Search, Menu, X, MapPin, Tag as TagIcon, Star,
  LogIn, UserPlus, LayoutDashboard, PenSquare, Megaphone, ShieldAlert, HelpCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from '@/components/layout/NotificationBell';

const PRIMARY_NAV = [
  { href: '/board?tab=sell', label: '지역별 판매찾기', badge: 'N', Icon: TagIcon },
  { href: '/board?tab=buy',  label: '지역별 매입찾기', badge: 'N', Icon: MapPin },
  { href: '/recommended',    label: '오늘의 추천업체', badge: 'N', Icon: Star },
];

const SECONDARY_NAV = [
  { href: '/board?tab=sell',   label: '판매찾기' },
  { href: '/board?tab=buy',    label: '매입찾기' },
  { href: '/fraud',            label: '사기방지', Icon: ShieldAlert },
  { href: '/guide',            label: '이용안내', Icon: HelpCircle },
  { href: '/advertising',      label: '광고문의', Icon: Megaphone },
];

export default function Header() {
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [fullMenuOpen, setFullMenuOpen] = useState(false);
  const [points, setPoints] = useState<number | null>(null);

  // 로그인 시 최신 포인트 잔액 조회
  useEffect(() => {
    if (!isLoggedIn || !user?.id) { setPoints(null); return; }
    setPoints(typeof user.points === 'number' ? user.points : null);
    fetch(`/api/user?id=${user.id}`)
      .then((r) => r.json())
      .then((d) => { if (typeof d.user?.points === 'number') setPoints(d.user.points); })
      .catch(() => {});
  }, [isLoggedIn, user?.id, user?.points]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="bg-white sticky top-0 z-50 border-b border-gray-200">
      {/* ───────────────── 데스크탑 헤더 ───────────────── */}
      <div className="hidden md:block">
        <div className="container-main">
          {/* 윗줄: 로고(좌) | 검색(중앙) | 액션(우) */}
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-6 h-20">
            {/* 로고 */}
            <Link href="/" className="flex items-center shrink-0">
              <Image src="/logo.png" alt="예판상품권" width={612} height={277}
                className="h-14 w-auto object-contain" priority />
            </Link>

            {/* 검색 */}
            <form onSubmit={handleSearch} className="w-full max-w-130 mx-auto relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="상품권, 업체 통합검색"
                maxLength={80}
                className="w-full h-11 pl-11 pr-4 bg-gray-50 hover:bg-gray-100 focus:bg-white border border-gray-200 focus:border-accent rounded-full text-[13.5px] focus:outline-none transition-colors"
              />
            </form>

            {/* 우측 액션 */}
            <div className="flex items-center gap-1.5">
              {isLoggedIn && <NotificationBell />}
              <Link href="/board/write?type=sell"
                className="inline-flex items-center gap-1.5 h-9 px-3.5 text-[13px] font-bold text-gray-700 hover:text-accent transition-colors">
                <PenSquare size={14} /> 글쓰기
              </Link>
              <span className="w-px h-4 bg-gray-200" aria-hidden />
              {isLoggedIn ? (
                <>
                  {points != null && (
                    <span className="inline-flex items-baseline gap-1 h-9 px-2.5 text-[12.5px] font-bold text-accent">
                      <span className="text-[10px] text-gray-400 font-medium">포인트</span>
                      <span className="tabular-nums">{points.toLocaleString()}P</span>
                    </span>
                  )}
                  <Link href="/dashboard"
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 text-[13px] font-bold text-gray-800 hover:text-accent transition-colors">
                    <LayoutDashboard size={14} />
                    <span className="max-w-24 truncate">{user?.name ?? '내 대시보드'}</span>
                  </Link>
                  <button onClick={logout}
                    className="h-9 px-3 text-[12.5px] text-gray-500 hover:text-gray-900 transition-colors">
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  {/* 로그인 — 흰 배경 + 1.5px 진회색 outline (간결) */}
                  <Link href="/login"
                    className="inline-flex items-center gap-1 h-9 px-3.5 text-[12.5px] font-bold rounded-full transition-colors hover:bg-gray-50"
                    style={{ background: '#FFFFFF', color: '#1E293B', border: '1.5px solid #334155' }}>
                    <LogIn size={13} strokeWidth={2.4} /> 로그인
                  </Link>
                  {/* 회원가입 — 진한 파랑 솔리드 + 흰 글씨 (가벼운 그림자) */}
                  <Link href="/register"
                    className="inline-flex items-center gap-1 h-9 px-4 text-[12.5px] font-bold rounded-full transition-colors hover:opacity-95"
                    style={{
                      background: '#1E40AF',
                      color: '#FFFFFF',
                      boxShadow: '0 2px 6px -1px rgba(30, 64, 175, 0.3)',
                    }}>
                    <UserPlus size={13} strokeWidth={2.4} style={{ color: '#FFFFFF' }} />
                    <span style={{ color: '#FFFFFF' }}>회원가입</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* 아랫줄: 카테고리 nav (좌) + 보조 메뉴 (우) */}
          <nav className="border-t border-gray-100">
            <div className="flex items-center justify-between py-2.5 gap-3">
              <div className="flex items-center gap-1">
                {PRIMARY_NAV.map(({ href, label, badge, Icon }) => (
                  <Link key={href} href={href}
                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg text-[14px] font-extrabold text-gray-900 hover:bg-gray-50 transition-colors">
                    <Icon size={15} strokeWidth={2.2} className="text-accent" />
                    <span>{label}</span>
                    <span className="text-[9.5px] font-black text-white px-1 py-0.5 rounded bg-rose-500">{badge}</span>
                  </Link>
                ))}
              </div>
              <div className="flex items-center gap-0.5">
                {/* 768~1023px에선 nav 전체 폭(약 848px)이 컨테이너를 넘겨 가로 스크롤이 생김 → 보조메뉴는 lg부터 노출 (전체메뉴 버튼으로 접근 가능) */}
                {SECONDARY_NAV.map(({ href, label, Icon }) => (
                  <Link key={href} href={href}
                    className="hidden lg:inline-flex items-center gap-1 h-8 px-2.5 text-[12px] text-gray-500 hover:text-accent transition-colors">
                    {Icon && <Icon size={11} />}
                    {label}
                  </Link>
                ))}
                <button onClick={() => setFullMenuOpen(!fullMenuOpen)}
                  className="inline-flex items-center gap-1 h-8 px-3 ml-1 border border-gray-200 rounded text-[12px] text-gray-700 hover:border-accent hover:text-accent transition-colors">
                  <Menu size={12} /> 전체메뉴
                </button>
              </div>
            </div>
          </nav>
        </div>
      </div>

      {/* ───────────────── 모바일 헤더 (사진 스타일) ───────────────── */}
      <div className="md:hidden">
        <div className="container-main">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center h-18 gap-1">
            {/* 좌: 검색 아이콘 + 포인트(로그인 시) */}
            <div className="flex items-center justify-start gap-1.5 min-w-0">
              <Link href="/search" aria-label="검색"
                className="shrink-0 inline-flex items-center justify-center w-10 h-10 border border-gray-200 rounded-md text-gray-700 hover:border-accent hover:text-accent transition-colors">
                <Search size={18} strokeWidth={1.8} />
              </Link>
              {isLoggedIn && points != null && (
                <Link href="/dashboard" className="flex flex-col items-center justify-center text-center leading-tight shrink-0" aria-label="내 포인트">
                  <span className="text-[9px] text-gray-400">포인트</span>
                  <span className="text-[12px] font-extrabold text-accent tabular-nums whitespace-nowrap">{points.toLocaleString()}P</span>
                </Link>
              )}
            </div>
            {/* 중앙: 로고 (정중앙) */}
            <Link href="/" className="flex items-center justify-center">
              <Image src="/logo.png" alt="예판상품권" width={612} height={277}
                className="h-16 w-auto object-contain" priority />
            </Link>
            {/* 우: 알림 + 햄버거 */}
            <div className="flex items-center justify-end gap-1">
              {isLoggedIn && <NotificationBell />}
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center gap-1 h-10 px-3 border border-gray-200 rounded-md text-gray-700 hover:border-accent hover:text-accent text-[12px] font-bold transition-colors"
                aria-label="전체메뉴">
                {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
              </button>
            </div>
          </div>

          {/* 모바일 카테고리 nav — 스크롤 없이 한 줄에 균등 배치 */}
          <div className="grid grid-cols-3 border-t border-gray-100">
            {PRIMARY_NAV.map(({ href, label, badge }) => (
              <Link key={href} href={href}
                className="inline-flex items-center justify-center gap-0.5 py-2.5 text-[12px] font-extrabold text-gray-900 hover:text-accent transition-colors min-w-0">
                <span className="truncate min-w-0">{label.replace('지역별 ', '').replace('오늘의 ', '')}</span>
                <span className="shrink-0 text-[9px] font-black text-white px-1 rounded bg-rose-500">{badge}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 데스크탑 전체메뉴 + 모바일 햄버거 (공통 drawer) */}
      {(mobileMenuOpen || fullMenuOpen) && (
        <FullMenu onClose={() => { setMobileMenuOpen(false); setFullMenuOpen(false); }} />
      )}
    </header>
  );
}

function FullMenu({ onClose }: { onClose: () => void }) {
  const { isLoggedIn, user, logout } = useAuth();
  return (
    <div className="border-t border-gray-200 bg-white shadow-lg">
      <div className="container-main py-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {PRIMARY_NAV.map(({ href, label, Icon }) => (
            <Link key={href} href={href} onClick={onClose}
              className="flex items-center gap-2 px-3 py-3 border border-gray-200 rounded-lg hover:border-accent hover:bg-accent/5 transition-colors">
              <Icon size={15} className="text-accent" />
              <span className="text-[13px] font-bold text-gray-800">{label}</span>
            </Link>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
          {[
            { href: '/board/write?type=sell', label: '판매글 작성' },
            { href: '/board?tab=sell',        label: '판매글 둘러보기' },
            { href: '/board?tab=buy',         label: '매입글 둘러보기' },
            { href: '/recommended',           label: '추천업체' },
            { href: '/guide',                 label: '이용안내' },
            { href: '/fraud',                 label: '사기방지' },
            { href: '/notice',                label: '공지사항' },
            { href: '/contact',               label: '1:1 문의' },
            { href: '/advertising',           label: '광고 신청' },
            { href: '/faq',                   label: '자주묻는 질문' },
          ].map(({ href, label }) => (
            <Link key={href} href={href} onClick={onClose}
              className="px-3 py-2.5 text-[12.5px] text-gray-600 hover:text-accent transition-colors">
              {label}
            </Link>
          ))}
        </div>
        <div className="border-t border-gray-200 mt-3 pt-3 flex flex-wrap items-center gap-2">
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" onClick={onClose}
                className="inline-flex items-center gap-1.5 h-9 px-4 bg-accent text-white text-[12.5px] font-bold rounded-md">
                <LayoutDashboard size={13} /> {user?.name ?? '내 대시보드'}
              </Link>
              <button onClick={() => { logout(); onClose(); }}
                className="h-9 px-4 text-[12.5px] text-gray-500 hover:text-gray-900">로그아웃</button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={onClose}
                className="inline-flex items-center gap-1.5 justify-center h-10 px-5 text-[13px] font-bold rounded-md transition-colors hover:bg-gray-50"
                style={{ background: '#FFFFFF', color: '#1E293B', border: '1.5px solid #334155' }}>
                <LogIn size={14} strokeWidth={2.4} /> 로그인
              </Link>
              <Link href="/register" onClick={onClose}
                className="inline-flex items-center gap-1.5 justify-center h-10 px-5 text-[13px] font-bold rounded-md transition-colors hover:opacity-95"
                style={{
                  background: '#1E40AF',
                  color: '#FFFFFF',
                  boxShadow: '0 2px 6px -1px rgba(30, 64, 175, 0.3)',
                }}>
                <UserPlus size={14} strokeWidth={2.4} style={{ color: '#FFFFFF' }} />
                <span style={{ color: '#FFFFFF' }}>회원가입</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
