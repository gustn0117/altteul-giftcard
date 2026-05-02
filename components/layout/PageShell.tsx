import HomeAside from '@/components/layout/HomeAside';

interface PageShellProps {
  /** 페이지 제목 (좌상단) */
  title?: string;
  /** 우상단 breadcrumb 영역 */
  breadcrumb?: React.ReactNode;
  /** 좌측 사이드 (생략 시 HomeAside) */
  aside?: React.ReactNode;
  /** 사이드 숨김 (true → 풀와이드) */
  fullWidth?: boolean;
  children: React.ReactNode;
}

/**
 * 모든 콘텐츠 페이지에 일관된 외골격을 적용하는 셸.
 * - 헤더 아래 container-main 컨테이너
 * - 데스크탑: 좌측 280px 사이드 + 우측 메인
 * - 모바일: 1컬럼 (사이드는 메인 위)
 */
export default function PageShell({ title, breadcrumb, aside, fullWidth = false, children }: PageShellProps) {
  return (
    <div className="container-main py-6">
      {(title || breadcrumb) && (
        <div className="flex items-center justify-between mb-4 gap-3">
          {title && <h1 className="text-[18px] font-bold text-gray-800">{title}</h1>}
          {breadcrumb && <div className="breadcrumb">{breadcrumb}</div>}
        </div>
      )}
      {fullWidth ? (
        <div>{children}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <div>{aside ?? <HomeAside />}</div>
          <div className="min-w-0">{children}</div>
        </div>
      )}
    </div>
  );
}
