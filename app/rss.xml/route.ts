import { createServiceClient } from '@/lib/supabase';
import { SITE_URL, SITE_NAME, SITE_DESC } from '@/lib/site';

// /rss.xml — 최근 공개 게시글 RSS 2.0 피드. 1시간마다 재생성.
export const revalidate = 3600;

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function GET() {
  let items = '';
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('posts')
      .select('id, title, type, description, created_at, approved_at, expires_at')
      .is('deleted_at', null)
      .eq('blind_locked', false)
      .order('created_at', { ascending: false })
      .limit(50);
    const now = Date.now();
    const posts = (data ?? []).filter(
      (p) => p.type === 'sell' || (p.approved_at && (!p.expires_at || new Date(p.expires_at).getTime() > now)),
    );
    items = posts
      .map((p) => {
        const link = `${SITE_URL}/board/${p.id}`;
        const cat = p.type === 'sell' ? '상품권 팝니다' : '상품권 삽니다';
        return `    <item>
      <title>${esc(p.title || cat)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <category>${esc(cat)}</category>
      <description>${esc(p.description || cat)}</description>
      <pubDate>${new Date(p.created_at).toUTCString()}</pubDate>
    </item>`;
      })
      .join('\n');
  } catch {
    // DB 접근 실패 시 빈 피드라도 유효하게 반환
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE_NAME)}</title>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>${esc(SITE_DESC)}</description>
    <language>ko</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  });
}
