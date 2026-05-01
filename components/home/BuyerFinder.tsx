import Link from 'next/link';
import { Plus } from 'lucide-react';

const REGIONS = [
  '전체', '서울', '경기', '인천', '대전', '대구',
  '부산', '광주', '울산', '세종', '강원', '충북',
  '충남', '전북', '전남', '경북', '경남', '제주',
];

const BRANDS = [
  '전체', '신세계', '롯데', '문화상품권', '컬쳐랜드',
  '스타벅스', '온캐시', '구글플레이', '해피머니',
  '틴캐시', '배민상품권', '교보문고', 'GS25', 'CU',
];

export default function BuyerFinder() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
      {/* 지역으로 업체찾기 */}
      <div className="bg-white border border-gray-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-[15px] font-bold text-gray-800">지역으로 업체찾기</h3>
          <Link
            href="/category/area"
            aria-label="지역으로 업체찾기 전체보기"
            className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-500 hover:border-accent hover:text-accent transition-colors"
          >
            <Plus size={13} />
          </Link>
        </div>
        <div className="px-5 py-4">
          <div className="flex flex-wrap gap-x-1.5 gap-y-2.5 text-[13px]">
            {REGIONS.map((r, i) => (
              <span key={r} className="flex items-center">
                <Link
                  href={r === '전체' ? '/category/area' : `/category/area?region=${encodeURIComponent(r)}`}
                  className="text-gray-700 hover:text-accent hover:underline"
                >
                  {r}
                </Link>
                {i < REGIONS.length - 1 && <span className="text-gray-300 mx-1.5">·</span>}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 상품으로 업체찾기 */}
      <div className="bg-white border border-gray-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-[15px] font-bold text-gray-800">상품으로 업체찾기</h3>
          <Link
            href="/category/product"
            aria-label="상품으로 업체찾기 전체보기"
            className="w-7 h-7 flex items-center justify-center border border-gray-300 text-gray-500 hover:border-accent hover:text-accent transition-colors"
          >
            <Plus size={13} />
          </Link>
        </div>
        <div className="px-5 py-4">
          <div className="flex flex-wrap gap-x-1.5 gap-y-2.5 text-[13px]">
            {BRANDS.map((b, i) => (
              <span key={b} className="flex items-center">
                <Link
                  href={b === '전체' ? '/category/product' : `/category/product?type=${encodeURIComponent(b)}`}
                  className="text-gray-700 hover:text-accent hover:underline"
                >
                  {b}
                </Link>
                {i < BRANDS.length - 1 && <span className="text-gray-300 mx-1.5">·</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
