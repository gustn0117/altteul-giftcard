import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// 작성자가 블라인드를 다시 걸어(리셋) 새로 5명이 열람할 수 있게 함
export async function POST(req: NextRequest) {
  try {
    const { post_id, user_id } = await req.json();
    if (!post_id || !user_id) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });

    const supabase = createServiceClient();
    const { data: post, error } = await supabase
      .from('posts')
      .select('id, author_id, deleted_at')
      .eq('id', post_id)
      .single();
    if (error || !post) return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });
    if (post.author_id !== user_id) return NextResponse.json({ error: '작성자만 리셋할 수 있습니다.' }, { status: 403 });

    const now = new Date().toISOString();
    const { error: updErr } = await supabase
      .from('posts')
      .update({ contact_reset_at: now, updated_at: now })
      .eq('id', post_id);
    if (updErr) throw updErr;

    return NextResponse.json({ ok: true, contact_reset_at: now });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : '리셋 실패' }, { status: 500 });
  }
}
