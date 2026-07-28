import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// /robots.txt — 검색 크롤러 접근 규칙. 공개 페이지는 허용, 관리자/API/개인영역은 차단.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/api/',
        '/dashboard',
        '/chat',
        '/board/write',
        '/login',
        '/register',
        '/register-business',
        '/forgot',
        '/search',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
