'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, FileText, Users, BarChart3, Building2, Globe, PenSquare, TrendingUp, Eye, MessageCircle } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: '현황', icon: LayoutDashboard },
  { href: '/dashboard/stats', label: '통계', icon: BarChart3 },
  { href: '/dashboard/schedule', label: '스케줄 현황', icon: Calendar },
  { href: '/dashboard/transactions', label: '거래 내역', icon: FileText },
  { href: '/dashboard/customers', label: '고객별 집계', icon: Users },
  { href: '/dashboard/access-stats', label: '접속 통계', icon: TrendingUp },
  { href: '/dashboard/company', label: '업체 정보', icon: Building2 },
  { href: '/dashboard/profile', label: '업체 소개 페이지', icon: Globe },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="max-w-[1140px] mx-auto px-5 py-6">
      {/* Header with title + quick actions */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-zinc-900">업체 관리</h1>
          <p className="text-[12px] text-zinc-500">업체 정보와 상품을 관리할 수 있습니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/buyer/me" className="btn-secondary text-[11px] h-[30px] px-3 gap-1">
            <Eye size={12} />내 페이지 보기
          </Link>
          <Link href="/chat" className="btn-secondary text-[11px] h-[30px] px-3 gap-1">
            <MessageCircle size={12} />내 거래
          </Link>
        </div>
      </div>

      {/* Premium badge */}
      <div className="card p-3 mb-4 flex items-center gap-3">
        <span className="badge bg-green-50 text-green-700 text-[11px]">프리미엄 제휴</span>
        <span className="text-[12px] text-zinc-500">홈 등 프리미엄 노출이 적용 중입니다.</span>
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
