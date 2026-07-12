-- 업체 회원 프로필 필드 추가: 대표자명 / 메신저 종류 / 메신저 아이디
-- (기존 users 테이블에 컬럼만 보강 — 개인 회원은 NULL)
alter table altteul_giftcard.users
  add column if not exists representative text,
  add column if not exists messenger text,
  add column if not exists messenger_id text;
