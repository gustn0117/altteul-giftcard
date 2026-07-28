import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { isSmsConfigured } from '@/lib/sms';

// 공개 사이트 설정 조회 (누구나)
export async function GET() {
  const supabase = createServiceClient();
  const { data } = await supabase.from('site_settings').select('key, value');
  const map = Object.fromEntries((data ?? []).map((r: { key: string; value: string | null }) => [r.key, r.value]));
  return NextResponse.json({
    // 기본값 공개(true). 명시적으로 'false'일 때만 비공개.
    buy_contact_public: map.buy_contact_public !== 'false',
    // 문자 인증이 실제로 동작 가능할 때만(=SOLAPI 키 설정됨) 또는 개발환경(테스트 모드 사용 가능)에서만 강제
    phoneVerifyRequired: isSmsConfigured() || process.env.NODE_ENV !== 'production',
    // 하단 사업자 정보 (관리자에서 수정). 비어있으면 프론트에서 기본문구 사용
    footer_info: map.footer_info ?? '',
  });
}
