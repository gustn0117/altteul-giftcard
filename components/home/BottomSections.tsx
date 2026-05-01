'use client';

import Link from 'next/link';
import { Plus, ChevronRight } from 'lucide-react';
import type { DBNotice } from '@/lib/types';

interface BottomSectionsProps {
  notices: DBNotice[];
}

const tipItems = [
  { title: '안전거래를 위한 필수 체크리스트', isNew: true },
  { title: '상품권 시세 확인하는 방법', isNew: true },
  { title: '사기 업체 구별하는 방법', isNew: false },
  { title: '상품권 거래 시 주의사항 안내', isNew: false },
  { title: '계약서 작성 방법 안내', isNew: true },
];

const newsItems = [
  { title: '상품권 시장 동향 분석 리포트', date: '2026.04.06', isNew: true },
  { title: '온라인 상품권 거래 플랫폼 비교', date: '2026.04.01', isNew: true },
  { title: '상품권 매입 업체 등록 절차 안내', date: '2026.03.24', isNew: false },
];

export default function BottomSections({ notices }: BottomSectionsProps) {
  return (
    <>
      {/* 3-column info section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        {/* 거래 TIP */}
        <div className="bg-white border border-gray-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 className="text-[14px] font-bold">
              거래TIP <span className="text-accent">985건</span>
            </h3>
          </div>
          <div className="p-3">
            {tipItems.map((item, i) => (
              <Link key={i} href="/guide" className="flex items-center gap-1.5 py-1.5 text-[12px] text-gray-600 hover:text-accent transition-colors">
                <span className="text-gray-400">·</span>
                <span className="truncate">{item.title}</span>
                {item.isNew && <span className="text-[9px] text-white bg-red-500 px-1 rounded-sm shrink-0">N</span>}
              </Link>
            ))}
            <Link href="/guide" className="flex items-center justify-center gap-1 mt-2 py-2 bg-accent text-white text-[12px] font-bold hover:opacity-90 transition-colors">
              거래TIP 더보기 <Plus size={12} />
            </Link>
          </div>
        </div>

        {/* 업계뉴스 */}
        <div className="bg-white border border-gray-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 className="text-[14px] font-bold">
              업계뉴스 <span className="text-accent">483건</span>
            </h3>
            <Link href="/community" className="w-5 h-5 flex items-center justify-center border border-gray-300 text-gray-400 hover:text-accent">
              <Plus size={12} />
            </Link>
          </div>
          <div className="p-3">
            {newsItems.map((item, i) => (
              <Link key={i} href="/community" className="flex items-center justify-between py-1.5 text-[12px] hover:text-accent transition-colors">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-gray-400">·</span>
                  <span className="truncate text-gray-600">{item.title}</span>
                  {item.isNew && <span className="text-[9px] text-white bg-red-500 px-1 rounded-sm shrink-0">N</span>}
                </div>
                <span className="text-[10px] text-gray-400 shrink-0 ml-2">{item.date}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* 질문과답변 */}
        <div className="bg-white border border-gray-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 className="text-[14px] font-bold">
              질문과답변 <span className="text-accent">2,290건</span>
            </h3>
            <Link href="/faq" className="w-5 h-5 flex items-center justify-center border border-gray-300 text-gray-400 hover:text-accent">
              <Plus size={12} />
            </Link>
          </div>
          <div className="p-3">
            {[1, 2, 3, 4, 5].map((_, i) => (
              <Link key={i} href="/faq" className="flex items-center justify-between py-1.5 text-[12px] hover:text-accent transition-colors">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-gray-400">·</span>
                  <span className="truncate text-gray-600">문의드립니다.</span>
                  <span className="text-[9px] text-white bg-red-500 px-1 rounded-sm shrink-0">N</span>
                </div>
                <span className="text-[10px] text-gray-400 shrink-0 ml-2">2026.04.{16 - i}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 공지사항 + 바로가기 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <div className="md:col-span-2 bg-white border border-gray-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 className="text-[14px] font-bold">
              공지사항 <span className="text-accent">{notices.length > 0 ? `${notices.length}건` : ''}</span>
            </h3>
            <Link href="/notice" className="w-5 h-5 flex items-center justify-center border border-gray-300 text-gray-400 hover:text-accent">
              <Plus size={12} />
            </Link>
          </div>
          <div className="p-3">
            {notices.slice(0, 4).map((notice) => (
              <Link key={notice.id} href="/notice" className="flex items-center justify-between py-1.5 text-[12px] hover:text-accent transition-colors">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-gray-400">·</span>
                  <span className="truncate text-gray-600">{notice.title}</span>
                  {notice.is_pinned && <span className="text-[9px] text-white bg-red-500 px-1 rounded-sm shrink-0">N</span>}
                </div>
                <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                  {new Date(notice.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '')}
                </span>
              </Link>
            ))}
            {notices.length === 0 && (
              <p className="text-[12px] text-gray-400 py-3 text-center">등록된 공지사항이 없습니다.</p>
            )}
          </div>
        </div>

        {/* 바로가기 */}
        <div className="bg-white border border-gray-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 className="text-[14px] font-bold">바로가기</h3>
          </div>
          <div className="grid grid-cols-3 gap-0">
            <Link href="/advertising" className="flex flex-col items-center gap-1.5 py-4 hover:bg-gray-50 transition-colors border-r border-b border-gray-100">
              <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-gray-500">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </div>
              <span className="text-[10px] text-gray-600">광고문의</span>
            </Link>
            <Link href="/faq" className="flex flex-col items-center gap-1.5 py-4 hover:bg-gray-50 transition-colors border-r border-b border-gray-100">
              <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-gray-500">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              </div>
              <span className="text-[10px] text-gray-600">1:1문의</span>
            </Link>
            <Link href="/faq" className="flex flex-col items-center gap-1.5 py-4 hover:bg-gray-50 transition-colors border-b border-gray-100">
              <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-gray-500">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/></svg>
              </div>
              <span className="text-[10px] text-gray-600">자주묻는질문</span>
            </Link>
          </div>
        </div>
      </div>

      {/* TIP bar */}
      <div className="bg-accent/10 border border-accent/20 px-4 py-3 mb-6">
        <p className="text-[12px] text-gray-700">
          <span className="inline-flex items-center gap-1 text-accent font-bold mr-2">
            <span className="bg-accent text-white text-[10px] px-1.5 py-0.5 rounded-sm">TIP</span>
          </span>
          알뜰상품권에 광고 중인 등록업체마다 기준과 상품, 할인율, 거래방식이 모두 다르기 때문에 여러 업체와 상담해보시는게 유리합니다.
        </p>
      </div>
    </>
  );
}
