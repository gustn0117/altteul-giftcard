import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('user_id');
  if (!userId) return NextResponse.json({ error: 'user_id 필요' }, { status: 400 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const unread = data.filter((n: { read_at: string | null }) => !n.read_at).length;
  return NextResponse.json({ items: data, unread });
}

export async function PATCH(req: NextRequest) {
  // 단일 알림 읽음 처리
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 });
  const supabase = createServiceClient();
  const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
