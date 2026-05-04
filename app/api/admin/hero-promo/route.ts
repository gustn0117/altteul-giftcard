import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { verifyAdminSession } from '../route';

/** 관리자: 히어로 홍보 박스 수정 */
export async function PUT(req: NextRequest) {
  const token = req.cookies.get('altteul-giftcard_admin')?.value;
  if (!verifyAdminSession(token)) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }
  const body = await req.json();
  const { eyebrow, headline, sub, cta_text, cta_link, image_url, image_url_mobile } = body;
  // 헤드라인 또는 이미지 둘 중 하나라도 있어야 (이미지만 노출 가능)
  const hasContent = (headline && headline.trim()) || image_url || image_url_mobile;
  if (!hasContent) {
    return NextResponse.json({ error: '헤드라인 또는 이미지 중 하나는 필수입니다.' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('hero_promo')
    .upsert({
      id: 1,
      eyebrow: eyebrow || null,
      headline: (headline || '').trim() || null,
      sub: sub || null,
      cta_text: cta_text || null,
      cta_link: cta_link || null,
      image_url: image_url || null,
      image_url_mobile: image_url_mobile || null,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}

/** 관리자: 현재 값 조회 (편집 폼 초기값) */
export async function GET(req: NextRequest) {
  const token = req.cookies.get('altteul-giftcard_admin')?.value;
  if (!verifyAdminSession(token)) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('hero_promo')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || {});
}
