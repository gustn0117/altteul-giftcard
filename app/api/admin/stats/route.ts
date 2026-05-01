import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { verifyAdminSession } from '../route';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('altteul-giftcard_admin')?.value;
  if (!verifyAdminSession(token)) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 });
  }

  const supabase = createServiceClient();

  const [usersRes, postsRes, chatsRes, premiumRes, noticesRes] = await Promise.allSettled([
    supabase.from('users').select('id, type, created_at', { count: 'exact' }),
    supabase.from('posts').select('id, type, is_active, created_at', { count: 'exact' }),
    supabase.from('chats').select('id, current_step, status, trade_type, created_at', { count: 'exact' }),
    supabase.from('premium_buyers').select('id, is_active, tier', { count: 'exact' }),
    supabase.from('notices').select('id, is_pinned', { count: 'exact' }),
  ]);

  const users = usersRes.status === 'fulfilled' ? (usersRes.value.data ?? []) : [];
  const posts = postsRes.status === 'fulfilled' ? (postsRes.value.data ?? []) : [];
  const chats = chatsRes.status === 'fulfilled' ? (chatsRes.value.data ?? []) : [];
  const premium = premiumRes.status === 'fulfilled' ? (premiumRes.value.data ?? []) : [];
  const notices = noticesRes.status === 'fulfilled' ? (noticesRes.value.data ?? []) : [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  const todayUsers = users.filter((u: { created_at: string }) => u.created_at >= todayIso).length;
  const todayPosts = posts.filter((p: { created_at: string }) => p.created_at >= todayIso).length;
  const todayChats = chats.filter((c: { created_at: string }) => c.created_at >= todayIso).length;

  return NextResponse.json({
    users: {
      total: users.length,
      business: users.filter((u: { type: string }) => u.type === 'business').length,
      normal: users.filter((u: { type: string }) => u.type === 'normal').length,
      todayNew: todayUsers,
    },
    posts: {
      total: posts.length,
      sell: posts.filter((p: { type: string }) => p.type === 'sell').length,
      buy: posts.filter((p: { type: string }) => p.type === 'buy').length,
      active: posts.filter((p: { is_active: boolean }) => p.is_active).length,
      todayNew: todayPosts,
    },
    chats: {
      total: chats.length,
      completed: chats.filter((c: { current_step: number }) => c.current_step >= 6).length,
      inProgress: chats.filter((c: { current_step: number }) => c.current_step >= 1 && c.current_step < 6).length,
      escrow: chats.filter((c: { trade_type: string }) => c.trade_type === 'escrow').length,
      todayNew: todayChats,
    },
    premium: {
      total: premium.length,
      active: premium.filter((p: { is_active: boolean }) => p.is_active).length,
      premium: premium.filter((p: { tier: string }) => p.tier === 'premium').length,
    },
    notices: {
      total: notices.length,
      pinned: notices.filter((n: { is_pinned: boolean }) => n.is_pinned).length,
    },
  });
}
