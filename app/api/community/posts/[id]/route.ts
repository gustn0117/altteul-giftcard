import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// GET /api/community/posts/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();

  // 조회수 +1 (에러 무시)
  try { await supabase.rpc('increment_community_views', { post_id: id }); } catch {}

  const { data, error } = await supabase
    .from('community_posts')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });

  // 댓글도 함께
  const { data: comments } = await supabase
    .from('community_comments')
    .select('*')
    .eq('post_id', id)
    .order('created_at', { ascending: true });

  return NextResponse.json({ post: data, comments: comments || [] });
}

// PATCH /api/community/posts/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.title !== undefined) updates.title = body.title;
  if (body.content !== undefined) updates.content = body.content;
  if (body.category !== undefined) updates.category = body.category;
  if (body.is_pinned !== undefined) updates.is_pinned = !!body.is_pinned;
  if (Array.isArray(body.images)) {
    updates.images = body.images
      .filter((u: unknown): u is string => typeof u === 'string' && u.trim().length > 0)
      .slice(0, 5);
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('community_posts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data });
}

// DELETE /api/community/posts/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { error } = await supabase.from('community_posts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
