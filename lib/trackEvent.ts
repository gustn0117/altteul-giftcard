// 광고(삽니다 글) 클릭/조회 이벤트를 서버에 기록 — 업체별 접속통계용.
// 실패해도 사용자 흐름을 막지 않도록 조용히 무시한다.
export function trackAdEvent(postId: string | undefined | null, kind: 'view' | 'phone' | 'sms') {
  if (!postId || typeof window === 'undefined') return;
  try {
    fetch('/api/ad-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId, kind }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* 무시 */
  }
}
