import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase';
import { loadKeyInfo, encryptReqClientInfo, MOK_SERVICE_TYPE, MOK_USAGE_SIGNUP } from '@/lib/mobileok';
import { SITE_URL } from '@/lib/site';

// 드림시큐리티 표준창 SDK(MOBILEOK.process)가 POST 로 호출 → 응답 Body 가 MOKReqClientInfo JSON 이어야 함.
export const dynamic = 'force-dynamic';

// 리버스 프록시 뒤라 req.nextUrl.origin 이 0.0.0.0 → 공개 도메인 복원 (카카오 콜백과 동일 패턴)
function publicOrigin(req: NextRequest): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  if (host && !/^(0\.0\.0\.0|localhost|127\.|\[?::)/.test(host)) return `${proto}://${host}`;
  return SITE_URL;
}

// requestTime: yyyyMMddHHmmss (KST)
function kstStamp(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const m = Object.fromEntries(parts.map((p) => [p.type, p.value])) as Record<string, string>;
  return `${m.year}${m.month}${m.day}${m.hour}${m.minute}${m.second}`;
}

export async function POST(req: NextRequest) {
  const key = await loadKeyInfo();
  if (!key) return NextResponse.json({ error: '본인확인 서비스가 설정되지 않았습니다.' }, { status: 503 });

  // usageCode: 회원가입(01001) 기본, ?usage= 로 변경 가능(본인확인용 01005 등)
  const usageCode = req.nextUrl.searchParams.get('usage') || MOK_USAGE_SIGNUP;

  // 이용기관 거래 ID: 20~40자, 유일값. 'ALT' + uuid(32) = 35자
  const clientTxId = 'ALT' + crypto.randomUUID().replace(/-/g, '');
  const requestTime = kstStamp();
  const encReqClientInfo = encryptReqClientInfo(key.ServerPublicKey, clientTxId, requestTime);

  // 세션 대용: 거래ID를 DB에 저장(요청/결과 일치·재사용 검증)
  const supabase = createServiceClient();
  const { error } = await supabase
    .from('mok_verifications')
    .insert({ client_tx_id: clientTxId, usage_code: usageCode, status: 'requested' });
  if (error) {
    console.error('[mok/request] insert error:', error);
    return NextResponse.json({ error: '본인확인 요청 생성에 실패했습니다.' }, { status: 500 });
  }

  const returnUrl = `${publicOrigin(req)}/api/mok/return`;
  return NextResponse.json({
    serviceId: key.ServiceId,
    encryptReqClientInfo: encReqClientInfo,
    serviceType: MOK_SERVICE_TYPE,
    usageCode,
    retTransferType: 'MOKToken',
    returnUrl,
    encryptVersion: 'V2',
  });
}
