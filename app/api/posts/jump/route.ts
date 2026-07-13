import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const FREE_PER_DAY = 3;
const POINTS_PER_JUMP = 100;

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
    if (post.completed_at) return NextResponse.json({ error: '판매완료된 글은 점프할 수 없습니다.' }, { status: 400 });

    // 오늘 사용한 무료 횟수 확인 (모든 글 합산)
    const sinceDay = new Date(); sinceDay.setHours(0, 0, 0, 0);
    const { count: usedFreeCount, error: cntErr } = await supabase
      .from('jump_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .eq('used_free', true)
      .gte('created_at', sinceDay.toISOString());
    if (cntErr) throw cntErr;

    const freeLeft = FREE_PER_DAY - (usedFreeCount ?? 0);
    let used_free = false;
    let points_used = 0;
    let balance = 0;

    if (freeLeft > 0) {
      // 무료 사용
      used_free = true;
    } else {
      // 포인트 차감
      const { data: u, error: uErr } = await supabase.from('users').select('points').eq('id', user_id).single();
      if (uErr || !u) return NextResponse.json({ error: '사용자 정보를 불러오지 못했습니다.' }, { status: 404 });
      const currentPoints = u.points ?? 0;
      if (currentPoints < POINTS_PER_JUMP) {
        return NextResponse.json({ error: `포인트가 부족합니다. (필요: ${POINTS_PER_JUMP}p, 보유: ${currentPoints}p)` }, { status: 400 });
      }
      balance = currentPoints - POINTS_PER_JUMP;
      points_used = POINTS_PER_JUMP;
      // 포인트 차감 + 거래 기록
      const { error: updErr } = await supabase.from('users').update({ points: balance }).eq('id', user_id);
      if (updErr) throw updErr;
      await supabase.from('point_transactions').insert({
        user_id,
        delta: -POINTS_PER_JUMP,
        balance_after: balance,
        reason: `점프 (post:${post_id.slice(0, 8)})`,
        admin_id: null,
      });
    }

    // jump_logs 기록 + posts.last_jumped_at 갱신
    await supabase.from('jump_logs').insert({ post_id, user_id, used_free, points_used });
    const now = new Date().toISOString();
    await supabase.from('posts').update({ last_jumped_at: now, updated_at: now }).eq('id', post_id);

    if (used_free) {
      const { data: u2 } = await supabase.from('users').select('points').eq('id', user_id).single();
      balance = u2?.points ?? 0;
    }

    return NextResponse.json({
      ok: true,
      used_free,
      points_used,
      balance,
      free_remaining: used_free ? freeLeft - 1 : 0,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : '점프 실패' }, { status: 500 });
  }
}
