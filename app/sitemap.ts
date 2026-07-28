import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { createServiceClient } from '@/lib/supabase';

// /sitemap.xml — 정적 공개 페이지 + 공개 게시글(팝니다 전체 / 삽니다 승인·미만료).
// 게시글이 계속 바뀌므로 1시간마다 재생성.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/board?tab=sell`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE_URL}/board?tab=buy`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE_URL}/recommended`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${SITE_URL}/notice`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${SITE_URL}/faq`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/guide/trade`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/guide/dispute`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/fraud`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/contact`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
  ];

  let postEntries: MetadataRoute.Sitemap = [];
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('posts')
      .select('id, updated_at, created_at, type, approved_at, expires_at')
      .is('deleted_at', null)
      .eq('blind_locked', false)
      .order('created_at', { ascending: false })
      .limit(2000);
    const now = Date.now();
    postEntries = (data ?? [])
      // 팝니다(sell)는 전부 공개, 삽니다(buy)는 승인 + 미만료만 공개
      .filter((p) => p.type === 'sell' || (p.approved_at && (!p.expires_at || new Date(p.expires_at).getTime() > now)))
      .map((p) => ({
        url: `${SITE_URL}/board/${p.id}`,
        lastModified: new Date(p.updated_at || p.created_at),
        changeFrequency: 'daily' as const,
        priority: 0.6,
      }));
  } catch {
    // DB 접근 실패 시에도 정적 페이지 사이트맵은 제공
  }

  return [...staticPages, ...postEntries];
}
