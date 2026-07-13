import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { verifyAdminSession } from '../route';

const ALLOWED_KEYS = ['buy_contact_public'];

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
  return NextResponse.json({ buy_contact_public: map.buy_contact_public !== 'false' });
}

// 설정 변경 (관리자)
export async function PATCH(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  const body = await req.json();
  const key = body.key as string;
  if (!ALLOWED_KEYS.includes(key)) return NextResponse.json({ error: '허용되지 않은 설정 키입니다.' }, { status: 400 });
  const value = body.value === true || body.value === 'true' ? 'true' : 'false';

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('site_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, key, value: value === 'true' });
}
