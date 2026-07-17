import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { verifyAdminSession } from '../admin/route';

/**
 * 방문자 통계 — DB(altteul_giftcard.visitors) 영구 저장.
 *
 * 과거 구조의 문제로 수치가 안 늘어났음:
 *  1) data/visitors.json 로컬 파일에 저장 → Docker 볼륨이 없어 재배포마다 초기화됨
 *  2) 관리자 '수치 수정'이 _override 로 저장돼 GET을 영구히 가로챔(해제 수단 없음)
 *     → 실제 방문이 아무리 쌓여도 화면은 고정값만 표시
 *
 * 현재 구조:
 *  - 실제 방문은 visitors(date, ip) 로 하루 1IP 1회 집계 (DB 영구 저장)
 *  - '수치 수정'은 고정값이 아니라 **시작값(오프셋)** 으로 저장 → 표시값 = 실제 + 오프셋
 *    이므로 관리자가 숫자를 맞춰놔도 이후 실제 방문만큼 계속 증가한다.
 *  - 날짜는 KST 기준 (UTC로 하면 한국시간 오전 9시에 '오늘'이 바뀜)
 */

// KST(UTC+9) 기준 YYYY-MM-DD
function kstDate(offsetDays = 0): string {
  const t = Date.now() + 9 * 3600 * 1000 - offsetDays * 86400000;
  return new Date(t).toISOString().slice(0, 10);
}

type Settings = Record<string, string | null>;

async function getSettings(supabase: ReturnType<typeof createServiceClient>): Promise<Settings> {
  const { data } = await supabase.from('site_settings').select('key, value');
  return Object.fromEntries((data ?? []).map((r: { key: string; value: string | null }) => [r.key, r.value]));
}

const num = (v: string | null | undefined) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

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

// GET: 통계 조회 (표시값 = 실제 집계 + 관리자 오프셋)
export async function GET() {
  try {
    const supabase = createServiceClient();
    const today = kstDate();

    const [{ count: realToday }, { count: realTotal }, settings] = await Promise.all([
      supabase.from('visitors').select('id', { count: 'exact', head: true }).eq('date', today),
      supabase.from('visitors').select('id', { count: 'exact', head: true }),
      getSettings(supabase),
    ]);

    // 최근 30일 (한 번의 쿼리로 가져와 집계 — 과거엔 30번 반복 조회했음)
    const from = kstDate(29);
    const { data: rows } = await supabase.from('visitors').select('date').gte('date', from).lte('date', today);
    const byDate: Record<string, number> = {};
    (rows ?? []).forEach((r: { date: string }) => {
      byDate[r.date] = (byDate[r.date] || 0) + 1;
    });

    // 오늘 오프셋은 저장 당시 날짜에만 적용 (날짜 바뀌면 자동으로 실제값부터 시작)
    const todayOffset = settings.visitor_offset_today_date === today ? num(settings.visitor_offset_today) : 0;
    const totalOffset = num(settings.visitor_offset_total);

    const last30 = Array.from({ length: 30 }, (_, i) => {
      const d = kstDate(29 - i);
      return { date: d, count: (byDate[d] || 0) + (d === today ? todayOffset : 0) };
    });

    return NextResponse.json({
      today: (realToday ?? 0) + todayOffset,
      total: (realTotal ?? 0) + totalOffset,
      trades: num(settings.trades_total),
      last30,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'fail' }, { status: 500 });
  }
}

// PUT: 관리자 '수치 수정' — 고정이 아니라 시작값(오프셋)으로 저장
export async function PUT(req: NextRequest) {
  // 관리자 전용 — 게이트가 없으면 누구나 사이트 방문자 수치를 바꿀 수 있다
  if (!verifyAdminSession(req.cookies.get('altteul-giftcard_admin')?.value)) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }
  try {
    const { today: wantToday, total: wantTotal, trades } = await req.json();
    const supabase = createServiceClient();
    const today = kstDate();

    const [{ count: realToday }, { count: realTotal }] = await Promise.all([
      supabase.from('visitors').select('id', { count: 'exact', head: true }).eq('date', today),
      supabase.from('visitors').select('id', { count: 'exact', head: true }),
    ]);

    // 원하는 표시값 - 실제 집계 = 오프셋 (이후 실제 방문이 이 위에 계속 누적됨)
    const rows = [
      { key: 'visitor_offset_today', value: String(Number(wantToday ?? 0) - (realToday ?? 0)) },
      { key: 'visitor_offset_today_date', value: today },
      { key: 'visitor_offset_total', value: String(Number(wantTotal ?? 0) - (realTotal ?? 0)) },
      { key: 'trades_total', value: String(Number(trades ?? 0)) },
    ];
    const { error } = await supabase.from('site_settings').upsert(rows, { onConflict: 'key' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, today: Number(wantToday ?? 0), total: Number(wantTotal ?? 0) });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'fail' }, { status: 500 });
  }
}
