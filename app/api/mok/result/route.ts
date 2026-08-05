import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// 클라이언트가 팝업에서 받은 claimToken 을 실명/전화번호로 교환(1회성).
// CI/DI 등 민감정보는 서버에만 남기고, 화면 표시에 필요한 이름/전화번호 + verificationId 만 반환.
export const dynamic = 'force-dynamic';

const CLAIM_TTL_MS = 10 * 60 * 1000; // 10분

export async function POST(req: NextRequest) {
  try {
    const { claimToken } = await req.json();
    if (!claimToken || typeof claimToken !== 'string') {
      return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
    }
    const supabase = createServiceClient();
    const { data: row } = await supabase
      .from('mok_verifications')
      .select('id,status,user_name,user_phone,verified_at,claimed_at,consumed_at')
      .eq('claim_token', claimToken)
      .maybeSingle();

    if (!row || row.status !== 'verified' || row.consumed_at) {
      return NextResponse.json({ error: '유효하지 않은 본인확인 정보입니다.' }, { status: 404 });
    }
    if (row.claimed_at) {
      return NextResponse.json({ error: '이미 처리된 본인확인입니다.' }, { status: 410 });
    }
    if (!row.verified_at || Date.now() - new Date(row.verified_at).getTime() > CLAIM_TTL_MS) {
      return NextResponse.json({ error: '본인확인 유효시간이 지났습니다. 다시 시도해주세요.' }, { status: 410 });
    }

    // 1회성 처리: claim_token 소거 + claimed_at 기록 (verificationId 로만 가입 API 에서 최종 소비)
    await supabase
      .from('mok_verifications')
      .update({ claimed_at: new Date().toISOString(), claim_token: null })
      .eq('id', row.id);

    return NextResponse.json({
      verificationId: row.id,
      name: row.user_name,
      phone: row.user_phone,
      verified: true,
    });
  } catch (e) {
    console.error('[mok/result] error:', e);
    return NextResponse.json({ error: '본인확인 결과 처리에 실패했습니다.' }, { status: 500 });
  }
}
