import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// 선착순 5명 무료 열람. 5명 마감되면 잠금(작성자 리셋 시 재개). 포인트 차감 없음.
const MAX_REVEALS = 5;     // 글당(리셋 사이클당) 서로 다른 열람 회원 수

const EPOCH = '1970-01-01T00:00:00Z';

type PostRow = {
  id: string;
  type: 'sell' | 'buy';
  author_id: string | null;
  guest_phone: string | null;
  contact_kakao: string | null;
  show_phone: boolean | null;
  show_kakao: boolean | null;
  completed_at: string | null;
  deleted_at: string | null;
  contact_reset_at: string | null;
  author?: { phone: string | null } | null;
};

async function loadPost(supabase: ReturnType<typeof createServiceClient>, postId: string) {
  const { data } = await supabase
    .from('posts')
    .select('id, type, author_id, guest_phone, contact_kakao, show_phone, show_kakao, completed_at, deleted_at, contact_reset_at, author:users!author_id(phone)')
    .eq('id', postId)
    .single();
  return data as PostRow | null;
}

// 공개 설정에 따른 연락처 값
function contacts(p: PostRow) {
  const showPhone = p.show_phone !== false;   // 기본 true
  const showKakao = !!p.show_kakao;
  const phone = showPhone ? (p.guest_phone || p.author?.phone || '') : '';
  const kakao = showKakao ? (p.contact_kakao || '') : '';
  return { showPhone, showKakao, phone, kakao };
}

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

// GET: 현재 회원 기준 열람 상태
export async function GET(req: NextRequest) {
  const postId = req.nextUrl.searchParams.get('post_id');
  const userId = req.nextUrl.searchParams.get('user_id');
  if (!postId) return NextResponse.json({ error: 'post_id가 필요합니다.' }, { status: 400 });

  const supabase = createServiceClient();
  const post = await loadPost(supabase, postId);
  if (!post || post.deleted_at) return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });

  const isAuthor = !!userId && post.author_id === userId;
  const count = await cycleCount(supabase, post);
  const { showPhone, showKakao, phone, kakao } = contacts(post);

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
    cost: 0,
    showPhone,
    showKakao,
    phone: revealed ? phone : null,
    kakao: revealed ? kakao : null,
  });
}

// POST: 연락처 열람 (선착순 5명 무료, 포인트 없음)
export async function POST(req: NextRequest) {
  try {
    const { post_id, user_id } = await req.json();
    if (!post_id || !user_id) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 400 });

    const supabase = createServiceClient();
    const post = await loadPost(supabase, post_id);
    if (!post || post.deleted_at) return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });
    if (post.completed_at) return NextResponse.json({ error: '거래완료된 글입니다.' }, { status: 400 });

    const { phone, kakao } = contacts(post);
    if (!phone && !kakao) return NextResponse.json({ error: '연락처가 등록되지 않았습니다.' }, { status: 400 });

    // 작성자 본인은 무료
    if (post.author_id === user_id) return NextResponse.json({ phone, kakao, charged: false });

    // 이미 열람한 회원은 무료 재열람
    const { data: existing } = await supabase
      .from('contact_reveals')
      .select('id')
      .eq('post_id', post_id)
      .eq('user_id', user_id)
      .maybeSingle();
    if (existing) return NextResponse.json({ phone, kakao, charged: false });

    // 현재 사이클 5명 마감 확인
    const count = await cycleCount(supabase, post);
    if (count >= MAX_REVEALS) {
      return NextResponse.json({ error: `열람 인원이 마감되었습니다. (${MAX_REVEALS}/${MAX_REVEALS})` }, { status: 409 });
    }

    // 열람 기록 (선착순 무료 — 동시요청 중복은 unique 제약으로 방지)
    const { error: revErr } = await supabase.from('contact_reveals').insert({ post_id, user_id });
    if (revErr) {
      // 이미 기록된 경우 → 무료 반환
      return NextResponse.json({ phone, kakao, charged: false });
    }

    return NextResponse.json({ phone, kakao, charged: false });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : '열람 실패' }, { status: 500 });
  }
}
