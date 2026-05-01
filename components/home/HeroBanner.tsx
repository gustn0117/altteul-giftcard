'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, ShieldCheck, Building2, ShieldAlert } from 'lucide-react';

const TRUST_LINKS = [
  {
    label: '더치트',
    desc: '사기 계좌·번호 조회',
    href: 'https://thecheat.co.kr/',
    Icon: ShieldAlert,
  },
  {
    label: '사업자 조회',
    desc: '국세청 홈택스',
    href: 'https://teht.hometax.go.kr/websquare/websquare.html?w2xPath=/ui/ab/a/a/UTEABAAA13.xml',
    Icon: Building2,
  },
  {
    label: '사이버수사대',
    desc: '경찰청 사이버범죄 신고',
    href: 'https://ecrm.police.go.kr/minwon/main',
    Icon: ShieldCheck,
  },
];

export default function HeroBanner() {
  const [visitorInfo, setVisitorInfo] = useState({ today: 0, total: 0, totalCompanies: 0 });

  useEffect(() => {
    fetch('/api/visitors')
      .then(r => r.json())
      .then(data => setVisitorInfo({
        today: data.today ?? 473,
        total: data.total ?? 40571676,
        totalCompanies: 11862,
      }))
      .catch(() => setVisitorInfo({ today: 473, total: 40571676, totalCompanies: 11862 }));
  }, []);

  const formatNumber = (n: number) => String(n).split('').map((d, i) => (
    <span key={i} className="inline-flex items-center justify-center w-[16px] h-[20px] bg-gray-800 text-white text-[11px] font-bold rounded-sm">{d}</span>
  ));

  return (
    <div className="relative w-full overflow-hidden" style={{ background: 'linear-gradient(135deg, #4a4a4a 0%, #2a2a2a 50%, #1a1a1a 100%)' }}>
      <div className="container-main py-10 md:py-14 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="text-center lg:text-left">
            <h1 className="text-white text-[22px] md:text-[30px] font-bold mb-3 leading-tight">
              전국 최대 규모! 상품권 업체가 모두 한곳에!
            </h1>
            <p className="text-gray-300 text-[12px] md:text-[14px]">
              나에게 맞는 상품권 업체 찾기! 상품권 매입 중개 플랫폼 1위!
            </p>
          </div>

          {/* 신뢰기관 바로가기 */}
          <div className="grid grid-cols-3 gap-2 w-full lg:w-auto lg:grid-cols-3 lg:gap-2.5">
            {TRUST_LINKS.map(({ label, desc, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-1 px-3 py-3 lg:w-[128px] bg-white/10 hover:bg-white/20 border border-white/15 rounded transition-colors"
              >
                <div className="flex items-center gap-1 text-white">
                  <Icon size={14} />
                  <span className="text-[12px] font-bold whitespace-nowrap">{label}</span>
                  <ExternalLink size={10} className="opacity-60 group-hover:opacity-100" />
                </div>
                <span className="text-[10px] text-gray-300 whitespace-nowrap">{desc}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
      {/* Stats bar - 별도 구간 */}
      <div className="border-t border-white/10 bg-black/30 relative z-10">
        <div className="container-main py-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-[11px] text-gray-300">
            <span className="text-gray-400">현재 기준</span>
            <div className="flex items-center gap-1.5">
              <span>오늘 방문자</span>
              <div className="flex gap-px">{formatNumber(visitorInfo.today)}</div>
              <span>명</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>누적 방문자</span>
              <div className="flex gap-px">{formatNumber(visitorInfo.total)}</div>
              <span>명</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>총 등록업체 수</span>
              <div className="flex gap-px">{formatNumber(visitorInfo.totalCompanies)}</div>
              <span>개</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
