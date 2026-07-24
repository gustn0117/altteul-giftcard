import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

/**
 * 방문자 통계 — DB(altteul_giftcard.visitors)에 실제 방문만 영구 집계.
 *
 * 관리자 페이지는 '순수 실제 방문자'만 본다(대표님 요청).
 *  - 실제 방문 = visitors(date, ip) 로 하루 1IP 1회 집계 (KST 기준)
 *  - 예전의 '수치 수정(오프셋)'은 제거 — 관리자 숫자를 부풀리지 않고 있는 그대로 표시
 *  - 공개 홈의 마케팅 카운터(VisitorCounter)는 이 API와 무관한 별도 결정론적 숫자다
 */

// KST(UTC+9) 기준 YYYY-MM-DD
function kstDate(offsetDays = 0): string {
  const t = Date.now() + 9 * 3600 * 1000 - offsetDays * 86400000;
  return new Date(t).toISOString().slice(0, 10);
}

// POST: 방문 기록 (하루 1IP 1회)
export async function POST(req: NextRequest) {
  const ip = (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown').split(',')[0].trim();
  const date = kstDate();
  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from('visitors')
      .upsert({ date, ip, visited_at: new Date().toISOString() }, { onConflict: 'date,ip' });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'fail' }, { status: 500 });
  }
}

// GET: 순수 실제 통계 (오늘 / 누적 / 최근 30일)
export async function GET() {
  try {
    const supabase = createServiceClient();
    const today = kstDate();

    const [{ count: realToday }, { count: realTotal }] = await Promise.all([
      supabase.from('visitors').select('id', { count: 'exact', head: true }).eq('date', today),
      supabase.from('visitors').select('id', { count: 'exact', head: true }),
    ]);

    // 최근 30일 (한 번의 쿼리로 가져와 날짜별 집계)
    const from = kstDate(29);
    const { data: rows } = await supabase.from('visitors').select('date').gte('date', from).lte('date', today);
    const byDate: Record<string, number> = {};
    (rows ?? []).forEach((r: { date: string }) => {
      byDate[r.date] = (byDate[r.date] || 0) + 1;
    });
    const last30 = Array.from({ length: 30 }, (_, i) => {
      const d = kstDate(29 - i);
      return { date: d, count: byDate[d] || 0 };
    });

    return NextResponse.json({
      today: realToday ?? 0,
      total: realTotal ?? 0,
      last30,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'fail' }, { status: 500 });
  }
}
