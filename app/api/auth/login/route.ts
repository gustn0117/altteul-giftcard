import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(req: NextRequest) {
  const { email, password, loginType } = await req.json();

  if (!email) {
    return NextResponse.json({ error: '이메일을 입력해주세요.' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error || !user) {
    return NextResponse.json({ error: '등록되지 않은 이메일입니다.' }, { status: 401 });
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
