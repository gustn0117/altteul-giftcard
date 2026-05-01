import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { verifyAdminSession } from '../route';

const SELL_EXTEND_DAYS = 7;
const BUY_EXTEND_DAYS = 7;
const BANNER_EXTEND_DAYS = 30;

/** 운영자가 글의 블라인드 잠금을 해제 (만료 시각도 다시 미래로) */
export async function POST(req: NextRequest) {
  const token = req.cookies.get('altteul-giftcard_admin')?.value;
  if (!verifyAdminSession(token)) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }
  const { post_id, banner_id } = await req.json();
  const supabase = createServiceClient();

  if (post_id) {
    const { data: post, error } = await supabase.from('posts').select('id, type, author_id').eq('id', post_id).single();
    if (error || !post) return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });
    const days = post.type === 'sell' ? SELL_EXTEND_DAYS : BUY_EXTEND_DAYS;
    const newExpire = new Date(Date.now() + days * 86400000).toISOString();
    await supabase.from('posts').update({
      blind_locked: false,
      expires_at: newExpire,
      notified_expiry_at: null,
      updated_at: new Date().toISOString(),
    }).eq('id', post_id);

    // 작성자에게 알림
    if (post.author_id) {
      await supabase.from('notifications').insert({
        user_id: post.author_id,
        type: 'post_unlocked',
        title: '글이 다시 활성화되었습니다',
        body: `운영자가 검토 후 글을 다시 활성화했습니다. ${days}일간 노출됩니다.`,
        link: `/board/${post_id}`,
      });
    }
    return NextResponse.json({ ok: true, expires_at: newExpire });
  }

  if (banner_id) {
    const { data: banner, error } = await supabase.from('main_banners').select('id, business_id').eq('id', banner_id).single();
    if (error || !banner) return NextResponse.json({ error: '배너를 찾을 수 없습니다.' }, { status: 404 });
    const newExpire = new Date(Date.now() + BANNER_EXTEND_DAYS * 86400000).toISOString();
    await supabase.from('main_banners').update({
      is_active: true,
      expires_at: newExpire,
      notified_expiry_at: null,
      updated_at: new Date().toISOString(),
    }).eq('id', banner_id);
    return NextResponse.json({ ok: true, expires_at: newExpire });
  }

  return NextResponse.json({ error: 'post_id 또는 banner_id가 필요합니다.' }, { status: 400 });
}

/** 블라인드 처리된 (또는 만료 임박) 목록 조회 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get('altteul-giftcard_admin')?.value;
  if (!verifyAdminSession(token)) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }
  const supabase = createServiceClient();
  const { data: posts } = await supabase
    .from('posts')
    .select('id, type, title, author_id, guest_name, expires_at, blind_locked, deleted_at, created_at')
    .eq('blind_locked', true)
    .is('deleted_at', null)
    .order('expires_at', { ascending: true })
    .limit(200);
  const { data: banners } = await supabase
    .from('main_banners')
    .select('*')
    .eq('is_active', false)
    .order('expires_at', { ascending: true })
    .limit(50);
  return NextResponse.json({ posts: posts ?? [], banners: banners ?? [] });
}
