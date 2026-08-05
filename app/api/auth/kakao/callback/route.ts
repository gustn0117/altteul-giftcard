import { NextRequest, NextResponse } from 'next/server';
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

    // 1) kakao_id로 기존 연결 회원 조회 → 있으면 닉네임/이메일/전화번호 새로 들어온 것 갱신
    let { data: user } = await supabase.from('users').select('*').eq('kakao_id', profile.id).maybeSingle();
    if (user) {
      const patch: Record<string, unknown> = {};
      if (profile.nickname && profile.nickname !== user.name) patch.name = profile.nickname;
      if (profile.email && profile.email !== user.email) patch.email = profile.email;
      if (profile.phone && !user.phone) {
        patch.phone = profile.phone;
        patch.phone_verified = true;
        patch.phone_verified_at = nowIso;
      }
      if (Object.keys(patch).length > 0) {
        patch.updated_at = nowIso;
        await supabase.from('users').update(patch).eq('id', user.id);
        user = { ...user, ...patch };
      }
    }

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

    // 3) 기존 회원이 아니면 카카오로는 신규 가입 불가 — 휴대폰 본인확인 가입으로 유도.
    //    (회원가입은 '무조건 본인확인' 정책. 카카오는 기존 연결회원 로그인 용도로만 유지)
    if (!user) {
      return NextResponse.redirect(`${origin}/register?need=verify`);
    }

    const token = signBridgeToken(user.id as string);
    return NextResponse.redirect(`${origin}/auth/kakao?t=${encodeURIComponent(token)}`);
  } catch (e) {
    console.error('[kakao/callback]', e);
    return NextResponse.redirect(`${origin}/login?kakao=fail`);
  }
}
