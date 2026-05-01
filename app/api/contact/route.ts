import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, phone, email, subject, message } = body;

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
    .from('contact_inquiries')
    .insert({
      name: name.trim(),
      phone: phone.trim(),
      email: (typeof email === 'string' && email.trim()) || null,
      subject: (typeof subject === 'string' && subject.trim()) || null,
      message: message.trim(),
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}

export async function GET() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('contact_inquiries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ inquiries: data || [] });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });
  const supabase = createServiceClient();
  const { error } = await supabase.from('contact_inquiries').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
