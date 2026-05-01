import Link from 'next/link';
import {
  MapPin,
  Tag,
  MessageSquare,
  HeadphonesIcon,
  ChevronRight,
} from 'lucide-react';

interface MenuColumn {
  title: string;
  icon: typeof MapPin;
  href: string;
  items: { label: string; href: string; highlight?: boolean }[];
}

const COLUMNS: MenuColumn[] = [
  {
    title: '지역별 업체찾기',
    icon: MapPin,
    href: '/category/area',
    items: [
      { label: '서울', href: '/category/area?region=서울' },
      { label: '경기', href: '/category/area?region=경기' },
      { label: '인천', href: '/category/area?region=인천' },
      { label: '부산', href: '/category/area?region=부산' },
      { label: '대구', href: '/category/area?region=대구' },
      { label: '더보기 +', href: '/category/area', highlight: true },
    ],
  },
  {
    title: '상품별 업체찾기',
    icon: Tag,
    href: '/category/product',
    items: [
      { label: '신세계', href: '/category/product?type=신세계' },
      { label: '롯데', href: '/category/product?type=롯데' },
      { label: '문화상품권', href: '/category/product?type=문화상품권' },
      { label: '컬쳐랜드', href: '/category/product?type=컬쳐랜드' },
      { label: '스타벅스', href: '/category/product?type=스타벅스' },
      { label: '더보기 +', href: '/category/product', highlight: true },
    ],
  },
  {
    title: '커뮤니티',
    icon: MessageSquare,
    href: '/community',
    items: [
      { label: '업계뉴스', href: '/community?cat=news' },
      { label: '거래TIP (안전거래)', href: '/community?cat=tip' },
      { label: '질문과 답변', href: '/community?cat=qna' },
      { label: '통합검색', href: '/search' },
    ],
  },
  {
    title: '고객센터',
    icon: HeadphonesIcon,
    href: '/faq',
    items: [
      { label: '공지사항', href: '/notice' },
      { label: '1:1 문의', href: '/contact', highlight: true },
      { label: '자주묻는질문', href: '/faq' },
      { label: '이용안내', href: '/guide' },
      { label: '광고문의', href: '/advertising' },
      { label: '사기방지 가이드', href: '/fraud' },
    ],
  },
];

export default function SiteMenu() {
  return (
    <section className="bg-white border border-gray-200 mb-5">
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-200">
        {COLUMNS.map(({ title, icon: Icon, href, items }) => (
          <div key={title} className="p-4">
            <Link
              href={href}
              className="flex items-center justify-between mb-3 group"
            >
              <h3 className="text-[14px] font-bold text-gray-900 flex items-center gap-1.5">
                <Icon size={14} className="text-accent" />
                {title}
              </h3>
              <ChevronRight
                size={13}
                className="text-gray-400 group-hover:text-accent transition-colors"
              />
            </Link>
            <ul className="space-y-1.5">
              {items.map((item) => (
                <li key={item.href + item.label}>
                  <Link
                    href={item.href}
                    className={`text-[12px] hover:underline ${
                      item.highlight
                        ? 'text-accent font-semibold'
                        : 'text-gray-600 hover:text-accent'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
