import Link from 'next/link';
import Image from 'next/image';
import { Phone, Clock, ShieldCheck, ExternalLink } from 'lucide-react';
import FooterInfoText from './FooterInfoText';

const SECTIONS = [
  {
    title: '서비스',
    links: [
      { label: '상품권 팝니다', href: '/board?tab=sell' },
      { label: '상품권 삽니다', href: '/board?tab=buy' },
      { label: '추천업체', href: '/recommended' },
    ],
  },
  {
    title: '도움말',
    links: [
      { label: '이용안내', href: '/guide' },
      { label: '거래 가이드', href: '/guide/trade' },
      { label: '자주묻는질문', href: '/faq' },
      { label: '문의하기', href: '/advertising' },
    ],
  },
  {
    title: '안전거래',
    links: [
      { label: '사기방지 가이드', href: '/fraud' },
      { label: '분쟁조정 안내', href: '/guide/dispute' },
      { label: '이용약관', href: '/terms' },
      { label: '개인정보처리방침', href: '/privacy' },
    ],
  },
];

const TRUST_LINKS = [
  { label: '더치트', href: 'https://thecheat.co.kr/' },
  { label: '국세청 홈택스', href: 'https://teht.hometax.go.kr/' },
  { label: '사이버수사대', href: 'https://ecrm.police.go.kr/minwon/main' },
];

export default function Footer() {
  return (
    <>
    {/* 모바일 하단 사업자 정보 — 데스크탑 풀 푸터는 숨김이라 별도로 표시 (홈·판매글·구매글 등 전 화면) */}
    <footer className="md:hidden border-t border-gray-200 bg-gray-50 px-5 pt-6 pb-24">
      <Link href="/" className="inline-block">
        <Image src="/logo.png" alt="예판상품권" width={612} height={277} className="h-9 w-auto object-contain" />
      </Link>
      <FooterInfoText className="text-[11px] text-gray-400 leading-relaxed mt-3" />
      <p className="text-[10.5px] text-gray-400 mt-3">
        © 2026 예판상품권. All rights reserved.
        <Link href="/admin" className="ml-2 text-gray-300">· 관리자</Link>
      </p>
    </footer>

    <footer className="border-t border-gray-200 bg-gray-50 mt-auto hidden md:block">
      <div className="container-main py-10">
        <div className="grid grid-cols-12 gap-8">

          {/* 좌측: 로고 + 슬로건 + 고객센터 */}
          <div className="col-span-4">
            <Link href="/" className="inline-block">
              <Image src="/logo.png" alt="예판상품권" width={612} height={277}
                className="h-16 w-auto object-contain" />
            </Link>
            <p className="text-[12px] text-gray-500 mt-3 leading-relaxed">
              상품권을 더 똑똑하게.<br/>
              전국 매입 업체와 한 곳에서 비교·거래하세요.
            </p>

            {/* 고객센터 카드 */}
            <div className="mt-5 p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mb-1">
                <Phone size={11} className="text-accent" /> 고객센터
              </div>
              <p className="text-[20px] font-bold text-gray-900 tabular-nums">1599-9687</p>
              <div className="flex items-center gap-1.5 mt-1.5 text-[10.5px] text-gray-400">
                <Clock size={10} /> 평일 10:00 - 17:00 (점심 12:30 - 13:30)
              </div>
            </div>
          </div>

          {/* 가운데: 링크 카테고리 3개 */}
          <div className="col-span-5 grid grid-cols-3 gap-6">
            {SECTIONS.map((section) => (
              <div key={section.title}>
                <h4 className="text-[12px] font-bold text-gray-800 mb-3">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-[12px] text-gray-500 hover:text-accent transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* 우측: 안전 / 신뢰기관 */}
          <div className="col-span-3">
            <h4 className="text-[12px] font-bold text-gray-800 mb-3 flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-accent" /> 신뢰기관
            </h4>
            <ul className="space-y-2">
              {TRUST_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[12px] text-gray-500 hover:text-accent transition-colors"
                  >
                    {link.label} <ExternalLink size={10} className="opacity-60" />
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-5 p-3 bg-blue-50/60 border border-blue-100 rounded-lg">
              <p className="text-[11px] text-blue-900 font-bold mb-0.5">안전거래 안내</p>
              <p className="text-[10.5px] text-gray-600 leading-relaxed">
                상품권 매입률은 업체마다 다르며, 거래 전 반드시 사업자 정보를 확인하세요.
              </p>
            </div>
          </div>
        </div>

        {/* 사업자 정보 + 카피라이트 */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <FooterInfoText className="text-[10.5px] text-gray-400 leading-relaxed max-w-2xl" />
            <div className="text-[10.5px] text-gray-400 whitespace-nowrap">
              © 2026 예판상품권. All rights reserved.
              <Link href="/admin" className="ml-2 text-gray-300 hover:text-accent">· 관리자</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
    </>
  );
}
