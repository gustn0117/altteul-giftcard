import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const sqlPath = path.join(process.cwd(), 'supabase', 'migrations', '20260418_community.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    return new NextResponse(sql, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'inline; filename="community_migration.sql"',
      },
    });
  } catch {
    return NextResponse.json({ error: '마이그레이션 파일을 찾을 수 없습니다.' }, { status: 404 });
  }
}
