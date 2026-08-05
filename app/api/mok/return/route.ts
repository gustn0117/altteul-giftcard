import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase';
import { loadKeyInfo, decryptMokResult, mokEnv } from '@/lib/mobileok';

// 표준창 → 이용기관 결과 수신 엔드포인트(거래요청 시 returnUrl).
// 표준창이 결과토큰(encryptMOKKeyToken)을 POST → 5초 내 결과요청 API 호출 → 복호화 → 저장.
// 이 페이지는 표준창 팝업 안에서 렌더링됨 → postMessage 로 부모창(회원가입 페이지)에 결과 통보 후 닫힘.
export const dynamic = 'force-dynamic';

function html(payload: Record<string, unknown>): Response {
  const ok = payload.ok === true;
  const body = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>휴대폰 본인확인</title></head>
<body style="font-family:-apple-system,'Apple SD Gothic Neo',sans-serif;text-align:center;padding:48px 20px;color:#333">
<p style="font-size:15px">${ok ? '본인확인이 완료되었습니다.<br/>잠시만 기다려주세요…' : '본인확인이 취소되었거나 실패했습니다.<br/>창을 닫고 다시 시도해주세요.'}</p>
<script>
(function(){
  var data = ${JSON.stringify(payload)};
  try { if (window.opener && !window.opener.closed) window.opener.postMessage(Object.assign({source:'mok'}, data), window.location.origin); } catch(e){}
  setTimeout(function(){ try{ window.close(); }catch(e){} }, ${ok ? 250 : 1500});
})();
</script></body></html>`;
  return new Response(body, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    // Content-Type: application/x-www-form-urlencoded (data=<url-encoded-json>) 또는 text/plain
    let dataStr: string | null = new URLSearchParams(raw).get('data');
    if (!dataStr && raw.trim().startsWith('{')) dataStr = raw;
    if (!dataStr) return html({ ok: false, reason: 'no_data' });

    const data = JSON.parse(dataStr) as { encryptMOKKeyToken?: string; resultCode?: string; resultMsg?: string };
    const token = data.encryptMOKKeyToken;
    if (!token) return html({ ok: false, reason: data.resultMsg || 'no_token' });

    const key = await loadKeyInfo();
    if (!key) return html({ ok: false, reason: 'not_configured' });

    // 5초 TTL 내 검증결과 요청
    const env = mokEnv();
    const resp = await fetch(env.resultRequestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({ encryptMOKKeyToken: token }),
    });
    const result = (await resp.json()) as { resultCode?: string; resultMsg?: string; serviceId?: string; encryptMOKResult?: string };
    if (result.resultCode !== '2000' || !result.encryptMOKResult) {
      return html({ ok: false, reason: result.resultMsg || 'result_fail' });
    }

    // 결과 복호화 + 무결성 검증
    const info = decryptMokResult(result.encryptMOKResult, key.ClientPrivateKey);
    const clientTxId = info.clientTxId;
    if (!clientTxId) return html({ ok: false, reason: 'no_txid' });

    const supabase = createServiceClient();
    // 요청/결과 일치 검증 (내가 발급한 거래ID인지 + 미사용 상태인지)
    const { data: row } = await supabase
      .from('mok_verifications')
      .select('id,status')
      .eq('client_tx_id', clientTxId)
      .maybeSingle();
    if (!row || row.status !== 'requested') return html({ ok: false, reason: 'txid_mismatch' });

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

    return html({ ok: true, claimToken });
  } catch (e) {
    console.error('[mok/return] error:', e);
    return html({ ok: false, reason: 'exception' });
  }
}
