import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { verifyAdminSession } from '../route';

/** 사기 신고 조회 (신고자/대상자 join) */
export async function GET(req: NextRequest) {
  const token = req.cookies.get('altteul-giftcard_admin')?.value;
  if (!verifyAdminSession(token)) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('fraud_reports')
    .select('id, reporter_id, reported_user_id, reason, description, status, created_at, reporter:users!reporter_id(id, name, email), reported:users!reported_user_id(id, name, email)')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

/** 처리 상태 변경 (pending / resolved / dismissed) */
export async function PATCH(req: NextRequest) {
  const token = req.cookies.get('altteul-giftcard_admin')?.value;
  if (!verifyAdminSession(token)) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }
  const { id, status } = await req.json();
  if (!id || !status) return NextResponse.json({ error: 'id, status 필요' }, { status: 400 });
  if (!['pending', 'resolved', 'dismissed'].includes(status)) {
    return NextResponse.json({ error: 'status는 pending/resolved/dismissed' }, { status: 400 });
  }
  const supabase = createServiceClient();
  const { error } = await supabase.from('fraud_reports').update({ status }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get('altteul-giftcard_admin')?.value;
  if (!verifyAdminSession(token)) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 });
  const supabase = createServiceClient();
  const { error } = await supabase.from('fraud_reports').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
