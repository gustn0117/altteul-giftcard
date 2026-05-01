import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '1234';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'altteul-giftcard-admin-secret-change-me';
const COOKIE_NAME = 'altteul-giftcard_admin';
const SESSION_DURATION = 60 * 60 * 12; // 12시간

function sign(payload: string): string {
  return crypto.createHmac('sha256', ADMIN_SECRET).update(payload).digest('hex');
}

function createSessionToken(): string {
  const issued = Date.now().toString();
  const sig = sign(issued);
  return `${issued}.${sig}`;
}

export function verifyAdminSession(token: string | undefined): boolean {
  if (!token) return false;
  const [issued, sig] = token.split('.');
  if (!issued || !sig) return false;
  const age = (Date.now() - Number(issued)) / 1000;
  if (age > SESSION_DURATION || age < 0) return false;
  return sign(issued) === sig;
}

// 로그인
export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ ok: false, error: '비밀번호가 틀렸습니다.' }, { status: 401 });
  }
  const token = createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION,
  });
  return res;
}

// 세션 확인
export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  return NextResponse.json({ ok: verifyAdminSession(token) });
}

// 로그아웃
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
