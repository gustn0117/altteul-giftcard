import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase';

const hashPassword = (p: string) => crypto.createHash('sha256').update(p).digest('hex');

// 회원탈퇴 — 본인 글 소프트삭제 후 회원 하드삭제.
// (users 참조 FK는 전부 SET NULL/CASCADE라 알림·포인트 등은 자동 정리, 글은 작성자만 null)
export async function POST(req: NextRequest) {
  const { userId, password } = await req.json().catch(() => ({}));
  if (!userId) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });

  const supabase = createServiceClient();
  const { data: user } = await supabase
    .from('users')
    .select('id, password_hash, kakao_id')
    .eq('id', userId)
    .maybeSingle();
  if (!user) return NextResponse.json({ error: '회원을 찾을 수 없습니다.' }, { status: 404 });

  // 비밀번호로 가입한 회원은 비밀번호 확인(카카오 전용 계정은 비밀번호가 없으므로 생략)
  if (!user.kakao_id) {
    if (!password) return NextResponse.json({ error: '비밀번호를 입력해주세요.' }, { status: 400 });
    if (user.password_hash !== password && user.password_hash !== hashPassword(password)) {
      return NextResponse.json({ error: '비밀번호가 일치하지 않습니다.' }, { status: 401 });
    }
  }

  const nowIso = new Date().toISOString();
  await supabase.from('posts').update({ deleted_at: nowIso }).eq('author_id', userId).is('deleted_at', null);
  const { error } = await supabase.from('users').delete().eq('id', userId);
  if (error) return NextResponse.json({ error: '탈퇴 처리에 실패했습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
