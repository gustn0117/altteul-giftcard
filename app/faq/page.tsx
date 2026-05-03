'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  q: string;
  a: string;
}

const faqData: { category: string; items: FAQItem[] }[] = [
  {
    category: '회원가입 및 로그인',
    items: [
      { q: '회원가입은 어떻게 하나요?', a: '홈페이지 우측 상단의 "회원가입" 버튼을 클릭하여 이메일, 비밀번호, 이름, 연락처를 입력하시면 가입이 완료됩니다.' },
      { q: '비밀번호를 잊어버렸어요.', a: '로그인 페이지에서 "비밀번호 찾기"를 클릭하신 후, 가입 시 사용한 이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다.' },
      { q: '업체 회원으로 가입하려면 어떤 서류가 필요한가요?', a: '사업자등록번호, 대표자명, 연락처, 담당 메신저 정보가 필요합니다. 업체등록문의 페이지에서 신청하실 수 있으며, 승인 후 업체 로그인이 가능합니다.' },
    ],
  },
  {
    category: '구매',
    items: [
      { q: '상품권은 어떻게 구매하나요?', a: '메인 페이지의 "팝니다" 탭 또는 "매입업체"에서 원하는 상품권·업체를 확인하신 후, 상세 페이지에 표기된 업체 전화번호로 직접 전화 또는 문자하여 거래 조건을 협의하시면 됩니다.' },
      { q: '예판상품권는 에스크로(결제 대행) 서비스를 제공하나요?', a: '현재 예판상품권는 중개 서비스만을 제공하며, 결제 대행(에스크로) 서비스는 제공하지 않습니다. 거래 대금의 지급 및 상품권 전달은 회원 간 직접 이루어집니다.' },
      { q: '구매 후 상품권은 언제 받을 수 있나요?', a: '상품권 수령 시기는 업체와 합의한 발송 예정일에 따릅니다. 모바일 상품권의 경우 문자·카카오톡 등으로 즉시 전달받을 수 있으며, 택배의 경우 발송 후 1~3일 소요됩니다.' },
    ],
  },
  {
    category: '판매',
    items: [
      { q: '상품권을 판매하고 싶어요.', a: '"팝니다" 탭에서 글쓰기 버튼을 눌러 상품권 종류, 액면가, 판매 가격, 발송 방법 등을 입력하시면 판매글이 등록됩니다.' },
      { q: '판매 대금은 어떻게 받나요?', a: '구매자와 전화 또는 문자로 입금 계좌를 안내하시면, 구매자가 직접 입금합니다. 입금 확인 후 상품권을 전달하시면 됩니다.' },
    ],
  },
  {
    category: '거래 및 안전',
    items: [
      { q: '거래 시 주의할 점이 있나요?', a: '반드시 업체에 표기된 공식 전화번호로 연락해 거래 조건을 명확히 해주세요. 개인 계좌로 입금을 유도하거나 과도한 선입금·보증금을 요구하는 경우 사기 가능성이 높으니 주의하세요. 국세청 홈택스 사업자 조회와 더치트에서 연락처·계좌를 사전 확인하는 것을 권장합니다.' },
      { q: '사기를 당한 것 같아요.', a: '즉시 플랫폼 내 신고 기능을 이용하시고, 사이버수사대(182) 또는 경찰청 사이버범죄 신고 시스템(ecrm.police.go.kr)에 신고해 주세요. 통화 녹음·문자·입금 내역은 중요한 증거가 되므로 반드시 보관하세요.' },
      { q: '거래 분쟁이 발생하면 어떻게 하나요?', a: '먼저 업체 전화·문자로 상대방과 협의를 시도해 주세요. 협의가 되지 않을 경우 플랫폼에 신고 접수하시면, 제한적인 조정 지원을 받으실 수 있습니다.' },
    ],
  },
];

function AccordionItem({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-zinc-100 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-4 px-4 text-left hover:bg-zinc-50 transition-colors">
        <span className="text-[13px] text-zinc-700">Q. {item.q}</span>
        <ChevronDown size={16} className={`text-zinc-400 shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 text-[13px] text-zinc-500 leading-relaxed bg-zinc-50 animate-fade-in">
          {item.a}
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="max-w-[800px] mx-auto px-5 py-8">
      <h1 className="text-xl font-bold text-zinc-900 mb-2">자주 묻는 질문</h1>
      <p className="text-[13px] text-zinc-500 mb-8">예판상품권 이용 시 자주 묻는 질문들을 모았습니다.</p>

      <div className="space-y-6">
        {faqData.map((section) => (
          <div key={section.category}>
            <h2 className="text-[14px] font-semibold text-zinc-800 mb-2 pb-2 border-b-2 border-green-500">{section.category}</h2>
            <div className="card overflow-hidden">
              {section.items.map((item, i) => (
                <AccordionItem key={i} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
