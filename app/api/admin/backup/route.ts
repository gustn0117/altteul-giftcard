import { NextRequest, NextResponse } from 'next/server';
import zlib from 'zlib';
import { createServiceClient } from '@/lib/supabase';
import { verifyAdminSession } from '../route';

// 전체 DB를 JSON으로 모아 gzip 압축해 다운로드(관리자 전용).
// 복원 가능한 원본 백업. 파일: altteul-backup-YYYY-MM-DD.json.gz
export const dynamic = 'force-dynamic';

// 백업 대상 테이블 (없는 테이블은 건너뜀)
const TABLES = [
  'users', 'posts', 'notices', 'premium_buyers',
  'visitors', 'mok_verifications', 'site_settings', 'phone_verifications',
];

export async function GET(req: NextRequest) {
  if (!verifyAdminSession(req.cookies.get('altteul-giftcard_admin')?.value)) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const dump: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    schema: 'altteul_giftcard',
    tables: {} as Record<string, unknown[]>,
  };
  const tables = dump.tables as Record<string, unknown[]>;
  const meta: Record<string, number | string> = {};

  for (const t of TABLES) {
    const { data, error } = await supabase.from(t).select('*').limit(1000000);
    if (error) { meta[t] = `skip: ${error.message}`; continue; }
    tables[t] = data ?? [];
    meta[t] = (data ?? []).length;
  }
  dump.counts = meta;

  const json = JSON.stringify(dump);
  const gz = zlib.gzipSync(Buffer.from(json, 'utf8'), { level: 9 });
  const date = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

  return new Response(new Uint8Array(gz), {
    headers: {
      'Content-Type': 'application/gzip',
      'Content-Disposition': `attachment; filename="altteul-backup-${date}.json.gz"`,
      'Cache-Control': 'no-store',
    },
  });
}
