import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// 공개 사이트 설정 조회 (누구나)
export async function GET() {
  const supabase = createServiceClient();
  const { data } = await supabase.from('site_settings').select('key, value');
  const map = Object.fromEntries((data ?? []).map((r: { key: string; value: string | null }) => [r.key, r.value]));
  return NextResponse.json({
    // 기본값 공개(true). 명시적으로 'false'일 때만 비공개.
    buy_contact_public: map.buy_contact_public !== 'false',
  });
}
