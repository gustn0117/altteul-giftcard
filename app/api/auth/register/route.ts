import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function phoneCandidates(input: string): string[] {
  const d = input.replace(/[^0-9]/g, '');
  const set = new Set<string>([input.trim(), d]);
  if (d.length === 11) set.add(`${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`);
  if (d.length === 10) set.add(`${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`);
  return [...set].filter(Boolean);
}

/**
 * 회원가입 — 이메일 없이 **휴대폰 번호**가 아이디.
 * 예전엔 업체 가입 시 `번호@biz.altteul-giftcard` 가짜 이메일을 만들어 저장했고
 * 그게 내정보 화면에 그대로 노출됐다. 이제 email 은 저장하지 않는다(컬럼은 기존 회원용으로 남음).
 */
export async function POST(req: NextRequest) {
  const { name, password, phone, type, representative, messenger, messengerId, securityQuestion, securityAnswer } = await req.json();

  if (!name || !password || !phone) {
    return NextResponse.json({ error: '필수 항목(이름/휴대폰/비밀번호)을 입력해주세요.' }, { status: 400 });
  }

  const userType = type === 'business' ? 'business' : 'normal';
  const digits = String(phone).replace(/[^0-9]/g, '');
  if (digits.length < 10 || digits.length > 11) {
    return NextResponse.json({ error: '휴대폰 번호를 정확히 입력해주세요.' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // 같은 유형 안에서만 번호 중복 확인 (같은 번호로 일반+업체 계정은 허용)
  const { data: dupPhone } = await supabase
    .from('users')
    .select('id')
    .eq('type', userType)
    .in('phone', phoneCandidates(String(phone)))
    .limit(1);
  if (dupPhone && dupPhone.length > 0) {
    return NextResponse.json({ error: '이미 가입된 휴대폰 번호입니다.' }, { status: 409 });
  }

  const password_hash = hashPassword(password);

  // 번호는 숫자만으로 통일 저장
  const insertData: Record<string, unknown> = { name, password_hash, phone: digits, type: userType };
  if (userType === 'business') {
    insertData.representative = representative || null;
    insertData.messenger = messenger || null;
    insertData.messenger_id = messengerId || null;
  }
  // 비밀번호 찾기용 보안질문 (답변은 정규화 후 해시 저장)
  if (securityQuestion && securityAnswer) {
    insertData.security_question = securityQuestion;
    insertData.security_answer_hash = hashPassword(String(securityAnswer).trim().toLowerCase());
  }

  const { data: user, error } = await supabase
    .from('users')
    .insert(insertData)
    .select('id, name, phone, type, created_at, updated_at')
    .single();

  if (error) {
    // 고유 인덱스(users_type_phone_uniq) 위반 등
    if (error.code === '23505') {
      return NextResponse.json({ error: '이미 가입된 휴대폰 번호입니다.' }, { status: 409 });
    }
    return NextResponse.json({ error: '회원가입에 실패했습니다.' }, { status: 500 });
  }

  return NextResponse.json({ user }, { status: 201 });
}
