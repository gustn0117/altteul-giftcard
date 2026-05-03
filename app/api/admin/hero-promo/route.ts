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
  const { eyebrow, headline, sub, cta_text, cta_link, image_url } = body;
  if (!headline || !headline.trim()) {
    return NextResponse.json({ error: '헤드라인은 필수입니다.' }, { status: 400 });
  }

  const supabase = createServiceClient();
  // upsert (id=1 단일 행)
  const { data, error } = await supabase
    .from('hero_promo')
    .upsert({
      id: 1,
      eyebrow: eyebrow || null,
      headline: headline.trim(),
      sub: sub || null,
      cta_text: cta_text || null,
      cta_link: cta_link || null,
      image_url: image_url || null,
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
