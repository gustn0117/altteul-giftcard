const KEY = 'altteul-giftcard_recent_buyers';
const MAX = 10;
const EVENT = 'recent-buyers-changed';

export interface RecentBuyer {
  id: string;
  name: string;
  region?: string | null;
  image_url?: string | null;
  viewedAt: number;
}

export function getRecentBuyers(): RecentBuyer[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addRecentBuyer(buyer: {
  id: string;
  name: string;
  region?: string | null;
  image_url?: string | null;
}) {
  if (typeof window === 'undefined') return;
  if (!buyer?.id || !buyer?.name) return;
  try {
    const existing = getRecentBuyers();
    const filtered = existing.filter((b) => b.id !== buyer.id);
    const next: RecentBuyer[] = [
      {
        id: buyer.id,
        name: buyer.name,
        region: buyer.region ?? null,
        image_url: buyer.image_url ?? null,
        viewedAt: Date.now(),
      },
      ...filtered,
    ].slice(0, MAX);
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    // localStorage 사용 불가 환경 무시
  }
}

export function clearRecentBuyers() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {}
}

export const RECENT_BUYERS_EVENT = EVENT;
