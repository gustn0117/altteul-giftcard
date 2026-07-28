import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

/**
 * 주기적으로 호출되는 cron 엔드포인트.
 * - 만료 임박 알림 (글: 1시간 전, 배너: 3일 전)
 * - 만료된 글/배너를 블라인드 처리
 * - 60일 지난 팝니다 글을 soft-delete
 *
 * 인증: ADMIN_SECRET 헤더 또는 Bearer 토큰
 * 호출 예: curl -H "x-cron-secret: $ADMIN_SECRET" https://altteul-giftcard.hsweb.pics/api/cron
 *         서버 cron에 5~10분마다 등록
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') || req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return runCron();
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return runCron();
}

async function runCron() {
  const supabase = createServiceClient();
  const now = new Date();
  const nowIso = now.toISOString();
  const inOneHour = new Date(now.getTime() + 3600 * 1000).toISOString();
  const inThreeDays = new Date(now.getTime() + 3 * 86400 * 1000).toISOString();
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400 * 1000).toISOString();

  const result: Record<string, number> = {
    ads_expired: 0,
    posts_notified: 0,
    posts_soft_deleted: 0,
    banners_locked: 0,
    banners_notified: 0,
  };

  // ── 1. 게시 기간이 끝난 삽니다 광고 → 승인 해제(홈 광고칸에서 내림) ──
  // 관리자가 20/25/30일을 넣어 승인하지만 예전엔 만료를 집행하는 코드가 없어
  // 한 번 승인된 광고가 기간이 지나도 영원히 노출됐다.
  const { data: expiredAds } = await supabase
    .from('posts')
    .select('id, author_id, title')
    .eq('type', 'buy')
    .is('deleted_at', null)
    .not('approved_at', 'is', null)
    .lt('expires_at', nowIso);
  if (expiredAds && expiredAds.length > 0) {
    const ids = expiredAds.map((p) => p.id);
    await supabase.from('posts').update({ approved_at: null, updated_at: nowIso }).in('id', ids);
    const noties = expiredAds
      .filter((p) => p.author_id)
      .map((p) => ({
        user_id: p.author_id,
        type: 'post_expired',
        title: '광고 게시 기간이 만료되었습니다',
        body: `"${p.title}" 광고가 만료되어 노출이 중단되었습니다. 연장은 운영자에게 문의해주세요.`,
        link: '/dashboard',
      }));
    if (noties.length > 0) await supabase.from('notifications').insert(noties);
    result.ads_expired = expiredAds.length;      // 실제 만료 집행 건수
    result.posts_notified = noties.length;       // 실제 알림 발송 건수 (비회원 글은 제외되므로 다를 수 있음)
  }

  // ── 2. 60일 지난 팝니다 글 soft-delete ──
  const { data: toDelete } = await supabase
    .from('posts')
    .select('id')
    .eq('type', 'sell')
    .is('deleted_at', null)
    .lte('created_at', sixtyDaysAgo);
  if (toDelete && toDelete.length > 0) {
    const ids = toDelete.map((p) => p.id);
    await supabase.from('posts').update({ deleted_at: nowIso }).in('id', ids);
    result.posts_soft_deleted = toDelete.length;
  }

  // ── 4. 만료된 배너 비활성 ──
  const { data: bannersToLock } = await supabase
    .from('main_banners')
    .select('id, business_id, title')
    .eq('is_active', true)
    .lte('expires_at', nowIso);
  if (bannersToLock && bannersToLock.length > 0) {
    const ids = bannersToLock.map((b) => b.id);
    await supabase.from('main_banners').update({ is_active: false, updated_at: nowIso }).in('id', ids);
    result.banners_locked = bannersToLock.length;
    // 업체에 알림
    const noties = bannersToLock
      .filter((b) => !!b.business_id)
      .map((b) => ({
        user_id: b.business_id!,
        type: 'banner_locked',
        title: '메인 배너가 만료되었습니다',
        body: `[${b.title}] 운영자가 검토 후 재활성화할 수 있습니다.`,
        link: '/dashboard',
      }));
    if (noties.length > 0) await supabase.from('notifications').insert(noties);
  }

  // ── 5. 3일 내 만료 예정 배너 알림 ──
  const { data: bannersToNotify } = await supabase
    .from('main_banners')
    .select('id, business_id, title, expires_at')
    .eq('is_active', true)
    .is('notified_expiry_at', null)
    .gt('expires_at', nowIso)
    .lte('expires_at', inThreeDays)
    .not('business_id', 'is', null);
  if (bannersToNotify && bannersToNotify.length > 0) {
    const ids = bannersToNotify.map((b) => b.id);
    await supabase.from('main_banners').update({ notified_expiry_at: nowIso }).in('id', ids);
    const noties = bannersToNotify.map((b) => ({
      user_id: b.business_id!,
      type: 'banner_expiry_soon',
      title: '메인 배너가 3일 후 만료됩니다',
      body: `[${b.title}] 운영자에게 연장을 요청하세요.`,
      link: '/dashboard',
    }));
    await supabase.from('notifications').insert(noties);
    result.banners_notified = bannersToNotify.length;
  }

  return NextResponse.json({ ok: true, ran_at: nowIso, ...result });
}
