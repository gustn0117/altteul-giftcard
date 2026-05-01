export interface DBPost {
  id: string;
  author_id: string | null;
  guest_name?: string | null;
  guest_password?: string | null;
  guest_phone?: string | null;
  type: 'sell' | 'buy';
  category: string;
  title: string;
  face_value: number;
  price: number;
  discount: number; // generated column
  delivery: string | null;
  delivery_method: string;
  region: string | null;
  description: string | null;
  tags: string[];
  views: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // joined
  author?: DBUser;
}

export interface DBUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  type: 'normal' | 'business';
  password_hash?: string;
  created_at: string;
  updated_at: string;
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
