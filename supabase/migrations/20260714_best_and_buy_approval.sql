-- 이달의 Best 업체 플래그 (관리자 지정)
alter table altteul_giftcard.premium_buyers
  add column if not exists is_best boolean default false;

-- 삽니다 승인: approved_at NULL = 승인 대기, 값 있으면 승인됨
alter table altteul_giftcard.posts
  add column if not exists approved_at timestamptz;

-- 기존 글은 자동 승인 처리 (사라지지 않게)
update altteul_giftcard.posts
   set approved_at = created_at
 where approved_at is null and deleted_at is null;
