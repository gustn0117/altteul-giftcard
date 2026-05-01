/**
 * 브랜드 로고 컴포넌트
 *
 * 각 상품권 브랜드의 시각적 정체성을 SVG 기반 마크로 렌더링.
 * 실제 브랜드 로고 이미지를 사용하지 않고 브랜드 색상·타이포그래피로 식별.
 *
 * 라이선스 받은 실제 로고 이미지가 있다면 BRAND_LOGOS[key].imageUrl 만 설정하면
 * 자동으로 이미지로 교체됩니다. (/public/brands/lotte.svg 등)
 */

type BrandDef = {
  /** 메인 배경/그라데이션 */
  bg: string;
  /** 주 전경색 */
  fg: string;
  /** 로고 마크 (SVG children) */
  mark: React.ReactNode;
  /** 이미지 override (있으면 SVG 대신 이미지 사용) */
  imageUrl?: string;
};

// 각 브랜드의 공식 색상을 참고한 SVG 마크
// (원본 저작권 로고의 복제가 아닌, 디자인 참조한 자체 표현)
export const BRAND_LOGOS: Record<string, BrandDef> = {
  '롯데': {
    bg: 'linear-gradient(135deg, #E60012 0%, #B8000E 100%)',
    fg: '#FFFFFF',
    mark: (
      <text x="50%" y="58%" textAnchor="middle" fontSize="28" fontWeight="900" fontFamily="Georgia, serif" letterSpacing="-1" fill="currentColor">
        LOTTE
      </text>
    ),
  },
  '신세계': {
    bg: 'linear-gradient(135deg, #111111 0%, #2C2C2C 100%)',
    fg: '#C9A961',
    mark: (
      <>
        <text x="50%" y="55%" textAnchor="middle" fontSize="26" fontWeight="300" fontFamily="Georgia, serif" letterSpacing="2" fill="currentColor">
          SSG
        </text>
        <circle cx="82" cy="38" r="2.5" fill="currentColor" />
      </>
    ),
  },
  '문화상품권': {
    bg: 'linear-gradient(135deg, #FF7A00 0%, #FF9500 100%)',
    fg: '#FFFFFF',
    mark: (
      <>
        <text x="50%" y="42%" textAnchor="middle" fontSize="18" fontWeight="900" fontFamily="system-ui, sans-serif" fill="currentColor">
          문화
        </text>
        <text x="50%" y="70%" textAnchor="middle" fontSize="11" fontWeight="700" fontFamily="system-ui, sans-serif" letterSpacing="1" fill="currentColor">
          상품권
        </text>
      </>
    ),
  },
  '컬쳐랜드': {
    bg: 'linear-gradient(135deg, #4A1E8A 0%, #8B3DBF 100%)',
    fg: '#FFFFFF',
    mark: (
      <>
        <text x="50%" y="48%" textAnchor="middle" fontSize="20" fontWeight="800" fontFamily="system-ui, sans-serif" letterSpacing="-0.5" fill="currentColor">
          Culture
        </text>
        <text x="50%" y="72%" textAnchor="middle" fontSize="12" fontWeight="600" fontFamily="system-ui, sans-serif" letterSpacing="2" fill="#E0C3FC">
          LAND
        </text>
      </>
    ),
  },
  '스타벅스': {
    bg: '#006241',
    fg: '#FFFFFF',
    mark: (
      <>
        <circle cx="50" cy="42" r="22" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="50" cy="42" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <text x="50%" y="94%" textAnchor="middle" fontSize="9" fontWeight="700" fontFamily="system-ui" letterSpacing="1.5" fill="currentColor">
          STARBUCKS
        </text>
      </>
    ),
  },
  '온캐시': {
    bg: 'linear-gradient(135deg, #0052CC 0%, #0065FF 100%)',
    fg: '#FFFFFF',
    mark: (
      <>
        <text x="50%" y="50%" textAnchor="middle" fontSize="22" fontWeight="900" fontFamily="system-ui, sans-serif" letterSpacing="-1" fill="currentColor">
          ONCASH
        </text>
        <text x="50%" y="75%" textAnchor="middle" fontSize="10" fontWeight="600" fontFamily="system-ui" fill="#A8C7F8">
          온캐시
        </text>
      </>
    ),
  },
  '구글플레이': {
    bg: '#FFFFFF',
    fg: '#5F6368',
    mark: (
      <>
        {/* Google Play 3색 삼각형 모티프 */}
        <g transform="translate(35, 20)">
          <polygon points="0,0 0,40 18,20" fill="#4285F4" />
          <polygon points="0,0 18,20 30,13" fill="#EA4335" />
          <polygon points="0,40 18,20 30,27" fill="#FBBC04" />
          <polygon points="18,20 30,13 30,27" fill="#34A853" />
        </g>
        <text x="50%" y="93%" textAnchor="middle" fontSize="9" fontWeight="700" fontFamily="system-ui" fill="currentColor">
          Google Play
        </text>
      </>
    ),
  },
  '틴캐시': {
    bg: 'linear-gradient(135deg, #7B1FA2 0%, #CE93D8 100%)',
    fg: '#FFFFFF',
    mark: (
      <>
        <text x="50%" y="50%" textAnchor="middle" fontSize="22" fontWeight="900" fontFamily="system-ui, sans-serif" letterSpacing="-0.5" fill="currentColor">
          TEEN
        </text>
        <text x="50%" y="77%" textAnchor="middle" fontSize="11" fontWeight="700" fontFamily="system-ui" letterSpacing="2" fill="#FCE4FF">
          CASH
        </text>
      </>
    ),
  },
  '배민상품권': {
    bg: 'linear-gradient(135deg, #2AC1BC 0%, #1FAFA9 100%)',
    fg: '#FFFFFF',
    mark: (
      <>
        <text x="50%" y="48%" textAnchor="middle" fontSize="22" fontWeight="900" fontFamily="system-ui, sans-serif" letterSpacing="-1" fill="currentColor">
          배민
        </text>
        <text x="50%" y="74%" textAnchor="middle" fontSize="11" fontWeight="700" fontFamily="system-ui" letterSpacing="1" fill="#C3F5F3">
          상품권
        </text>
      </>
    ),
  },
  '해피머니': {
    bg: 'linear-gradient(135deg, #FFD600 0%, #FFC107 100%)',
    fg: '#3E2723',
    mark: (
      <>
        {/* 웃는 얼굴 모티프 */}
        <circle cx="50" cy="35" r="13" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="45" cy="33" r="1.5" fill="currentColor" />
        <circle cx="55" cy="33" r="1.5" fill="currentColor" />
        <path d="M 44 38 Q 50 42 56 38" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <text x="50%" y="82%" textAnchor="middle" fontSize="11" fontWeight="900" fontFamily="system-ui" letterSpacing="0.5" fill="currentColor">
          HAPPY MONEY
        </text>
      </>
    ),
  },
  '기타': {
    bg: 'linear-gradient(135deg, #64748B 0%, #94A3B8 100%)',
    fg: '#FFFFFF',
    mark: (
      <>
        <rect x="30" y="25" width="40" height="28" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M 30 36 L 70 36" stroke="currentColor" strokeWidth="1.5" />
        <path d="M 50 25 Q 45 18 40 25" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M 50 25 Q 55 18 60 25" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <text x="50%" y="85%" textAnchor="middle" fontSize="10" fontWeight="700" fontFamily="system-ui" fill="currentColor">
          GIFT CARD
        </text>
      </>
    ),
  },
  '전체': {
    bg: '#F3F4F6',
    fg: '#6B7280',
    mark: (
      <>
        <rect x="28" y="30" width="18" height="18" rx="2" fill="currentColor" opacity="0.3" />
        <rect x="54" y="30" width="18" height="18" rx="2" fill="currentColor" opacity="0.5" />
        <rect x="28" y="54" width="18" height="18" rx="2" fill="currentColor" opacity="0.5" />
        <rect x="54" y="54" width="18" height="18" rx="2" fill="currentColor" opacity="0.3" />
      </>
    ),
  },
};

function normalizeBrandKey(name: string): string {
  if (BRAND_LOGOS[name]) return name;
  if (name.includes('롯데')) return '롯데';
  if (name.includes('신세계') || name.toLowerCase().includes('ssg')) return '신세계';
  if (name.includes('문화')) return '문화상품권';
  if (name.includes('컬쳐') || name.includes('컬처') || name.toLowerCase().includes('culture')) return '컬쳐랜드';
  if (name.toLowerCase().includes('starbucks') || name.includes('스타벅스')) return '스타벅스';
  if (name.toLowerCase().includes('oncash') || name.includes('온캐시')) return '온캐시';
  if (name.toLowerCase().includes('google') || name.includes('구글')) return '구글플레이';
  if (name.toLowerCase().includes('teen') || name.includes('틴캐시')) return '틴캐시';
  if (name.includes('배민')) return '배민상품권';
  if (name.includes('해피머니') || name.toLowerCase().includes('happy')) return '해피머니';
  if (name === '전체') return '전체';
  return '기타';
}

interface BrandLogoProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/** SVG 뷰박스 기준 100x80 정사각 내 로고 마크 */
export function BrandLogo({ name, size = 'md', className = '' }: BrandLogoProps) {
  const key = normalizeBrandKey(name);
  const brand = BRAND_LOGOS[key];

  const dimensions = {
    sm: { w: 48, h: 38 },
    md: { w: 64, h: 50 },
    lg: { w: 96, h: 74 },
  }[size];

  // 라이선스 이미지가 있으면 이미지로 대체
  if (brand.imageUrl) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-md shadow-sm overflow-hidden border border-gray-100 ${className}`}
        style={{ width: dimensions.w, height: dimensions.h, background: '#FFFFFF' }}
      >
        <img src={brand.imageUrl} alt={name} className="w-full h-full object-contain p-1" />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center rounded-md shadow-sm overflow-hidden ${className}`}
      style={{
        width: dimensions.w,
        height: dimensions.h,
        background: brand.bg,
        color: brand.fg,
        border: key === '전체' || key === '구글플레이' ? '1px solid rgba(0,0,0,0.08)' : 'none',
      }}
    >
      <svg viewBox="0 0 100 80" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {brand.mark}
      </svg>
    </div>
  );
}

/** 가로 배지 (텍스트 라벨용) */
export function BrandBadge({ name, className = '' }: { name: string; className?: string }) {
  const key = normalizeBrandKey(name);
  const brand = BRAND_LOGOS[key];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm font-bold text-[11px] ${className}`}
      style={{ background: brand.bg, color: brand.fg }}
    >
      {name}
    </span>
  );
}

// SellPostItem 호환성을 위한 alias
export const BRAND_STYLES = new Proxy({} as Record<string, { bg: string; fg: string }>, {
  get(_target, prop: string) {
    const brand = BRAND_LOGOS[prop] || BRAND_LOGOS['기타'];
    return { bg: brand.bg, fg: brand.fg };
  },
});

export { normalizeBrandKey };
