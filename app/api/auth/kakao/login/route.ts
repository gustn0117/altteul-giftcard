import { NextResponse } from 'next/server';
import { kakaoAuthorizeUrl, kakaoConfig } from '@/lib/kakao';

// 카카오 로그인 시작 — 카카오 인증 페이지로 리다이렉트
export async function GET() {
  if (!kakaoConfig().configured) {
    return NextResponse.redirect(new URL('/login?kakao=disabled', 'https://xn--zf0b677a1zdjvp0wb.com'));
  }
  return NextResponse.redirect(kakaoAuthorizeUrl());
}
