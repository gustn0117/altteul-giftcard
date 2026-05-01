import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import type { Ad } from '@/lib/ads';

// GET: 광고 목록 (slot 필터 가능)
export async function GET(req: NextRequest) {
  const slot = req.nextUrl.searchParams.get('slot');
  const activeOnly = req.nextUrl.searchParams.get('active') === 'true';
  const supabase = createServiceClient();

  let q = supabase.from('ads').select('*').order('priority', { ascending: false });
  if (slot) q = q.eq('slot', slot);
  if (activeOnly) {
    const now = new Date().toISOString();
    q = q.eq('is_active', true).lte('start_date', now).gte('end_date', now);
  }

  const { data, error } = await q;
  if (error) return NextResponse.json([], { status: 200 });
  return NextResponse.json(data);
}

// POST: 광고 등록
export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = createServiceClient();

  const newAd = {
    slot: body.slot,
    title: body.title || '',
    description: body.description || '',
    image_url: body.image_url || '',
    link_url: body.link_url || '',
    advertiser: body.advertiser || '',
    is_active: body.is_active ?? true,
    start_date: body.start_date || new Date().toISOString(),
    end_date: body.end_date || new Date(Date.now() + 30 * 86400000).toISOString(),
    priority: body.priority ?? 0,
  };

  const { data, error } = await supabase.from('ads').insert(newAd).select().single();
  if (error) {
    // Fallback: ads 테이블이 없을 수 있음 - JSON 파일 폴백
    return NextResponse.json(await fallbackCreate(newAd), { status: 201 });
  }
  return NextResponse.json(data, { status: 201 });
}

// PUT: 광고 수정
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const supabase = createServiceClient();

  const { id, ...updates } = body;
  const { data, error } = await supabase.from('ads').update(updates).eq('id', id).select().single();
  if (error) {
    return await fallbackUpdate(id, updates);
  }
  return NextResponse.json(data);
}

// DELETE: 광고 삭제
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const supabase = createServiceClient();
  const { error } = await supabase.from('ads').delete().eq('id', id);
  if (error) {
    return await fallbackDelete(id);
  }
  return NextResponse.json({ ok: true });
}

// ─── JSON 파일 폴백 (ads 테이블이 아직 없을 때) ───
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'ads.json');

function readAdsFile(): Ad[] {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch { return []; }
}
function writeAdsFile(ads: Ad[]) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(ads, null, 2));
}

async function fallbackCreate(newAd: Record<string, unknown>) {
  const ads = readAdsFile();
  const ad = { ...newAd, id: crypto.randomUUID(), created_at: new Date().toISOString() } as Ad;
  ads.push(ad);
  writeAdsFile(ads);
  return ad;
}
async function fallbackUpdate(id: string, updates: Record<string, unknown>) {
  const ads = readAdsFile();
  const idx = ads.findIndex(a => a.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  ads[idx] = { ...ads[idx], ...updates };
  writeAdsFile(ads);
  return NextResponse.json(ads[idx]);
}
async function fallbackDelete(id: string) {
  let ads = readAdsFile();
  ads = ads.filter(a => a.id !== id);
  writeAdsFile(ads);
  return NextResponse.json({ ok: true });
}
