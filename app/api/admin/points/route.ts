import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { verifyAdminSession } from '../route';

/** 운영자가 사용자 포인트 충전/차감 */
export async function POST(req: NextRequest) {
  const token = req.cookies.get('altteul-giftcard_admin')?.value;
  if (!verifyAdminSession(token)) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }
  const { user_id, delta, reason } = await req.json();
  if (!user_id || typeof delta !== 'number' || delta === 0) {
    return NextResponse.json({ error: 'user_id, delta(0이 아닌 정수) 필요' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: user, error } = await supabase.from('users').select('id, points, name').eq('id', user_id).single();
  if (error || !user) return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });

  const newBalance = (user.points ?? 0) + delta;
  if (newBalance < 0) return NextResponse.json({ error: `잔액 부족 (현재 ${user.points}p, 차감 ${-delta}p)` }, { status: 400 });

  const { error: updErr } = await supabase.from('users').update({ points: newBalance }).eq('id', user_id);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  await supabase.from('point_transactions').insert({
    user_id,
    delta,
    balance_after: newBalance,
    reason: reason || (delta > 0 ? '운영자 충전' : '운영자 차감'),
    admin_id: null, // admin 세션은 비밀번호 기반이라 user_id 없음
  });

  // 충전 알림
  if (delta > 0) {
    await supabase.from('notifications').insert({
      user_id,
      type: 'point_charged',
      title: '포인트가 충전되었습니다',
      body: `${delta.toLocaleString()}p 충전 — 현재 잔액 ${newBalance.toLocaleString()}p`,
      link: '/dashboard',
    });
  }
  return NextResponse.json({ ok: true, balance: newBalance });
}

/** 사용자별 포인트 + 최근 거래 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get('altteul-giftcard_admin')?.value;
  if (!verifyAdminSession(token)) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }
  const supabase = createServiceClient();
  const { data: users } = await supabase
    .from('users')
    .select('id, name, email, type, points, created_at')
    .order('points', { ascending: false })
    .limit(200);
  return NextResponse.json({ users: users ?? [] });
}
