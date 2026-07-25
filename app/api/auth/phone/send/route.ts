import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase';
import { sendVerificationSms } from '@/lib/sms';

const normalize = (p: string) => String(p || '').replace(/[^0-9]/g, '');
const hashCode = (code: string, phone: string) =>
  crypto.createHash('sha256').update(`${code}:${phone}`).digest('hex');

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    const digits = normalize(phone);
    if (digits.length < 10 || digits.length > 11) {
      return NextResponse.json({ error: '휴대폰 번호를 정확히 입력해주세요.' }, { status: 400 });
    }
    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;
    const supabase = createServiceClient();

    // 레이트리밋: 최근 1시간 발급 수, 최근 30초 쿨다운
    const hourAgo = new Date(Date.now() - 3600_000).toISOString();
    const { data: recent } = await supabase
      .from('phone_verifications')
      .select('created_at')
      .eq('phone', digits)
      .gte('created_at', hourAgo)
      .order('created_at', { ascending: false });
    if ((recent?.length ?? 0) >= 5) {
      return NextResponse.json({ error: '인증 요청이 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 });
    }
    if (recent?.[0] && Date.now() - new Date(recent[0].created_at).getTime() < 30_000) {
      return NextResponse.json({ error: '30초 후에 다시 요청해주세요.' }, { status: 429 });
    }

    const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
    const expires_at = new Date(Date.now() + 180_000).toISOString();

    // 발송 성공 후에만 인증 row를 기록 — 발송 실패 시 한도/쿨다운을 소모하지 않는다
    const result = await sendVerificationSms(digits, code);

    const { error } = await supabase.from('phone_verifications').insert({
      phone: digits, code_hash: hashCode(code, digits), expires_at, attempts: 0, ip,
    });
    if (error) {
      console.error('[phone/send] insert error:', error);
      return NextResponse.json({ error: '인증번호 발송에 실패했습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 });
    }

    const body: Record<string, unknown> = { ok: true, cooldown: 30 };
    if (result.test && process.env.NODE_ENV !== 'production') body.devCode = code;
    return NextResponse.json(body);
  } catch (err) {
    console.error('[phone/send] error:', err);
    return NextResponse.json({ error: '인증번호 발송에 실패했습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 });
  }
}
