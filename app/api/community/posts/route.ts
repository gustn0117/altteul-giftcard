import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// GET /api/community/posts?category=news&limit=20
export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get('category');
  const limit = Number(req.nextUrl.searchParams.get('limit')) || 50;

  const supabase = createServiceClient();
  let q = supabase
    .from('community_posts')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (category && ['news', 'tip', 'qna'].includes(category)) {
    q = q.eq('category', category);
  }

  const { data, error } = await q;
  if (error) {
    const missing =
      error.message?.includes('does not exist') ||
      error.message?.includes('Could not find the table') ||
      error.message?.includes('schema cache') ||
      error.code === '42P01' ||
      error.code === 'PGRST205';
    return NextResponse.json({
      error: missing ? '커뮤니티 테이블이 아직 생성되지 않았습니다.' : error.message,
      setup_required: missing,
      migration_hint: missing ? 'Supabase SQL Editor에서 /supabase/migrations/20260418_community.sql 파일을 실행하세요.' : undefined,
    }, { status: missing ? 503 : 500 });
  }

  // 댓글 수 집계 (간단히 개별 카운트)
  if (data && data.length > 0) {
    const ids = data.map((p: { id: string }) => p.id);
    const { data: comments } = await supabase
      .from('community_comments')
      .select('post_id')
      .in('post_id', ids);
    const counts: Record<string, number> = {};
    (comments || []).forEach((c: { post_id: string }) => {
      counts[c.post_id] = (counts[c.post_id] || 0) + 1;
    });
    data.forEach((p: { id: string; comment_count?: number }) => {
      p.comment_count = counts[p.id] || 0;
    });
  }

  return NextResponse.json({ posts: data || [] });
}

// POST /api/community/posts
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { category, title, content, images, author_id, author_name, is_pinned } = body;

  if (!author_id || typeof author_id !== 'string') {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }
  if (!category || !title) {
    return NextResponse.json({ error: '카테고리와 제목은 필수입니다.' }, { status: 400 });
  }
  if (!['news', 'tip', 'qna'].includes(category)) {
    return NextResponse.json({ error: '카테고리가 올바르지 않습니다.' }, { status: 400 });
  }
  if (title.length > 200) {
    return NextResponse.json({ error: '제목은 200자 이내로 입력해주세요.' }, { status: 400 });
  }

  const cleanImages = Array.isArray(images)
    ? images.filter((u: unknown): u is string => typeof u === 'string' && u.trim().length > 0).slice(0, 5)
    : [];

  const supabase = createServiceClient();

  const { data: authorRow, error: authorErr } = await supabase
    .from('users')
    .select('id, name')
    .eq('id', author_id)
    .maybeSingle();
  if (authorErr || !authorRow) {
    return NextResponse.json({ error: '유효하지 않은 계정입니다. 다시 로그인해주세요.' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('community_posts')
    .insert({
      category,
      title,
      content: content || null,
      images: cleanImages,
      author_id: authorRow.id,
      author_name: (typeof author_name === 'string' && author_name.trim()) || authorRow.name,
      is_pinned: !!is_pinned,
    })
    .select()
    .single();

  if (error) {
    const missing =
      error.message?.includes('does not exist') ||
      error.message?.includes('Could not find the table') ||
      error.message?.includes('schema cache') ||
      error.code === '42P01' ||
      error.code === 'PGRST205';
    return NextResponse.json({
      error: missing ? '커뮤니티 테이블이 아직 생성되지 않았습니다. 관리자에게 문의하세요.' : error.message,
      setup_required: missing,
    }, { status: missing ? 503 : 500 });
  }
  return NextResponse.json({ post: data }, { status: 201 });
}
