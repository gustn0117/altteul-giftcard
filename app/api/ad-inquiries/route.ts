import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// POST /api/ad-inquiries
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, company, phone, email, ad_type, budget, message } = body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: '이름을 입력해주세요.' }, { status: 400 });
  }
  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    return NextResponse.json({ error: '연락처를 입력해주세요.' }, { status: 400 });
  }
  if (!message || typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ error: '문의 내용을 입력해주세요.' }, { status: 400 });
  }
  if (name.length > 50 || phone.length > 20 || (email && email.length > 100) || message.length > 2000) {
    return NextResponse.json({ error: '입력값이 너무 깁니다.' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('ad_inquiries')
    .insert({
      name: name.trim(),
      company: (typeof company === 'string' && company.trim()) || null,
      phone: phone.trim(),
      email: (typeof email === 'string' && email.trim()) || null,
      ad_type: (typeof ad_type === 'string' && ad_type.trim()) || null,
      budget: (typeof budget === 'string' && budget.trim()) || null,
      message: message.trim(),
    })
    .select('id, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}

// GET /api/ad-inquiries?resolved=false  (admin)
export async function GET(req: NextRequest) {
  const resolvedParam = req.nextUrl.searchParams.get('resolved');
  const supabase = createServiceClient();
  let q = supabase
    .from('ad_inquiries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (resolvedParam === 'true') q = q.eq('is_resolved', true);
  if (resolvedParam === 'false') q = q.eq('is_resolved', false);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ inquiries: data || [] });
}

// PATCH /api/ad-inquiries?id=xxx  (admin: toggle resolved)
export async function PATCH(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const updates: Record<string, unknown> = {};
  if (typeof body.is_resolved === 'boolean') updates.is_resolved = body.is_resolved;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: '변경할 값이 없습니다.' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from('ad_inquiries').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/ad-inquiries?id=xxx  (admin)
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });
  const supabase = createServiceClient();
  const { error } = await supabase.from('ad_inquiries').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
