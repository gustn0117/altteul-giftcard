import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import crypto from 'crypto';

function hash(s: string): string {
  return crypto.createHash('sha256').update(s).digest('hex');
}

function phoneCandidates(input: string): string[] {
  const d = input.replace(/[^0-9]/g, '');
  const set = new Set<string>([input.trim(), d]);
  if (d.length === 11) set.add(`${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`);
  if (d.length === 10) set.add(`${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`);
  return [...set].filter(Boolean);
}

async function findUser(supabase: ReturnType<typeof createServiceClient>, phone: string, type: string) {
  const userType = type === 'business' ? 'business' : 'normal';
  const { data } = await supabase
    .from('users')
    .select('id, name, security_question, security_answer_hash')
    .eq('type', userType)
    .in('phone', phoneCandidates(phone))
    .limit(1);
  return data?.[0] ?? null;
}

/**
 * 비밀번호 찾기.
 * step 'question' : { phone, type } → 보안질문 반환
 * step 'reset'    : { phone, type, answer, newPassword } → 답변 일치 시 비밀번호 변경
 */
export async function POST(req: NextRequest) {
  try {
    const { step, phone, type, answer, newPassword } = await req.json();
    if (!phone) return NextResponse.json({ error: '휴대폰 번호를 입력해주세요.' }, { status: 400 });

    const supabase = createServiceClient();
    const user = await findUser(supabase, phone, type);
    if (!user) return NextResponse.json({ error: '등록되지 않은 번호입니다.' }, { status: 404 });
    if (!user.security_question || !user.security_answer_hash) {
      return NextResponse.json({ error: '이 계정에는 비밀번호 찾기 질문이 없습니다. 운영자에게 문의해주세요.' }, { status: 400 });
    }

    if (step === 'question') {
      return NextResponse.json({ question: user.security_question });
    }

    if (step === 'reset') {
      if (!answer || !newPassword) return NextResponse.json({ error: '답변과 새 비밀번호를 입력해주세요.' }, { status: 400 });
      if (String(newPassword).length < 6) return NextResponse.json({ error: '새 비밀번호는 6자 이상이어야 합니다.' }, { status: 400 });
      const ok = user.security_answer_hash === hash(String(answer).trim().toLowerCase());
      if (!ok) return NextResponse.json({ error: '답변이 일치하지 않습니다.' }, { status: 401 });

      const { error } = await supabase
        .from('users')
        .update({ password_hash: hash(String(newPassword)), updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: '잘못된 요청' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'fail' }, { status: 500 });
  }
}
