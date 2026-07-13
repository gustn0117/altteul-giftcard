import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const REVEAL_COST = 500;   // 연락처 열람 1회 포인트
const MAX_REVEALS = 5;     // 글당(리셋 사이클당) 서로 다른 열람 회원 수

const EPOCH = '1970-01-01T00:00:00Z';

type PostRow = {
  id: string;
  type: 'sell' | 'buy';
  author_id: string | null;
  guest_phone: string | null;
  completed_at: string | null;
  deleted_at: string | null;
  contact_reset_at: string | null;
  author?: { phone: string | null } | null;
};

async function loadPost(supabase: ReturnType<typeof createServiceClient>, postId: string) {
  const { data } = await supabase
    .from('posts')
    .select('id, type, author_id, guest_phone, completed_at, deleted_at, contact_reset_at, author:users!author_id(phone)')
    .eq('id', postId)
    .single();
  return data as PostRow | null;
}

const postPhone = (p: PostRow) => p.guest_phone || p.author?.phone || '';

// 현재 사이클(리셋 이후) 열람 인원 수
async function cycleCount(supabase: ReturnType<typeof createServiceClient>, post: PostRow) {
  const since = post.contact_reset_at || EPOCH;
  const { count } = await supabase
    .from('contact_reveals')
    .select('id', { count: 'exact', head: true })
    .eq('post_id', post.id)
    .gte('created_at', since);
  return count ?? 0;
}

// GET: 현재 회원 기준 열람 상태 (과금 없음)
export async function GET(req: NextRequest) {
  const postId = req.nextUrl.searchParams.get('post_id');
  const userId = req.nextUrl.searchParams.get('user_id');
  if (!postId) return NextResponse.json({ error: 'post_id가 필요합니다.' }, { status: 400 });

  const supabase = createServiceClient();
  const post = await loadPost(supabase, postId);
  if (!post || post.deleted_at) return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });

  const isAuthor = !!userId && post.author_id === userId;
  const count = await cycleCount(supabase, post);

  let revealed = isAuthor;
  if (!revealed && userId) {
    const { data } = await supabase
      .from('contact_reveals')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();
    revealed = !!data;
  }

  return NextResponse.json({
    isAuthor,
    revealed,
    count,
    limit: MAX_REVEALS,
    locked: !revealed && count >= MAX_REVEALS,
    cost: REVEAL_COST,
    phone: revealed ? postPhone(post) : null,
  });
}

// POST: 연락처 열람 (필요 시 500P 차감)
export async function POST(req: NextRequest) {
  try {
    const { post_id, user_id } = await req.json();
    if (!post_id || !user_id) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 400 });

    const supabase = createServiceClient();
    const post = await loadPost(supabase, post_id);
    if (!post || post.deleted_at) return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });
    if (post.completed_at) return NextResponse.json({ error: '거래완료된 글입니다.' }, { status: 400 });

    const phone = postPhone(post);
    if (!phone) return NextResponse.json({ error: '연락처가 등록되지 않았습니다.' }, { status: 400 });

    // 작성자 본인은 무료
    if (post.author_id === user_id) return NextResponse.json({ phone, charged: false });

    // 이미 열람한 회원은 무료 재열람
    const { data: existing } = await supabase
      .from('contact_reveals')
      .select('id')
      .eq('post_id', post_id)
      .eq('user_id', user_id)
      .maybeSingle();
    if (existing) return NextResponse.json({ phone, charged: false });

    // 현재 사이클 5명 마감 확인
    const count = await cycleCount(supabase, post);
    if (count >= MAX_REVEALS) {
      return NextResponse.json({ error: `열람 인원이 마감되었습니다. (${MAX_REVEALS}/${MAX_REVEALS})` }, { status: 409 });
    }

    // 포인트 확인 + 차감
    const { data: u, error: uErr } = await supabase.from('users').select('points').eq('id', user_id).single();
    if (uErr || !u) return NextResponse.json({ error: '사용자 정보를 불러오지 못했습니다.' }, { status: 404 });
    const points = u.points ?? 0;
    if (points < REVEAL_COST) {
      return NextResponse.json({ error: `포인트가 부족합니다. (필요: ${REVEAL_COST}p, 보유: ${points}p)` }, { status: 400 });
    }
    const balance = points - REVEAL_COST;

    const { error: updErr } = await supabase.from('users').update({ points: balance }).eq('id', user_id);
    if (updErr) throw updErr;

    // 열람 기록 (동시요청 중복은 unique 제약으로 방지)
    const { error: revErr } = await supabase.from('contact_reveals').insert({ post_id, user_id });
    if (revErr) {
      // 이미 기록된 경우 → 포인트 원복 후 무료 반환
      await supabase.from('users').update({ points }).eq('id', user_id);
      return NextResponse.json({ phone, charged: false });
    }

    await supabase.from('point_transactions').insert({
      user_id,
      delta: -REVEAL_COST,
      balance_after: balance,
      reason: `연락처 열람 (post:${String(post_id).slice(0, 8)})`,
      admin_id: null,
    });

    return NextResponse.json({ phone, charged: true, balance });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : '열람 실패' }, { status: 500 });
  }
}
