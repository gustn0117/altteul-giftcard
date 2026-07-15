'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Building2, Globe, PenSquare, TrendingUp, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const navItems = [
  { href: '/dashboard', label: '현황', icon: LayoutDashboard },
  { href: '/dashboard/access-stats', label: '접속 통계', icon: TrendingUp },
  { href: '/dashboard/company', label: '업체 정보', icon: Building2 },
  { href: '/dashboard/profile', label: '업체 소개 페이지', icon: Globe },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);

  // 실제 프리미엄 제휴(활성 premium_buyers) 여부 확인
  useEffect(() => {
    let active = true;
    if (!user?.id) { setIsPremium(false); return; }
    supabase.from('premium_buyers').select('id').eq('user_id', user.id).eq('is_active', true).limit(1)
      .then(({ data }) => { if (active) setIsPremium(!!(data && data.length)); }, () => {});
    return () => { active = false; };
  }, [user?.id]);

  return (
    <div className="max-w-[1140px] mx-auto px-5 py-6">
      {/* Header with title + quick actions */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-zinc-900">업체 관리</h1>
          <p className="text-[12px] text-zinc-500">업체 정보와 상품을 관리할 수 있습니다.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/buyer/me" className="btn-secondary text-[11px] h-[30px] px-3 gap-1 whitespace-nowrap shrink-0">
            <Eye size={12} />내 페이지 보기
          </Link>
        </div>
      </div>

      {/* 제휴 상태 배지 — 실제 프리미엄 업체일 때만 '제휴 중' 표시 */}
      <div className="card p-3 mb-4 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {isPremium ? (
          <>
            <span className="badge bg-green-50 text-green-700 text-[11px] shrink-0">프리미엄 제휴</span>
            <span className="text-[12px] text-zinc-500">홈 등 프리미엄 노출이 적용 중입니다.</span>
          </>
        ) : (
          <>
            <span className="badge bg-zinc-100 text-zinc-500 text-[11px] shrink-0">일반 회원</span>
            <span className="text-[12px] text-zinc-500">제휴 신청 시 홈 등에 프리미엄으로 노출됩니다.</span>
            <Link href="/advertising" className="ml-auto shrink-0 text-[12px] font-bold text-accent hover:underline">제휴 신청 →</Link>
          </>
        )}
      </div>

      <div className="flex overflow-x-auto gap-0 mb-5 border-b border-zinc-200 scrollbar-hide">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`tab-underline flex items-center gap-1.5 whitespace-nowrap ${isActive ? 'active' : ''}`}
            >
              <Icon size={13} />
              {item.label}
            </Link>
          );
        })}
        <Link
          href="/board/write"
          className="btn-secondary ml-auto whitespace-nowrap self-center mb-1"
        >
          <PenSquare size={13} />
          등록 글
        </Link>
      </div>

      {children}
    </div>
  );
}
