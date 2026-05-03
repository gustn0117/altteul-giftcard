import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { verifyAdminSession } from '../../admin/route';

const BANNER_DURATION_DAYS = 30;

/** 모든 배너 조회 (운영자) */
export async function GET(req: NextRequest) {
  const token = req.cookies.get('altteul-giftcard_admin')?.value;
  if (!verifyAdminSession(token)) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('main_banners')
    .select('*')
    .order('position', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

/** 배너 신규 등록 */
export async function POST(req: NextRequest) {
  const token = req.cookies.get('altteul-giftcard_admin')?.value;
  if (!verifyAdminSession(token)) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }
  const body = await req.json();
  const { position, title, subtitle, image_url, link_url, business_id, bg_color, duration_days } = body;
  if (!position || position < 1 || position > 4) return NextResponse.json({ error: 'position(1~4) 필요' }, { status: 400 });
  if (!title) return NextResponse.json({ error: 'title 필요' }, { status: 400 });

  const supabase = createServiceClient();
  // 같은 position의 기존 활성 배너는 비활성화
  await supabase.from('main_banners').update({ is_active: false }).eq('position', position).eq('is_active', true);

  const days = Number(duration_days) > 0 ? Number(duration_days) : BANNER_DURATION_DAYS;
  const expiresAt = new Date(Date.now() + days * 86400000).toISOString();

  const { data, error } = await supabase.from('main_banners').insert({
    position,
    title,
    subtitle: subtitle || null,
    image_url: image_url || null,
    link_url: link_url || null,
    business_id: business_id || null,
    bg_color: bg_color || '#1E40AF',
    expires_at: expiresAt,
    is_active: true,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, banner: data });
}
