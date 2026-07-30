import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase';
import { kakaoExchangeToken, kakaoGetProfile, signBridgeToken } from '@/lib/kakao';
import { SITE_URL } from '@/lib/site';

// 리버스 프록시 뒤라서 req.nextUrl.origin이 0.0.0.0으로 잡힘 → 공개 도메인으로 복원.
function publicOrigin(req: NextRequest): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  if (host && !/^(0\.0\.0\.0|localhost|127\.|\[?::)/.test(host)) return `${proto}://${host}`;
  return SITE_URL; // 공개 도메인(예판상품권.com) 폴백
}

// 카카오 인증 콜백 — 코드 교환 → 프로필 조회 → 회원 찾기/생성 → 브릿지 토큰으로 클라이언트 로그인 페이지 이동
export async function GET(req: NextRequest) {
  const origin = publicOrigin(req);
  const code = req.nextUrl.searchParams.get('code');
  const err = req.nextUrl.searchParams.get('error');
  if (err || !code) {
    return NextResponse.redirect(`${origin}/login?kakao=error`);
  }

  try {
    const accessToken = await kakaoExchangeToken(code);
    const profile = await kakaoGetProfile(accessToken);
    const supabase = createServiceClient();
    const nowIso = new Date().toISOString();

    // 1) kakao_id로 기존 연결 회원 조회
    let { data: user } = await supabase.from('users').select('*').eq('kakao_id', profile.id).maybeSingle();

    // 2) 없으면 전화번호로 기존 일반회원 매칭(기존 회원이 카카오로 처음 로그인) → kakao_id 연결
    if (!user && profile.phone) {
      const { data: byPhone } = await supabase
        .from('users').select('*').eq('type', 'normal').eq('phone', profile.phone).limit(1);
      if (byPhone && byPhone[0]) {
        user = byPhone[0];
        await supabase.from('users')
          .update({ kakao_id: profile.id, phone_verified: true, phone_verified_at: nowIso, updated_at: nowIso })
          .eq('id', user.id);
      }
    }

    // 3) 그래도 없으면 신규 생성 (비밀번호는 임의값 — 카카오로만 로그인)
    if (!user) {
      const name = profile.nickname || (profile.phone ? `카카오회원${profile.phone.slice(-4)}` : '카카오회원');
      const randomPw = crypto.randomBytes(16).toString('hex');
      const { data: created, error } = await supabase.from('users').insert({
        type: 'normal',
        name,
        email: profile.email,
        phone: profile.phone,
        kakao_id: profile.id,
        password_hash: crypto.createHash('sha256').update(randomPw).digest('hex'),
        points: 0,
        phone_verified: !!profile.phone,
        phone_verified_at: profile.phone ? nowIso : null,
      }).select('*').single();
      if (error) throw new Error(`회원 생성 실패: ${error.message}`);
      user = created;
    }

    const token = signBridgeToken(user.id as string);
    return NextResponse.redirect(`${origin}/auth/kakao?t=${encodeURIComponent(token)}`);
  } catch (e) {
    console.error('[kakao/callback]', e);
    return NextResponse.redirect(`${origin}/login?kakao=fail`);
  }
}
