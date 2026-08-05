import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase';
import { loadKeyInfo, decryptMokResult, mokEnv } from '@/lib/mobileok';

// 표준창 → 이용기관 결과 수신 엔드포인트(거래요청 시 returnUrl).
// 표준창 SDK(client_process.js)가 부모창에서 이 URL 로 XHR(application/x-www-form-urlencoded, data=<result json>) POST 하고,
// 응답 Body 를 그대로 callbackFunction 으로 전달한다 → 여기서는 JSON({ok, claimToken}) 반환.
// (팝업/HTML 이 아님. 항상 200 으로 JSON 반환해야 콜백이 body 를 받는다.)
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    // Content-Type: application/x-www-form-urlencoded, body = "data=<이중 URL 인코딩된 JSON>"
    // 표준창은 data 를 이중 인코딩해 보낸다(%257B...) → JSON({) 이 될 때까지 decodeURIComponent 반복.
    const idx = raw.indexOf('data=');
    let dataStr: string | null = idx >= 0 ? raw.slice(idx + 5).split('&')[0] : (raw.trim().startsWith('{') ? raw : null);
    if (!dataStr) return NextResponse.json({ ok: false, reason: 'no_data' });
    for (let i = 0; i < 3 && !dataStr.trim().startsWith('{'); i++) {
      try { dataStr = decodeURIComponent(dataStr); } catch { break; }
    }

    const data = JSON.parse(dataStr) as { encryptMOKKeyToken?: string; resultCode?: string; resultMsg?: string };
    const token = data.encryptMOKKeyToken;
    if (!token) return NextResponse.json({ ok: false, reason: data.resultMsg || 'no_token' });

    const key = await loadKeyInfo();
    if (!key) return NextResponse.json({ ok: false, reason: 'not_configured' });

    // 5초 TTL 내 검증결과 요청
    const env = mokEnv();
    const resp = await fetch(env.resultRequestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({ encryptMOKKeyToken: token }),
    });
    const result = (await resp.json()) as { resultCode?: string; resultMsg?: string; serviceId?: string; encryptMOKResult?: string };
    if (result.resultCode !== '2000' || !result.encryptMOKResult) {
      return NextResponse.json({ ok: false, reason: result.resultMsg || 'result_fail' });
    }

    // 결과 복호화 + 무결성 검증
    const info = decryptMokResult(result.encryptMOKResult, key.ClientPrivateKey);
    const clientTxId = info.clientTxId;
    if (!clientTxId) return NextResponse.json({ ok: false, reason: 'no_txid' });

    const supabase = createServiceClient();
    // 요청/결과 일치 검증 (내가 발급한 거래ID인지 + 미사용 상태인지)
    const { data: row } = await supabase
      .from('mok_verifications')
      .select('id,status')
      .eq('client_tx_id', clientTxId)
      .maybeSingle();
    if (!row || row.status !== 'requested') return NextResponse.json({ ok: false, reason: 'txid_mismatch' });

    const claimToken = crypto.randomBytes(24).toString('hex');
    const userPhone = info.userPhone ? String(info.userPhone).replace(/[^0-9]/g, '') : null;
    await supabase
      .from('mok_verifications')
      .update({
        status: 'verified',
        tx_id: info.txId ?? null,
        ci: info.ci ?? null,
        di: info.di ?? null,
        user_name: info.userName ?? null,
        user_phone: userPhone,
        user_birthday: info.userBirthday ?? null,
        user_gender: info.userGender ?? null,
        user_nation: info.userNation ?? null,
        provider_id: info.providerId ?? null,
        result_code: result.resultCode,
        result_msg: result.resultMsg ?? null,
        claim_token: claimToken,
        verified_at: new Date().toISOString(),
      })
      .eq('id', row.id);

    return NextResponse.json({ ok: true, claimToken });
  } catch (e) {
    console.error('[mok/return] error:', e);
    return NextResponse.json({ ok: false, reason: 'exception' });
  }
}
