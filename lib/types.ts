export interface DBPost {
  id: string;
  author_id: string | null;
  guest_name?: string | null;
  guest_password?: string | null;
  guest_phone?: string | null;
  type: 'sell' | 'buy';
  category: string;
  title: string;
  face_value: number | null;
  price: number | null;
  discount: number | null;
  /** 매입률(%) — 팝니다 글의 새 표기 */
  percentage: number | null;
  /** 발송 예정 월 (1-12) */
  send_month: number | null;
  /** 발송 예정 일 (1-31) */
  send_day: number | null;
  delivery: string | null;
  delivery_method: string;
  region: string | null;
  description: string | null;
  tags: string[];
  views: number;
  is_active: boolean;
  /** 만료(블라인드 잠금) 시각 */
  expires_at: string | null;
  /** 블라인드 잠금 여부 (만료되면 true) */
  blind_locked: boolean;
  /** 판매완료 시각 — 작성자가 직접 토글 */
  completed_at: string | null;
  /** soft-delete 시각 (30일 자동삭제 등) */
  deleted_at: string | null;
  /** 마지막 점프 시각 — 정렬 우선순위 */
  last_jumped_at: string | null;
  /** 만료 1시간 전 알림 발송 시각 */
  notified_expiry_at: string | null;
  created_at: string;
  updated_at: string;
  author?: DBUser;
}

export interface DBUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  type: 'normal' | 'business';
  password_hash?: string;
  /** 업체 회원: 대표자명 */
  representative?: string | null;
  /** 업체 회원: 메신저 종류 (kakaotalk | telegram) */
  messenger?: string | null;
  /** 업체 회원: 메신저 아이디 */
  messenger_id?: string | null;
  /** 점프 등에 사용하는 포인트 — 운영자만 충전 */
  points: number;
  /** 팝니다 글 연락처 열람 권한 만료 시각 — 운영자가 부여 */
  contact_view_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface DBMainBanner {
  id: string;
  position: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  business_id: string | null;
  bg_color: string;
  expires_at: string;
  notified_expiry_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type NotificationType =
  | 'post_expiry_soon'
  | 'banner_expiry_soon'
  | 'post_locked'
  | 'banner_locked'
  | 'post_unlocked'
  | 'point_charged';

export interface DBNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export interface DBJumpLog {
  id: string;
  post_id: string;
  user_id: string;
  used_free: boolean;
  points_used: number;
  created_at: string;
}

export interface DBPointTransaction {
  id: string;
  user_id: string;
  delta: number;
  balance_after: number;
  reason: string;
  admin_id: string | null;
  created_at: string;
}

export interface DBChat {
  id: string;
  post_id: string | null;
  buyer_id: string | null;
  seller_id: string | null;
  status: string;
  current_step: number;
  trade_type: 'direct' | 'escrow';
  escrow_status: string | null;
  created_at: string;
  updated_at: string;
  // joined
  post?: DBPost;
  buyer?: DBUser;
  seller?: DBUser;
}

export interface DBMessage {
  id: string;
  chat_id: string;
  sender_id: string | null;
  type: string;
  content: string;
  data: Record<string, unknown> | null;
  created_at: string;
}

export interface DBPremiumBuyer {
  id: string;
  user_id: string | null;
  name: string;
  headline: string | null;
  description: string;
  phone: string;
  region: string;
  brands: string[];
  image_url: string;
  is_active: boolean;
  priority: number;
  tier: 'premium' | 'standard' | 'basic';
  /** 카드에 표시할 매입률(%) — 관리자 설정 */
  buy_rate?: number | null;
  created_at: string;
  updated_at: string;
}

export interface DBNotice {
  id: string;
  title: string;
  content: string | null;
  is_pinned: boolean;
  created_at: string;
}

export type CommunityCategory = 'news' | 'tip' | 'qna';

export interface DBCommunityPost {
  id: string;
  category: CommunityCategory;
  title: string;
  content: string | null;
  images: string[] | null;
  author_id: string | null;
  author_name: string | null;
  is_pinned: boolean;
  views: number;
  created_at: string;
  updated_at: string;
  comment_count?: number;
}

export interface DBCommunityComment {
  id: string;
  post_id: string;
  author_id: string | null;
  author_name: string | null;
  content: string;
  created_at: string;
}
