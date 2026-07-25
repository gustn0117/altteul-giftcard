import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase';

const normalize = (p: string) => String(p || '').replace(/[^0-9]/g, '');
const hashCode = (code: string, phone: string) =>
  crypto.createHash('sha256').update(`${code}:${phone}`).digest('hex');

export async function POST(req: NextRequest) {
  try {
    const { phone, code, userId } = await req.json();
    const digits = normalize(phone);
    const codeStr = String(code || '').trim();
    if (digits.length < 10 || !/^\d{6}$/.test(codeStr)) {
      return NextResponse.json({ error: '인증번호를 정확히 입력해주세요.' }, { status: 400 });
    }
    const supabase = createServiceClient();

    // 해당 번호의 가장 최근 미소진 인증행
    const { data: rows } = await supabase
      .from('phone_verifications')
      .select('id, code_hash, expires_at, attempts, verified_at, consumed_at')
      .eq('phone', digits)
      .is('consumed_at', null)
      .order('created_at', { ascending: false })
      .limit(1);
    const v = rows?.[0];
    if (!v) return NextResponse.json({ error: '인증번호를 먼저 받아주세요.' }, { status: 404 });
    if (new Date(v.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: '인증번호가 만료됐습니다. 다시 받아주세요.' }, { status: 410 });
    }
    if (v.attempts >= 5) {
      return NextResponse.json({ error: '시도 횟수를 초과했습니다. 다시 받아주세요.' }, { status: 423 });
    }
    if (v.code_hash !== hashCode(codeStr, digits)) {
      await supabase.from('phone_verifications').update({ attempts: v.attempts + 1 }).eq('id', v.id);
      return NextResponse.json({ error: '인증번호가 일치하지 않습니다.' }, { status: 401 });
    }

    await supabase.from('phone_verifications').update({ verified_at: new Date().toISOString() }).eq('id', v.id);

    // 회원 본인 번호면 계정에 인증 완료 저장
    if (userId) {
      const { data: u } = await supabase.from('users').select('id, phone').eq('id', userId).maybeSingle();
      if (u && normalize(u.phone || '') === digits) {
        await supabase.from('users')
          .update({ phone_verified: true, phone_verified_at: new Date().toISOString() })
          .eq('id', userId);
      }
    }
    return NextResponse.json({ ok: true, verificationId: v.id });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'fail' }, { status: 500 });
  }
}
