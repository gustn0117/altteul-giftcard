export type AdSlot =
  | 'hero_banner'      // 메인 히어로 배너 (가장 큰 광고)
  | 'main_top'         // 메인 페이지 상단 (게시글 위)
  | 'main_middle'      // 메인 페이지 중간 (구매/판매글 사이)
  | 'sidebar_top'      // 사이드바 상단
  | 'sidebar_bottom'   // 사이드바 하단
  | 'board_top'        // 게시판 상단
  | 'board_between'    // 게시판 목록 사이
  | 'detail_bottom'    // 게시글 상세 하단
  | 'chat_top'         // 채팅 목록 상단
  | 'footer_banner'    // 푸터 위 전면 배너
  | 'popup';           // 팝업 광고

export interface Ad {
  id: string;
  slot: AdSlot;
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  advertiser: string;
  is_active: boolean;
  start_date: string;
  end_date: string;
  priority: number; // 높을수록 우선
  created_at: string;
}

export const AD_SLOT_LABELS: Record<AdSlot, string> = {
  hero_banner: '메인 히어로 배너',
  main_top: '메인 상단 배너',
  main_middle: '메인 중간 배너',
  sidebar_top: '사이드바 상단',
  sidebar_bottom: '사이드바 하단',
  board_top: '게시판 상단',
  board_between: '게시판 목록 사이',
  detail_bottom: '게시글 상세 하단',
  chat_top: '채팅 목록 상단',
  footer_banner: '푸터 상단 배너',
  popup: '팝업 광고',
};

export const AD_SLOT_SIZES: Record<AdSlot, string> = {
  hero_banner: '1140 x 200',
  main_top: '1140 x 90',
  main_middle: '1140 x 90',
  sidebar_top: '300 x 250',
  sidebar_bottom: '300 x 250',
  board_top: '960 x 90',
  board_between: '960 x 60',
  detail_bottom: '740 x 90',
  chat_top: '640 x 60',
  footer_banner: '1140 x 80',
  popup: '400 x 500',
};
