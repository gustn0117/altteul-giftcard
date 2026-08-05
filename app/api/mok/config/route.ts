import { NextResponse } from 'next/server';
import { isMokConfigured, mokEnv } from '@/lib/mobileok';

// 클라이언트가 본인확인 사용 가능 여부 + 표준창 스크립트 URL(개발/운영)을 물어보는 엔드포인트.
// env(MOK_ENV)만 바꾸면 rebuild 없이 dev/prod 전환됨.
export const dynamic = 'force-dynamic';

export async function GET() {
  const enabled = isMokConfigured();
  return NextResponse.json({
    enabled,
    scriptUrl: enabled ? mokEnv().scriptUrl : null,
  });
}
