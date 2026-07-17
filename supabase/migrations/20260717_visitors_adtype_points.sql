-- 2026-07-17
-- 1) 방문자 통계를 DB에 영구 저장 (기존엔 data/visitors.json 로컬 파일 → Docker 볼륨이 없어 재배포마다 초기화)
-- 2) 삽니다(buy) 글의 광고 종류
-- 3) 원자적 포인트 증감 (기존 select→계산→update 는 동시성에서 충전이 유실됨)
-- 4) 이메일 없는 가입 (휴대폰 번호가 아이디)

-- ── 1. 방문자 ────────────────────────────────────────────────
create table if not exists altteul_giftcard.visitors (
  id          uuid primary key default gen_random_uuid(),
  date        date not null,
  ip          text not null,
  visited_at  timestamptz not null default now(),
  unique (date, ip)                      -- 하루 1IP 1회 집계
);
create index if not exists visitors_date_idx on altteul_giftcard.visitors (date);

-- 관리자 '수치 수정'은 고정값이 아니라 시작값(오프셋)으로 site_settings 에 저장한다.
-- (visitor_offset_today / visitor_offset_today_date / visitor_offset_total / trades_total)
-- 표시값 = 실제 집계 + 오프셋 → 이후 실제 방문이 계속 누적된다.
alter table altteul_giftcard.site_settings
  add constraint site_settings_key_uniq unique (key);

-- ── 2. 광고 종류 ─────────────────────────────────────────────
alter table altteul_giftcard.posts add column if not exists ad_type text;
comment on column altteul_giftcard.posts.ad_type is 'national|main|recommend — 삽니다 글 광고 종류 (홈의 어느 칸에 노출될지)';
update altteul_giftcard.posts set ad_type = 'main' where type = 'buy' and ad_type is null;

-- ── 3. 원자적 포인트 증감 ────────────────────────────────────
create or replace function altteul_giftcard.adjust_points(p_user_id uuid, p_delta int)
returns int language plpgsql security definer as $$
declare new_balance int;
begin
  update altteul_giftcard.users
     set points = greatest(0, coalesce(points, 0) + p_delta)
   where id = p_user_id
  returning points into new_balance;
  if not found then raise exception 'user not found'; end if;
  return new_balance;
end $$;

grant execute on function altteul_giftcard.adjust_points(uuid, int) to service_role, authenticated, anon;

-- ── 4. 이메일 없는 가입 ──────────────────────────────────────
-- 신규 가입은 휴대폰 번호가 아이디. 기존 회원의 email 은 그대로 두고 NOT NULL 만 해제.
alter table altteul_giftcard.users alter column email drop not null;

-- 같은 번호로 '일반 + 업체' 계정은 허용하되, 같은 유형 안에서는 중복 가입 차단.
-- (저장 형식이 하이픈 유무로 섞여 있어 숫자만 남긴 값으로 비교)
create unique index if not exists users_type_phone_uniq
  on altteul_giftcard.users (type, regexp_replace(phone, '[^0-9]', '', 'g'))
  where phone is not null;

notify pgrst, 'reload schema';
