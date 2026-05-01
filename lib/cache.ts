// sessionStorage 기반 간단 캐시
// 페이지 이동/재방문 시 즉시 표시용

const PREFIX = 'tb_cache_';
const DEFAULT_TTL = 60 * 1000; // 60초

interface CacheEntry<T> {
  data: T;
  expires: number;
}

export function getCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() > entry.expires) {
      sessionStorage.removeItem(PREFIX + key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function setCache<T>(key: string, data: T, ttl = DEFAULT_TTL) {
  if (typeof window === 'undefined') return;
  try {
    const entry: CacheEntry<T> = { data, expires: Date.now() + ttl };
    sessionStorage.setItem(PREFIX + key, JSON.stringify(entry));
  } catch {
    // storage 가득참 등 - 무시
  }
}

// 캐시 + fetch 래퍼: 캐시가 있으면 즉시 반환 + 백그라운드 갱신(SWR 패턴)
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = DEFAULT_TTL,
  onUpdate?: (data: T) => void,
): Promise<T> {
  const cached = getCache<T>(key);
  if (cached !== null) {
    // 백그라운드로 최신화
    fetcher().then((fresh) => {
      setCache(key, fresh, ttl);
      if (onUpdate) onUpdate(fresh);
    }).catch(() => {});
    return cached;
  }
  const fresh = await fetcher();
  setCache(key, fresh, ttl);
  return fresh;
}
