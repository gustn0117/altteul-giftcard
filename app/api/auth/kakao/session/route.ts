import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { verifyBridgeToken } from '@/lib/kakao';

// 브릿지 토큰 검증 → 회원 정보(비밀번호 제외) 반환 → 클라이언트가 로그인 처리
export async function POST(req: NextRequest) {
  const { token } = await req.json().catch(() => ({ token: '' }));
  const userId = verifyBridgeToken(token);
  if (!userId) return NextResponse.json({ error: '유효하지 않거나 만료된 요청입니다.' }, { status: 401 });

  const supabase = createServiceClient();
  const { data: user } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
  if (!user) return NextResponse.json({ error: '회원을 찾을 수 없습니다.' }, { status: 404 });

  const { password_hash, ...safeUser } = user;
  void password_hash;
  return NextResponse.json({ user: safeUser });
}
