import Link from 'next/link';
import { Phone, MapPin, Search } from 'lucide-react';
import type { DBPremiumBuyer } from '@/lib/types';

const TIER_BADGE: Record<string, string> = {
  premium: 'bg-yellow-400 text-zinc-900',
  standard: 'bg-white text-zinc-900',
  basic: 'bg-zinc-200 text-zinc-700',
};
const TIER_LABEL: Record<string, string> = { premium: 'PREMIUM', standard: 'PRO', basic: 'BASIC' };

export default function PremiumBuyerCard({ id, name, description, phone, region, image_url, tier }: DBPremiumBuyer) {
  return (
    <div className="card overflow-hidden card-hover flex flex-col h-full">
      {/* Top: 이미지 + 업체명 오버레이 */}
      <div className="relative h-[120px] bg-zinc-200 overflow-hidden">
        {image_url ? (
          <img src={image_url} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1C1D3E 0%, #2A2B55 100%)' }}>
            <span className="text-white/30 text-[11px]">이미지 없음</span>
          </div>
        )}
        {/* 어둡게 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        {/* 티어 뱃지 */}
        <span className={`absolute top-2 right-2 badge ${TIER_BADGE[tier] || TIER_BADGE.standard} text-[9px] font-bold`}>
          {TIER_LABEL[tier] || 'PRO'}
        </span>
        {/* 업체명 */}
        <div className="absolute inset-x-0 bottom-0 p-3">
          <h3 className="text-white text-[15px] font-bold leading-tight drop-shadow">{name}</h3>
        </div>
      </div>

      {/* Middle: 소개글 */}
      <div className="px-3 py-3 flex-1 flex flex-col">
        <p className="text-[12px] text-zinc-600 line-clamp-2 leading-relaxed min-h-[2.4em] text-center">
          {description || '간편한 상품권 매입'}
        </p>

        {/* 업체명 + 지역 */}
        <div className="flex items-center justify-between mt-3 text-[11px]">
          <span className="flex items-center gap-1 text-zinc-700 font-medium">
            <Phone size={10} />{name}
          </span>
          {region && <span className="text-zinc-400">{region}</span>}
        </div>

        {/* 버튼 2개 */}
        <div className="flex gap-1.5 mt-3">
          <Link href={`/buyer/${id}`}
            className="flex-1 h-9 flex items-center justify-center gap-1 text-[12px] font-medium border border-zinc-200 rounded hover:bg-zinc-50 transition-colors">
            <Search size={12} /> 상세보기
          </Link>
          <a href={phone ? `tel:${phone.replace(/[^0-9]/g, '')}` : '#'}
            className="flex-1 h-9 flex items-center justify-center gap-1 text-[12px] font-medium text-white rounded transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%)' }}>
            <Phone size={12} /> 통화하기
          </a>
        </div>
      </div>
    </div>
  );
}
