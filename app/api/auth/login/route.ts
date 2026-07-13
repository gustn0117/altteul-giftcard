import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// 휴대폰 번호를 여러 저장 형식(숫자만/하이픈)으로 후보 생성
function phoneCandidates(input: string): string[] {
  const d = input.replace(/[^0-9]/g, '');
  const set = new Set<string>([input.trim(), d]);
  if (d.length === 11) set.add(`${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`);
  if (d.length === 10) set.add(`${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`);
  return [...set].filter(Boolean);
}

export async function POST(req: NextRequest) {
  const { email, password, loginType } = await req.json();

  const identifier = (email || '').trim();
  if (!identifier) {
    return NextResponse.json({ error: '아이디(이메일 또는 휴대폰)를 입력해주세요.' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // 개인 회원은 이메일 또는 휴대폰 번호로 로그인 가능 (@ 없으면 휴대폰으로 조회)
  let user: Record<string, unknown> | null = null;
  if (loginType === 'normal' && !identifier.includes('@')) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('type', 'normal')
      .in('phone', phoneCandidates(identifier))
      .limit(1);
    user = data?.[0] ?? null;
  } else {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('email', identifier)
      .maybeSingle();
    user = data ?? null;
  }

  if (!user) {
    return NextResponse.json({ error: '등록되지 않은 계정입니다.' }, { status: 401 });
  }

  // 비밀번호 검증 (해싱된 비밀번호와 비교)
  if (password && user.password_hash) {
    const hashed = hashPassword(password);
    // 기존 평문 비밀번호 호환 + 해싱 비밀번호 둘 다 지원
    if (user.password_hash !== password && user.password_hash !== hashed) {
      return NextResponse.json({ error: '비밀번호가 일치하지 않습니다.' }, { status: 401 });
    }
  }

  // 유형 검증
  if (loginType === 'business' && user.type !== 'business') {
    return NextResponse.json({ error: '업체 회원이 아닙니다. 일반 회원 로그인을 이용해주세요.' }, { status: 403 });
  }
  if (loginType === 'normal' && user.type !== 'normal') {
    return NextResponse.json({ error: '일반 회원이 아닙니다. 업체 로그인을 이용해주세요.' }, { status: 403 });
  }

  // password_hash 제외하고 반환
  const { password_hash, ...safeUser } = user;
  return NextResponse.json({ user: safeUser });
}
