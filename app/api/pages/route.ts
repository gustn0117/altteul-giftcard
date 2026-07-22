import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { verifyAdminSession } from '../admin/route';

/** GET /api/pages 또는 /api/pages?slug=terms — 안내 페이지 내용 조회 (공개) */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');
  const supabase = createServiceClient();
  let query = supabase.from('site_pages').select('slug, title, subtitle, content, updated_at');
  if (slug) query = query.eq('slug', slug);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (slug) return NextResponse.json({ page: data?.[0] ?? null });
  return NextResponse.json({ pages: data ?? [] });
}

/** PUT /api/pages — 내용 저장 (관리자 전용) */
export async function PUT(req: NextRequest) {
  if (!verifyAdminSession(req.cookies.get('altteul-giftcard_admin')?.value)) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }
  try {
    const { slug, title, subtitle, content } = await req.json();
    if (!slug) return NextResponse.json({ error: 'slug 필요' }, { status: 400 });
    const supabase = createServiceClient();
    const { error } = await supabase
      .from('site_pages')
      .update({
        ...(title !== undefined ? { title } : {}),
        ...(subtitle !== undefined ? { subtitle } : {}),
        ...(content !== undefined ? { content } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('slug', slug);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'fail' }, { status: 500 });
  }
}
