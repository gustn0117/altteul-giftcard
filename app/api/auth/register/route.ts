import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(req: NextRequest) {
  const { name, email, password, phone, type } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: '필수 항목을 입력해주세요.' }, { status: 400 });
  }

  const userType = type === 'business' ? 'business' : 'normal';

  const supabase = createServiceClient();

  // 이메일 중복 확인
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: '이미 등록된 이메일입니다.' }, { status: 409 });
  }

  const password_hash = hashPassword(password);

  const { data: user, error } = await supabase
    .from('users')
    .insert({ name, email, password_hash, phone: phone || null, type: userType })
    .select('id, name, email, phone, type, created_at, updated_at')
    .single();

  if (error) {
    return NextResponse.json({ error: '회원가입에 실패했습니다.' }, { status: 500 });
  }

  return NextResponse.json({ user }, { status: 201 });
}
