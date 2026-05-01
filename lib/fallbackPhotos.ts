/**
 * 메인 등록업체 / 데모 카드 등 image_url이 없을 때 노출할 레퍼런스 배경 사진.
 * picsum.photos는 deterministic seed 기반 무료 stock 사진 CDN 으로,
 * 같은 seed → 항상 같은 사진을 반환한다 (외부 의존이지만 항상 동작).
 *
 * 운영 중 자체 호스팅 이미지로 교체하고 싶으면 여기 URL만 갈아끼우면 됨.
 */

export const FALLBACK_PHOTOS = [
  // 상품권 / 카드
  'https://picsum.photos/seed/giftcard-1/640/360',
  'https://picsum.photos/seed/voucher-2/640/360',
  // 카페 / 매장
  'https://picsum.photos/seed/cafe-3/640/360',
  'https://picsum.photos/seed/store-4/640/360',
  // 모니터 / 사무실
  'https://picsum.photos/seed/monitor-5/640/360',
  'https://picsum.photos/seed/desk-6/640/360',
  // 쇼핑 / 결제
  'https://picsum.photos/seed/shopping-7/640/360',
  'https://picsum.photos/seed/payment-8/640/360',
  // 화폐 / 비즈니스
  'https://picsum.photos/seed/coins-9/640/360',
  'https://picsum.photos/seed/business-10/640/360',
];

/** 카드 인덱스 또는 임의 시드로 일관된 배경 사진 URL 반환 */
export function pickFallbackPhoto(seed: string | number): string {
  const key = typeof seed === 'number' ? seed : hash(seed);
  return FALLBACK_PHOTOS[Math.abs(key) % FALLBACK_PHOTOS.length];
}

/** 짧은 결정적 해시 (id → 인덱스) */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
