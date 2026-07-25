import crypto from 'crypto';

const SOLAPI_URL = 'https://api.solapi.com/messages/v4/send';

function creds() {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const from = process.env.SOLAPI_SENDER;
  return apiKey && apiSecret && from ? { apiKey, apiSecret, from } : null;
}

/**
 * SOLAPI HMAC-SHA256 인증 헤더.
 * 공식 solapi-nodejs SDK(src/lib/authenticator.ts)와 동일한 서명 방식으로 확인됨:
 * signature = HMAC-SHA256(key=apiSecret, data=date+salt) → hex.
 */
function authHeader(apiKey: string, apiSecret: string): string {
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(32).toString('hex');
  const signature = crypto.createHmac('sha256', apiSecret).update(date + salt).digest('hex');
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

export async function sendVerificationSms(phone: string, code: string): Promise<{ sent: boolean; test: boolean }> {
  const text = `[예판상품권] 인증번호 ${code} (3분 내 입력)`;
  const c = creds();
  if (!c) {
    // 테스트 모드 — 키 없으면 실제 발송 대신 서버 로그
    console.log(`[SMS TEST] to=${phone} code=${code}`);
    return { sent: true, test: true };
  }
  const res = await fetch(SOLAPI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: authHeader(c.apiKey, c.apiSecret) },
    body: JSON.stringify({ message: { to: phone, from: c.from, text } }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`SMS 발송 실패(${res.status}) ${body.slice(0, 200)}`);
  }
  return { sent: true, test: false };
}
