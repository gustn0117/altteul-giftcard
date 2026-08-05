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
  const { name, password, phone, type, representative, messenger, messengerId, securityQuestion, securityAnswer, mokVerificationId } = await req.json();

  const userType = type === 'business' ? 'business' : 'normal';
  const supabase = createServiceClient();

  // ── 드림시큐리티 본인확인을 거친 가입: 이름/전화번호는 인증 결과를 신뢰(폼 값 무시) ──
  let verified: { name: string; phone: string; ci: string | null } | null = null;
  if (mokVerificationId) {
    const { data: mv } = await supabase
      .from('mok_verifications')
      .select('id,status,user_name,user_phone,ci,verified_at,consumed_at')
      .eq('id', mokVerificationId)
      .maybeSingle();
    if (!mv || mv.status !== 'verified' || mv.consumed_at) {
      return NextResponse.json({ error: '본인확인 정보가 유효하지 않습니다. 다시 본인확인을 진행해주세요.' }, { status: 400 });
    }
    if (!mv.verified_at || Date.now() - new Date(mv.verified_at).getTime() > 30 * 60 * 1000) {
      return NextResponse.json({ error: '본인확인 유효시간이 지났습니다. 다시 본인확인을 진행해주세요.' }, { status: 410 });
    }
    // CI 기반 중복가입 방지(같은 유형 안에서)
    if (mv.ci) {
      const { data: dupCi } = await supabase
        .from('users').select('id').eq('type', userType).eq('ci', mv.ci).limit(1);
      if (dupCi && dupCi.length > 0) {
        return NextResponse.json({ error: '이미 본인확인으로 가입된 계정이 있습니다. 로그인 또는 비밀번호 찾기를 이용해주세요.' }, { status: 409 });
      }
    }
    verified = { name: mv.user_name || name, phone: mv.user_phone || phone, ci: mv.ci };
  }

  // 계정 이름(name)은 게시글 표시용 — 개인=닉네임(폼), 업체=사업체명(폼). 실명은 real_name 에 숨김 저장.
  const effName = name;
  const effPhone = verified?.phone ?? phone;

  if (!effName || !password || !effPhone) {
    return NextResponse.json({ error: '필수 항목(이름/휴대폰/비밀번호)을 입력해주세요.' }, { status: 400 });
  }

  const digits = String(effPhone).replace(/[^0-9]/g, '');
  if (digits.length < 10 || digits.length > 11) {
    return NextResponse.json({ error: '휴대폰 번호를 정확히 입력해주세요.' }, { status: 400 });
  }

  // 같은 유형 안에서만 번호 중복 확인 (같은 번호로 일반+업체 계정은 허용)
  const { data: dupPhone } = await supabase
    .from('users')
    .select('id')
    .eq('type', userType)
    .in('phone', phoneCandidates(String(effPhone)))
    .limit(1);
  if (dupPhone && dupPhone.length > 0) {
    return NextResponse.json({ error: '이미 가입된 휴대폰 번호입니다.' }, { status: 409 });
  }

  const password_hash = hashPassword(password);

  // 번호는 숫자만으로 통일 저장
  const insertData: Record<string, unknown> = { name: effName, password_hash, phone: digits, type: userType };
  if (userType === 'business') {
    // 대표자명은 본인확인 실명을 신뢰(있으면), 없으면 폼 값
    insertData.representative = (verified?.name ?? representative) || null;
    insertData.messenger = messenger || null;
    insertData.messenger_id = messengerId || null;
  }
  // 비밀번호 찾기용 보안질문 (답변은 정규화 후 해시 저장)
  if (securityQuestion && securityAnswer) {
    insertData.security_question = securityQuestion;
    insertData.security_answer_hash = hashPassword(String(securityAnswer).trim().toLowerCase());
  }
  // 본인확인 완료 가입: 실명(숨김)·인증 상태·CI 저장
  if (verified) {
    insertData.real_name = verified.name; // 게시글엔 안 뜸(실명 기록용)
    insertData.phone_verified = true;
    insertData.phone_verified_at = new Date().toISOString();
    insertData.identity_verified = true;
    insertData.identity_verified_at = new Date().toISOString();
    if (verified.ci) insertData.ci = verified.ci;
  }

  const { data: user, error } = await supabase
    .from('users')
    .insert(insertData)
    .select('id, name, phone, type, created_at, updated_at, phone_verified, phone_verified_at, identity_verified, identity_verified_at')
    .single();

  if (error) {
    // 고유 인덱스(users_type_phone_uniq) 위반 등
    if (error.code === '23505') {
      return NextResponse.json({ error: '이미 가입된 휴대폰 번호입니다.' }, { status: 409 });
    }
    return NextResponse.json({ error: '회원가입에 실패했습니다.' }, { status: 500 });
  }

  // 본인확인 1회성 소비 처리(재사용 방지)
  if (verified && mokVerificationId) {
    await supabase
      .from('mok_verifications')
      .update({ status: 'consumed', consumed_at: new Date().toISOString() })
      .eq('id', mokVerificationId);
  }

  return NextResponse.json({ user }, { status: 201 });
}
