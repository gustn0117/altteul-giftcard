'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  // 표시할 페이지 번호 계산 (최대 5개)
  const pages: number[] = [];
  let start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  start = Math.max(1, end - 4);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-1 py-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-8 h-8 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={15} />
      </button>

      {start > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className="w-8 h-8 flex items-center justify-center rounded text-[12px] text-zinc-500 hover:bg-zinc-100 transition-colors">1</button>
          {start > 2 && <span className="text-[12px] text-zinc-300 px-1">...</span>}
        </>
      )}

      {pages.map(p => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`w-8 h-8 flex items-center justify-center rounded text-[12px] font-medium transition-colors ${
            p === currentPage ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-100'
          }`}
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-[12px] text-zinc-300 px-1">...</span>}
          <button onClick={() => onPageChange(totalPages)} className="w-8 h-8 flex items-center justify-center rounded text-[12px] text-zinc-500 hover:bg-zinc-100 transition-colors">{totalPages}</button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-8 h-8 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
}
