import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const KINDS = ['view', 'phone', 'sms'] as const;
type Kind = (typeof KINDS)[number];

// KST 기준 YYYY-MM-DD
function kstDate(offsetDays = 0): string {
  const t = Date.now() + 9 * 3600 * 1000 - offsetDays * 86400000;
  return new Date(t).toISOString().slice(0, 10);
}

// POST: 광고 클릭/조회 1건 기록 (조회=view, 전화=phone, 문자=sms)
export async function POST(req: NextRequest) {
  try {
    const { post_id, kind } = await req.json();
    if (!post_id || !KINDS.includes(kind as Kind)) {
      return NextResponse.json({ error: '잘못된 요청' }, { status: 400 });
    }
    const supabase = createServiceClient();
    // 글 소유자(author_id)를 함께 저장해 업체별 집계를 쉽게 한다
    const { data: post } = await supabase.from('posts').select('author_id').eq('id', post_id).single();
    if (!post) return NextResponse.json({ error: '게시글 없음' }, { status: 404 });

    await supabase.from('ad_events').insert({
      post_id,
      author_id: post.author_id,
      kind,
      day: kstDate(),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'fail' }, { status: 500 });
  }
}

// GET: 특정 업체(user_id)의 접속통계 — 최근 N일 일별 조회수 + 종류별 합계
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('user_id');
    if (!userId) return NextResponse.json({ error: 'user_id 필요' }, { status: 400 });

    const supabase = createServiceClient();
    // 카드 합계는 '누적(전체 기간)', 일별 차트는 최근 30일. 전체를 한 번에 가져와 둘 다 계산.
    const from = kstDate(29);
    const { data: rows, error } = await supabase
      .from('ad_events')
      .select('kind, day, post_id')
      .eq('author_id', userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const events = rows ?? [];
    const totals = { view: 0, phone: 0, sms: 0 };   // 누적
    const viewByDay: Record<string, number> = {};    // 최근 30일 조회
    const byPost: Record<string, { view: number; phone: number; sms: number }> = {};
    for (const e of events) {
      if (e.kind in totals) totals[e.kind as Kind] += 1;
      if (e.kind === 'view' && e.day >= from) viewByDay[e.day] = (viewByDay[e.day] || 0) + 1;
      const pid = (e as { post_id?: string }).post_id;
      if (pid) {
        byPost[pid] = byPost[pid] || { view: 0, phone: 0, sms: 0 };
        if (e.kind in byPost[pid]) byPost[pid][e.kind as Kind] += 1;
      }
    }

    // 글별 내역 (제목·조회수와 함께) — 수치가 어느 광고에서 나왔는지 확인 가능하게
    const { data: myPosts } = await supabase
      .from('posts')
      .select('id, title, type, views, created_at')
      .eq('author_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(200);
    const posts = (myPosts ?? []).map((p: { id: string; title: string; type: string; views: number }) => ({
      id: p.id,
      title: p.title,
      type: p.type,
      views: p.views ?? 0,
      ...(byPost[p.id] || { view: 0, phone: 0, sms: 0 }),
    }));

    // 오래된 → 최신 순 30일 (빈 날은 0)
    const today = kstDate();
    const last30 = Array.from({ length: 30 }, (_, i) => {
      const d = kstDate(29 - i);
      return { date: d, count: viewByDay[d] || 0 };
    });
    void today;

    return NextResponse.json({ totals, last30, posts });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'fail' }, { status: 500 });
  }
}
