import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const FREE_PER_DAY = 10; // 하루 무료 점프 횟수 (밤 12시 KST 기준 초기화, 포인트 차감 없음)

// KST(UTC+9) 자정의 실제 UTC 시각 → '오늘' 시작점
function kstMidnightISO(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 3600 * 1000);
  kst.setUTCHours(0, 0, 0, 0);
  return new Date(kst.getTime() - 9 * 3600 * 1000).toISOString();
}

export async function POST(req: NextRequest) {
  try {
    const { post_id, user_id } = await req.json();
    if (!post_id || !user_id) return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });

    const supabase = createServiceClient();

    // 글 소유자 확인
    const { data: post, error: postErr } = await supabase
      .from('posts')
      .select('id, author_id, blind_locked, completed_at, deleted_at')
      .eq('id', post_id)
      .single();
    if (postErr || !post) return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });
    if (post.author_id !== user_id) return NextResponse.json({ error: '본인 글만 점프할 수 있습니다.' }, { status: 403 });
    if (post.deleted_at) return NextResponse.json({ error: '삭제된 글입니다.' }, { status: 400 });
    if (post.blind_locked) return NextResponse.json({ error: '운영자 검토 중인 글은 점프할 수 없습니다.' }, { status: 400 });
    if (post.completed_at) return NextResponse.json({ error: '거래완료된 글은 점프할 수 없습니다.' }, { status: 400 });

    // 오늘(KST 자정 이후) 사용한 점프 횟수 확인 (모든 글 합산)
    const since = kstMidnightISO();
    const { count: usedCount, error: cntErr } = await supabase
      .from('jump_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .gte('created_at', since);
    if (cntErr) throw cntErr;

    const used = usedCount ?? 0;
    if (used >= FREE_PER_DAY) {
      return NextResponse.json(
        { error: `오늘 무료 점프 ${FREE_PER_DAY}회를 모두 사용했습니다. 자정(밤 12시) 이후 다시 ${FREE_PER_DAY}회로 초기화됩니다.` },
        { status: 400 },
      );
    }

    // jump_logs 기록 + posts.last_jumped_at 갱신
    await supabase.from('jump_logs').insert({ post_id, user_id, used_free: true, points_used: 0 });
    const now = new Date().toISOString();
    await supabase.from('posts').update({ last_jumped_at: now, updated_at: now }).eq('id', post_id);

    return NextResponse.json({
      ok: true,
      used_free: true,
      free_remaining: FREE_PER_DAY - used - 1,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : '점프 실패' }, { status: 500 });
  }
}
