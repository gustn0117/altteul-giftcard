import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// GET /api/user?id=xxx - 유저 프로필 조회
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id 파라미터가 필요합니다.' }, { status: 400 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, phone, type, created_at, updated_at')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ error: '유저를 찾을 수 없습니다.' }, { status: 404 });
  return NextResponse.json({ user: data });
}

// PATCH /api/user - 유저 프로필 업데이트 (본인만, id 기반)
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, name, phone } = body;

  if (!id) return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select('id, email, name, phone, type, created_at, updated_at')
    .single();

  if (error) return NextResponse.json({ error: '업데이트에 실패했습니다.' }, { status: 500 });
  return NextResponse.json({ user: data });
}
