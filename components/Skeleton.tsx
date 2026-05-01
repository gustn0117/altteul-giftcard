// 간단 스켈레톤 블록
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

// 게시글 리스트 스켈레톤 (한 줄)
export function PostRowSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center py-3 px-4 border-b border-gray-100 last:border-b-0 gap-2.5">
          <div className="w-6 h-4 bg-gray-100 rounded hidden md:block" />
          <div className="w-12 h-5 bg-gray-100 rounded-sm" />
          <div className="h-4 bg-gray-100 rounded flex-1 max-w-[280px]" />
          <div className="hidden md:flex gap-1">
            <div className="w-12 h-4 bg-gray-100 rounded" />
            <div className="w-12 h-4 bg-gray-100 rounded" />
          </div>
          <div className="flex-1" />
          <div className="w-24 h-4 bg-gray-100 rounded" />
        </div>
      ))}
    </div>
  );
}

// 업체 카드 그리드 스켈레톤
export function CompanyCardGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-200">
          <div className="h-[120px] bg-gray-100 animate-pulse" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-gray-100 rounded w-full animate-pulse" />
            <div className="h-3 bg-gray-100 rounded w-3/4 animate-pulse" />
          </div>
          <div className="px-3 py-2 border-t border-gray-100 flex justify-between">
            <div className="h-3 bg-gray-100 rounded w-12 animate-pulse" />
            <div className="h-3 bg-gray-100 rounded w-8 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

// 노티스 스켈레톤
export function NoticeListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between px-4 py-2 border-b border-gray-100 last:border-b-0">
          <div className="h-3 bg-gray-100 rounded flex-1 max-w-[60%] animate-pulse" />
          <div className="h-3 bg-gray-100 rounded w-16 animate-pulse" />
        </div>
      ))}
    </div>
  );
}
