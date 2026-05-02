import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { verifyAdminSession } from '../route';

/** 광고 신청 + 1:1 문의 통합 조회 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get('altteul-giftcard_admin')?.value;
  if (!verifyAdminSession(token)) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }
  const supabase = createServiceClient();
  const [adsRes, contactRes] = await Promise.all([
    supabase.from('ad_inquiries').select('*').order('created_at', { ascending: false }).limit(200),
    supabase.from('contact_inquiries').select('*').order('created_at', { ascending: false }).limit(200),
  ]);
  return NextResponse.json({
    ads: adsRes.data ?? [],
    contacts: contactRes.data ?? [],
  });
}

/** 처리 토글 */
export async function PATCH(req: NextRequest) {
  const token = req.cookies.get('altteul-giftcard_admin')?.value;
  if (!verifyAdminSession(token)) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }
  const { id, type, is_resolved } = await req.json();
  if (!id || !type) return NextResponse.json({ error: 'id, type 필요' }, { status: 400 });
  const table = type === 'ad' ? 'ad_inquiries' : 'contact_inquiries';
  const supabase = createServiceClient();
  const { error } = await supabase.from(table).update({ is_resolved }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** 삭제 */
export async function DELETE(req: NextRequest) {
  const token = req.cookies.get('altteul-giftcard_admin')?.value;
  if (!verifyAdminSession(token)) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }
  const id = req.nextUrl.searchParams.get('id');
  const type = req.nextUrl.searchParams.get('type');
  if (!id || !type) return NextResponse.json({ error: 'id, type 필요' }, { status: 400 });
  const table = type === 'ad' ? 'ad_inquiries' : 'contact_inquiries';
  const supabase = createServiceClient();
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
