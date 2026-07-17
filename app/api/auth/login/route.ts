import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// 휴대폰 번호를 여러 저장 형식(숫자만/하이픈)으로 후보 생성 — 기존 데이터가 형식이 섞여 있음
function phoneCandidates(input: string): string[] {
  const d = input.replace(/[^0-9]/g, '');
  const set = new Set<string>([input.trim(), d]);
  if (d.length === 11) set.add(`${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`);
  if (d.length === 10) set.add(`${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`);
  return [...set].filter(Boolean);
}

/**
 * 로그인 — 일반/업체 모두 **휴대폰 번호 + 비밀번호**.
 * 예전엔 업체가 `번호@biz.altteul-giftcard` 라는 가짜 이메일을 조회 키로 썼는데,
 * 이메일을 없애기로 하여 (type, 휴대폰)을 키로 사용한다.
 * 같은 번호로 일반+업체 계정을 함께 가질 수 있으므로 반드시 type과 함께 조회한다.
 * (기존 이메일 가입자 호환: identifier에 @가 있으면 이메일로도 조회)
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  // 구버전 클라이언트 호환: email 키로 올 수도 있음
  const identifier = String(body.phone ?? body.email ?? '').trim();
  const { password, loginType } = body;

  if (!identifier) {
    return NextResponse.json({ error: '휴대폰 번호를 입력해주세요.' }, { status: 400 });
  }

  const userType = loginType === 'business' ? 'business' : 'normal';
  const supabase = createServiceClient();

  let user: Record<string, unknown> | null = null;

  if (identifier.includes('@')) {
    // 이메일로 가입했던 기존 회원 호환
    const { data } = await supabase.from('users').select('*').eq('email', identifier).maybeSingle();
    user = data ?? null;
  } else {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('type', userType)
      .in('phone', phoneCandidates(identifier))
      .limit(1);
    user = data?.[0] ?? null;
  }

  if (!user) {
    return NextResponse.json({ error: '등록되지 않은 계정입니다.' }, { status: 401 });
  }

  if (password && user.password_hash) {
    const hashed = hashPassword(password);
    // 기존 평문 비밀번호 호환 + 해싱 비밀번호 둘 다 지원
    if (user.password_hash !== password && user.password_hash !== hashed) {
      return NextResponse.json({ error: '비밀번호가 일치하지 않습니다.' }, { status: 401 });
    }
  }

  if (loginType === 'business' && user.type !== 'business') {
    return NextResponse.json({ error: '업체 회원이 아닙니다. 일반 회원 로그인을 이용해주세요.' }, { status: 403 });
  }
  if (loginType === 'normal' && user.type !== 'normal') {
    return NextResponse.json({ error: '일반 회원이 아닙니다. 업체 로그인을 이용해주세요.' }, { status: 403 });
  }

  const { password_hash, ...safeUser } = user;
  return NextResponse.json({ user: safeUser });
}
