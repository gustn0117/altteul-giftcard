import crypto from 'crypto';

const KAKAO_AUTHORIZE = 'https://kauth.kakao.com/oauth/authorize';
const KAKAO_TOKEN = 'https://kauth.kakao.com/oauth/token';
const KAKAO_ME = 'https://kapi.kakao.com/v2/user/me';

export function kakaoConfig() {
  const restKey = process.env.KAKAO_REST_API_KEY;
  const clientSecret = process.env.KAKAO_CLIENT_SECRET;
  const redirectUri = process.env.KAKAO_REDIRECT_URI;
  return { restKey, clientSecret, redirectUri, configured: !!(restKey && redirectUri) };
}

/** 카카오 인증(로그인) 요청 URL. scope는 KAKAO_SCOPES(예: "account_email,phone_number")가 있을 때만 요청.
 *  scope 미설정 시 기본 로그인(카카오 id + 닉네임)만 받아 검수 전에도 로그인 자체는 동작한다. */
export function kakaoAuthorizeUrl(): string {
  const { restKey, redirectUri } = kakaoConfig();
  const scopes = (process.env.KAKAO_SCOPES || '').trim();
  const params = new URLSearchParams({
    client_id: restKey || '',
    redirect_uri: redirectUri || '',
    response_type: 'code',
  });
  if (scopes) params.set('scope', scopes);
  return `${KAKAO_AUTHORIZE}?${params.toString()}`;
}

export async function kakaoExchangeToken(code: string): Promise<string> {
  const { restKey, clientSecret, redirectUri } = kakaoConfig();
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: restKey || '',
    redirect_uri: redirectUri || '',
    code,
  });
  if (clientSecret) body.set('client_secret', clientSecret);
  const res = await fetch(KAKAO_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body,
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) throw new Error(`카카오 토큰 발급 실패: ${JSON.stringify(data).slice(0, 200)}`);
  return data.access_token as string;
}

export interface KakaoProfile {
  id: string;
  email: string | null;
  phone: string | null;
  nickname: string | null;
}

export async function kakaoGetProfile(accessToken: string): Promise<KakaoProfile> {
  const res = await fetch(KAKAO_ME, { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await res.json();
  if (!res.ok || !data.id) throw new Error(`카카오 프로필 조회 실패: ${JSON.stringify(data).slice(0, 200)}`);
  const acc = data.kakao_account || {};
  // 카카오 전화번호 "+82 10-1234-5678" → 01012345678 로 정규화
  let phone: string | null = acc.phone_number || null;
  if (phone) {
    let d = phone.replace(/[^0-9]/g, '');
    if (d.startsWith('82')) d = '0' + d.slice(2);
    phone = d.length >= 10 ? d : null;
  }
  return {
    id: String(data.id),
    email: acc.email || null,
    phone,
    nickname: acc.profile?.nickname || null,
  };
}

// ── 세션 브릿지 토큰 (서버 콜백 → 클라이언트 로그인 전달용, 5분 만료) ──
const BRIDGE_SECRET = process.env.ADMIN_SECRET || 'altteul-giftcard-admin-secret-change-me';

export function signBridgeToken(userId: string): string {
  const exp = Date.now() + 5 * 60 * 1000;
  const payload = `${userId}.${exp}`;
  const sig = crypto.createHmac('sha256', BRIDGE_SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export function verifyBridgeToken(token: string): string | null {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  const [userId, exp, sig] = parts;
  const expected = crypto.createHmac('sha256', BRIDGE_SECRET).update(`${userId}.${exp}`).digest('hex');
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  if (Number(exp) < Date.now()) return null;
  return userId;
}
