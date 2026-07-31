import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { verifyAdminSession } from '../route';

// 내보내기 가능한 테이블/컬럼 (관리자 전용)
const TABLES: Record<string, string> = {
  users: 'id, type, name, phone, email, kakao_id, points, phone_verified, created_at',
  posts: 'id, type, title, category, region, percentage, ad_type, approved_at, expires_at, guest_name, guest_phone, author_id, completed_at, deleted_at, created_at',
};

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(',')];
  for (const r of rows) lines.push(headers.map((h) => esc(r[h])).join(','));
  return lines.join('\n');
}

export async function GET(req: NextRequest) {
  if (!verifyAdminSession(req.cookies.get('altteul-giftcard_admin')?.value)) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }
  const table = req.nextUrl.searchParams.get('table') || '';
  const cols = TABLES[table];
  if (!cols) return NextResponse.json({ error: '지원하지 않는 항목입니다.' }, { status: 400 });

  const supabase = createServiceClient();
  const { data, error } = await supabase.from(table).select(cols).order('created_at', { ascending: false }).limit(100000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 엑셀 한글 깨짐 방지용 BOM
  const csv = '﻿' + toCsv((data ?? []) as unknown as Record<string, unknown>[]);
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${table}_${date}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
