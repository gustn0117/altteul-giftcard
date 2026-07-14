-- 메인광고(프리미엄 업체) 카드에 표시할 매입률(%) — 관리자가 업체별로 설정
alter table altteul_giftcard.premium_buyers
  add column if not exists buy_rate numeric;
