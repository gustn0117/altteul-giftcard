import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

/** 메인 히어로 홍보 박스 데이터 — 공개 GET (누구나 읽기) */
export async function GET() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('hero_promo')
    .select('eyebrow, headline, sub, cta_text, cta_link, image_url, updated_at')
    .eq('id', 1)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || {});
}
