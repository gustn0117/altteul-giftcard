'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';

const regions = [
  '전체', '서울', '경기', '인천', '대전', '대구',
  '부산', '광주', '울산', '세종', '강원', '충북',
  '충남', '전북', '전남', '경북', '경남', '제주'
];

// 메인에 빠르게 보이는 대표 브랜드 8개 (+ 전체)
const productBrands = [
  '전체', '롯데', '신세계', '문화상품권', '컬쳐랜드',
  '스타벅스', '온캐시', '구글플레이', '해피머니'
];

export default function CategorySearch() {
  return (
    <div className="flex flex-col md:flex-row gap-3 h-full">
      {/* 지역으로 업체찾기 */}
      <div className="flex-1 bg-white border border-gray-200 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-[14px] font-bold text-gray-800">지역으로 업체찾기</h3>
          <Link href="/category/area" className="w-6 h-6 flex items-center justify-center border border-gray-300 text-gray-400 hover:text-accent hover:border-accent transition-colors">
            <Plus size={14} />
          </Link>
        </div>
        <div className="p-4 flex-1">
          <div className="flex flex-wrap gap-x-0.5 gap-y-1.5">
            {regions.map((region, i) => (
              <span key={region} className="flex items-center">
                <Link href={`/category/area?region=${region}`}
                  className="px-2 py-1 text-[12px] text-gray-600 hover:text-accent transition-colors">
                  {region}
                </Link>
                {i < regions.length - 1 && <span className="text-gray-200 text-[10px]">·</span>}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 상품으로 업체찾기 */}
      <div className="flex-1 bg-white border border-gray-200 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-[14px] font-bold text-gray-800">상품으로 업체찾기</h3>
          <Link href="/category/product" className="w-6 h-6 flex items-center justify-center border border-gray-300 text-gray-400 hover:text-accent hover:border-accent transition-colors">
            <Plus size={14} />
          </Link>
        </div>
        <div className="p-3 flex-1 flex flex-col">
          <div className="grid grid-cols-5 gap-1 flex-1">
            {productBrands.map((brand) => (
              <Link
                key={brand}
                href={`/category/product?type=${brand}`}
                className="flex flex-col items-center gap-1 py-1.5 hover:bg-accent/5 rounded transition-colors"
              >
                <BrandLogo name={brand} size="sm" />
                <span className="text-[10px] text-gray-600 truncate max-w-full">{brand}</span>
              </Link>
            ))}
          </div>
          <div className="flex justify-end mt-2">
            <Link href="/category/product" className="text-[11px] text-accent font-bold hover:underline">
              전체 브랜드 보기+
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
