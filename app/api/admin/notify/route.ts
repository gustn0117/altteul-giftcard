import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { verifyAdminSession } from '../route';

/** 운영자가 알림 발송 (전체 / 개인 / 업체 / 특정 사용자) */
export async function POST(req: NextRequest) {
  const token = req.cookies.get('altteul-giftcard_admin')?.value;
  if (!verifyAdminSession(token)) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }
  const { target, user_id, title, body, link } = await req.json();
  if (!title) return NextResponse.json({ error: '제목(title)이 필요합니다.' }, { status: 400 });

  const supabase = createServiceClient();

  // 대상 사용자 ID 목록 결정
  let targetIds: string[] = [];
  if (target === 'all') {
    const { data, error } = await supabase.from('users').select('id');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    targetIds = (data ?? []).map((u: { id: string }) => u.id);
  } else if (target === 'normal' || target === 'business') {
    const { data, error } = await supabase.from('users').select('id').eq('type', target);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    targetIds = (data ?? []).map((u: { id: string }) => u.id);
  } else if (target === 'one') {
    if (!user_id) return NextResponse.json({ error: 'target=one 시 user_id 필요' }, { status: 400 });
    targetIds = [user_id];
  } else {
    return NextResponse.json({ error: 'target은 all/normal/business/one' }, { status: 400 });
  }

  if (targetIds.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, info: '대상 사용자 없음' });
  }

  // 일괄 insert (chunk 1000개씩)
  const rows = targetIds.map((uid) => ({
    user_id: uid,
    type: 'announcement',
    title,
    body: body || null,
    link: link || null,
  }));
  const CHUNK = 1000;
  let sent = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await supabase.from('notifications').insert(chunk);
    if (error) return NextResponse.json({ error: error.message, sent }, { status: 500 });
    sent += chunk.length;
  }
  return NextResponse.json({ ok: true, sent });
}
