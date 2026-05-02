import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { verifyAdminSession } from '../route';

/** 회원별 연락처 열람 권한 조회 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get('altteul-giftcard_admin')?.value;
  if (!verifyAdminSession(token)) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, type, phone, points, contact_view_until, created_at')
    .order('contact_view_until', { ascending: false, nullsFirst: false })
    .limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const now = Date.now();
  const enriched = (data ?? []).map((u) => ({
    ...u,
    is_active: !!u.contact_view_until && new Date(u.contact_view_until).getTime() > now,
  }));
  return NextResponse.json({ users: enriched });
}

/** 권한 부여 (시간 단위) */
export async function POST(req: NextRequest) {
  const token = req.cookies.get('altteul-giftcard_admin')?.value;
  if (!verifyAdminSession(token)) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }
  const { user_id, hours, reason, mode } = await req.json();
  if (!user_id) return NextResponse.json({ error: 'user_id 필요' }, { status: 400 });
  if (typeof hours !== 'number' || hours <= 0) {
    return NextResponse.json({ error: 'hours는 양수' }, { status: 400 });
  }

  const supabase = createServiceClient();
  // 현재 권한 시각 조회 (mode='extend'면 현재 만료에 더해줌, 'replace'면 now+hours)
  const { data: u, error: getErr } = await supabase
    .from('users')
    .select('id, name, contact_view_until')
    .eq('id', user_id)
    .single();
  if (getErr || !u) return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });

  const now = new Date();
  let baseTime: Date;
  if (mode === 'extend' && u.contact_view_until && new Date(u.contact_view_until).getTime() > now.getTime()) {
    baseTime = new Date(u.contact_view_until);
  } else {
    baseTime = now;
  }
  const newUntil = new Date(baseTime.getTime() + hours * 3600 * 1000).toISOString();

  const { error: updErr } = await supabase
    .from('users')
    .update({ contact_view_until: newUntil, updated_at: now.toISOString() })
    .eq('id', user_id);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  // 부여 이력 기록
  await supabase.from('contact_view_grants').insert({
    user_id,
    hours,
    granted_until: newUntil,
    reason: reason || null,
  });

  // 회원에게 알림
  await supabase.from('notifications').insert({
    user_id,
    type: 'point_charged',
    title: '연락처 열람 권한이 활성되었습니다',
    body: `${hours}시간 동안 팝니다 글의 연락처를 열람할 수 있습니다. 만료: ${new Date(newUntil).toLocaleString('ko-KR')}`,
    link: '/board?tab=sell',
  });

  return NextResponse.json({ ok: true, contact_view_until: newUntil });
}

/** 권한 즉시 회수 */
export async function DELETE(req: NextRequest) {
  const token = req.cookies.get('altteul-giftcard_admin')?.value;
  if (!verifyAdminSession(token)) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }
  const user_id = req.nextUrl.searchParams.get('user_id');
  if (!user_id) return NextResponse.json({ error: 'user_id 필요' }, { status: 400 });

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('users')
    .update({ contact_view_until: null, updated_at: new Date().toISOString() })
    .eq('id', user_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
