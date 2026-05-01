// 카테고리 ID -> 이름 매핑
export function getCategoryName(id: string): string {
  return categoryMap[id] || id;
}

const categoryMap: Record<string, string> = {
  lotte: '롯데', shinsegae: '신세계', culture: '문화상품권', cultureland: '컬쳐랜드',
  starbucks: '스타벅스', oncash: '온캐시', googleplay: '구글플레이', teencash: '틴캐시',
  baemin: '배민상품권', happymoney: '해피머니', etc: '기타',
};

// 상품권 카테고리
export const categories = [
  { id: 'all', name: '전체' },
  { id: 'lotte', name: '롯데' },
  { id: 'shinsegae', name: '신세계' },
  { id: 'culture', name: '문화상품권' },
  { id: 'cultureland', name: '컬쳐랜드' },
  { id: 'starbucks', name: '스타벅스' },
  { id: 'oncash', name: '온캐시' },
  { id: 'googleplay', name: '구글플레이' },
  { id: 'teencash', name: '틴캐시' },
  { id: 'baemin', name: '배민상품권' },
  { id: 'happymoney', name: '해피머니' },
  { id: 'etc', name: '기타' },
];

// 프리미엄 구매 업체 (레퍼런스)
export const premiumBuyers = [
  {
    id: 1,
    name: '업체명 1',
    description: '업체 소개 내용이 들어갑니다. 매입 가능한 상품권 종류 및 안내 문구.',
    brands: ['브랜드1', '브랜드2'],
    phone: '010-0000-0000',
    region: '지역 정보',
    isPremium: true,
    bgImage: '',
  },
  {
    id: 2,
    name: '업체명 2',
    description: '업체 소개 내용이 들어갑니다. 매입 가능한 상품권 종류 및 안내 문구.',
    brands: ['브랜드1', '브랜드2'],
    phone: '010-0000-0000',
    region: '지역 정보',
    isPremium: true,
    bgImage: '',
  },
  {
    id: 3,
    name: '업체명 3',
    description: '업체 소개 내용이 들어갑니다. 매입 가능한 상품권 종류 및 안내 문구.',
    brands: ['브랜드1', '브랜드2'],
    phone: '010-0000-0000',
    region: '지역 정보',
    isPremium: true,
    bgImage: '',
  },
  {
    id: 4,
    name: '업체명 4',
    description: '업체 소개 내용이 들어갑니다. 매입 가능한 상품권 종류 및 안내 문구.',
    brands: ['브랜드1', '브랜드2'],
    phone: '010-0000-0000',
    region: '지역 정보',
    isPremium: true,
    bgImage: '',
  },
  {
    id: 5,
    name: '업체명 5',
    description: '업체 소개 내용이 들어갑니다. 매입 가능한 상품권 종류 및 안내 문구.',
    brands: ['브랜드1', '브랜드2'],
    phone: '010-0000-0000',
    region: '지역 정보',
    isPremium: true,
    bgImage: '',
  },
  {
    id: 6,
    name: '업체명 6',
    description: '업체 소개 내용이 들어갑니다. 매입 가능한 상품권 종류 및 안내 문구.',
    brands: ['브랜드1'],
    phone: '010-0000-0000',
    region: '지역 정보',
    isPremium: true,
    bgImage: '',
  },
];

// 판매글/구매글/공지/채팅 등은 Supabase DB에서 가져옴 (mock 데이터 사용하지 않음)
// 아래는 레거시 타입 호환용으로만 유지

export const sellPosts: Post[] = [];
export const buyPosts: Post[] = [];
export const notices: { id: number; title: string; date: string }[] = [];
export const chatList: { id: number; partner: string; partnerType: string; title: string; status: string; step: number; stepName: string; lastMessage: string; lastMessageTime: string; tradeCompleted: number; tradeOngoing: number; tradeDelayed: number; unread: number }[] = [];
export const chatMessages: Record<number, ChatMessage[]> = {};

// 거래 프로세스 단계
export const tradeSteps = [
  { step: 1, name: '견적', label: '견적' },
  { step: 2, name: '기본정보', label: '기본정보' },
  { step: 3, name: '계약서', label: '계약서' },
  { step: 4, name: '입금', label: '입금' },
  { step: 5, name: '배송', label: '배송' },
  { step: 6, name: '완료', label: '완료' },
];

// 대시보드 스케줄 데이터 (레퍼런스)
export const scheduleData = [
  { date: '2026.01.01', dDay: 'D-0', partner: '사용자명', product: '상품명', amount: 0, status: '진행중' },
];

// 유저 데이터 (레퍼런스)
export const users = {
  user1: {
    id: 'user1',
    name: '사용자 1',
    type: '일반 회원',
    joinDate: '2026년 1월 1일',
    tradeCompleted: 0,
    tradeOngoing: 0,
    tradeDelayed: 0,
  },
  biz1: {
    id: 'biz1',
    name: '업체 1',
    type: '프리미엄 업체',
    joinDate: '2026년 1월 1일',
    tradeCompleted: 0,
    tradeOngoing: 0,
    tradeDelayed: 0,
    businessNumber: '000-00-00000',
    representative: '대표자명',
    phone: '010-0000-0000',
  },
};

// Types
export interface ChatMessage {
  id: number;
  sender: string;
  type: 'message' | 'notice' | 'product' | 'system-action' | 'quote' | 'info-request' | 'contract' | 'payment' | 'delivery' | 'complete';
  content: string;
  time: string;
  price?: number;
  originalPrice?: number;
  discount?: number;
  data?: Record<string, unknown>;
}

export interface Post {
  id: number;
  category: string;
  categoryName: string;
  title: string;
  faceValue: number;
  price: number;
  discount: number;
  tags: string[];
  isNew: boolean;
  author: string;
  authorId: string;
  createdAt: string;
  views: number;
  delivery?: string;
  isBusiness?: boolean;
}
