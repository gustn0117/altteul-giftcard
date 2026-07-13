-- 팝니다 연락처 열람(500P) + 삽니다 공개 토글 관련 스키마

-- 1) 연락처 열람 이력: 글당 서로 다른 회원 5명까지, 회원별 1회(이후 무료 재열람)
create table if not exists altteul_giftcard.contact_reveals (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references altteul_giftcard.posts(id) on delete cascade,
  user_id uuid not null references altteul_giftcard.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (post_id, user_id)
);
create index if not exists contact_reveals_post_idx on altteul_giftcard.contact_reveals(post_id, created_at);

-- 2) 작성자 블라인드 리셋 시각 — 이 시각 이후의 열람만 '현재 5명' 카운트에 포함
alter table altteul_giftcard.posts
  add column if not exists contact_reset_at timestamptz;

-- 3) 사이트 설정 (삽니다 연락처 공개 여부 등 차후 확장)
create table if not exists altteul_giftcard.site_settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);
insert into altteul_giftcard.site_settings (key, value)
  values ('buy_contact_public', 'true')
  on conflict (key) do nothing;

grant all privileges on altteul_giftcard.contact_reveals to authenticator, anon, authenticated, service_role;
grant all privileges on altteul_giftcard.site_settings to authenticator, anon, authenticated, service_role;
