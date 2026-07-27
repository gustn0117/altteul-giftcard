'use client';

import { MapPin } from 'lucide-react';
import { REGION_SHAPES } from '@/lib/koreaRegionPaths';

interface RegionSelectorProps {
  regions: readonly string[];
  selected: string;
  onSelect: (region: string) => void;
}

/**
 * 지역별 업체찾기 — 각 지역을 실제 시·도 지도 실루엣 + 이름으로 보여주는 격자.
 * PC에서는 전체폭(메인사진 넓이)으로 펼쳐 한 줄에 9칸(2줄)으로 배치한다.
 * 레퍼런스(대출당일 '지역별 업체찾기')와 동일한 구조.
 */
export default function RegionSelector({ regions, selected, onSelect }: RegionSelectorProps) {
  return (
    <div className="mb-4 bg-white border border-gray-200 rounded-xl px-3 py-3.5 sm:px-4 sm:py-4">
      <p className="flex items-center gap-1 text-[13px] font-bold text-gray-700 mb-3">
        <MapPin size={15} className="text-accent" /> 지역별 업체찾기
        <span className="text-gray-300 font-normal px-1">·</span>
        <span className="text-gray-500 font-medium">현재 선택지역</span>
        <span className="text-accent">{selected}</span>
      </p>

      <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5 sm:gap-2">
        {regions.map((r) => {
          const shape = REGION_SHAPES[r];
          const isActive = selected === r;
          return (
            <button
              key={r}
              type="button"
              onClick={() => onSelect(r)}
              aria-pressed={isActive}
              className={`group flex flex-col items-center justify-start gap-1 rounded-lg border px-1 py-2 sm:py-2.5 transition-colors ${
                isActive
                  ? 'border-accent bg-accent/5'
                  : 'border-transparent hover:border-accent/40 hover:bg-accent/4'
              }`}
            >
              <span className="flex h-9 sm:h-11 lg:h-12 items-center justify-center">
                {shape ? (
                  <svg
                    viewBox={shape.viewBox}
                    className={`h-full w-auto transition-colors ${
                      isActive ? 'text-accent' : 'text-gray-300 group-hover:text-accent/70'
                    }`}
                    aria-hidden
                  >
                    <path d={shape.d} fill="currentColor" stroke="currentColor" strokeWidth={1} strokeLinejoin="round" />
                  </svg>
                ) : (
                  <MapPin size={22} className={isActive ? 'text-accent' : 'text-gray-300 group-hover:text-accent/70'} />
                )}
              </span>
              <span
                className={`text-[11px] sm:text-[12px] font-bold leading-none ${
                  isActive ? 'text-accent' : 'text-gray-600 group-hover:text-accent'
                }`}
              >
                {r}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
