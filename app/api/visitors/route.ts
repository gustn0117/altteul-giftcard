import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'visitors.json');

// ─── JSON 파일 폴백 ───
interface VisitorData { daily: Record<string, number>; total: number; }

function readData(): VisitorData {
  try {
    if (!fs.existsSync(DATA_FILE)) return { daily: {}, total: 0 };
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch { return { daily: {}, total: 0 }; }
}
function writeData(data: VisitorData) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// POST: 방문 기록
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const today = new Date().toISOString().slice(0, 10);

  // Supabase 시도
  try {
    const supabase = createServiceClient();
    // visitors 테이블에 upsert 시도
    const { error } = await supabase.from('visitors').upsert(
      { date: today, ip, visited_at: new Date().toISOString() },
      { onConflict: 'date,ip' }
    );
    if (!error) return NextResponse.json({ ok: true });
  } catch {
    // 테이블 없으면 폴백
  }

  // JSON 파일 폴백
  const data = readData();
  const ipKey = `_ips_${today}`;
  const ips: string[] = (data as unknown as Record<string, unknown>)[ipKey] as string[] || [];
  if (!ips.includes(ip)) {
    ips.push(ip);
    (data as unknown as Record<string, unknown>)[ipKey] = ips;
    data.daily[today] = (data.daily[today] || 0) + 1;
    data.total = (data.total || 0) + 1;
    writeData(data);
  }
  return NextResponse.json({ ok: true });
}

// GET: 방문자 통계 조회
export async function GET() {
  const today = new Date().toISOString().slice(0, 10);

  // Supabase 시도
  try {
    const supabase = createServiceClient();
    // 오늘 카운트
    const { count: todayCount } = await supabase
      .from('visitors')
      .select('*', { count: 'exact', head: true })
      .eq('date', today);

    // 전체 카운트
    const { count: totalCount } = await supabase
      .from('visitors')
      .select('*', { count: 'exact', head: true });

    // 최근 30일 데이터
    const last30: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      const { count } = await supabase
        .from('visitors')
        .select('*', { count: 'exact', head: true })
        .eq('date', d);
      last30.push({ date: d, count: count || 0 });
    }

    if (totalCount !== null) {
      return NextResponse.json({ total: totalCount, today: todayCount || 0, last30 });
    }
  } catch {
    // 폴백
  }

  // JSON 파일 폴백
  const data = readData();
  const todayCount = data.daily[today] || 0;
  const last30: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    last30.push({ date: d, count: data.daily[d] || 0 });
  }
  // 오버라이드 값이 있으면 적용
  const override = (data as unknown as Record<string, unknown>)._override as { today?: number; total?: number; trades?: number } | undefined;
  return NextResponse.json({
    total: override?.total ?? data.total,
    today: override?.today ?? todayCount,
    trades: override?.trades ?? 0,
    last30
  });
}

// PUT: 수치 수동 설정 (관리자용)
export async function PUT(req: NextRequest) {
  const { today, total, trades } = await req.json();
  const data = readData();
  const override = { today, total, trades };
  (data as unknown as Record<string, unknown>)._override = override;
  writeData(data);
  return NextResponse.json({ ok: true, override });
}
