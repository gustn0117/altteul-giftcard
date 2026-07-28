import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { verifyAdminSession } from '../route';

const ALLOWED_KEYS = ['buy_contact_public', 'footer_info'];
// 문자(텍스트)로 저장하는 키 (나머지는 true/false 불리언)
const TEXT_KEYS = ['footer_info'];

function requireAdmin(req: NextRequest) {
  const token = req.cookies.get('altteul-giftcard_admin')?.value;
  return verifyAdminSession(token);
}

// 설정 조회 (관리자)
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  const supabase = createServiceClient();
  const { data } = await supabase.from('site_settings').select('key, value');
  const map = Object.fromEntries((data ?? []).map((r: { key: string; value: string | null }) => [r.key, r.value]));
  return NextResponse.json({ buy_contact_public: map.buy_contact_public !== 'false', footer_info: map.footer_info ?? '' });
}

// 설정 변경 (관리자)
export async function PATCH(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  const body = await req.json();
  const key = body.key as string;
  if (!ALLOWED_KEYS.includes(key)) return NextResponse.json({ error: '허용되지 않은 설정 키입니다.' }, { status: 400 });
  const value = TEXT_KEYS.includes(key)
    ? String(body.value ?? '')                                   // 텍스트 키는 원문 그대로 저장
    : (body.value === true || body.value === 'true' ? 'true' : 'false');

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('site_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, key, value: TEXT_KEYS.includes(key) ? value : value === 'true' });
}
