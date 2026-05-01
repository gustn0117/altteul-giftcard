import { Search, Star, Phone, CheckCircle } from 'lucide-react';

const buySteps = [
  { icon: Search, num: 1, title: '상품 검색', desc: '원하는 상품권을\n카테고리에서 검색' },
  { icon: Star, num: 2, title: '업체 선택', desc: '평점과 리뷰를 확인하고\n신뢰할 수 있는 업체 선택' },
  { icon: Phone, num: 3, title: '전화·문자 상담', desc: '업체 전화번호로\n직접 연락해 조건 협의' },
  { icon: CheckCircle, num: 4, title: '거래 진행', desc: '합의된 조건에 따라\n직접 거래 진행' },
];

const sellSteps = [
  { icon: Search, num: 1, title: '판매글 등록', desc: '팝니다 탭에서\n판매글 작성' },
  { icon: Phone, num: 2, title: '구매자 연락 수신', desc: '판매글 연락처로 온\n전화·문자에 응답' },
  { icon: Star, num: 3, title: '조건 협의', desc: '가격, 수량, 발송일\n등 조건 합의' },
  { icon: CheckCircle, num: 4, title: '거래 완료', desc: '입금 확인 후\n상품권 전달' },
];

export default function TradeGuidePage() {
  return (
    <div className="max-w-[800px] mx-auto px-5 py-8">
      <h1 className="text-xl font-bold text-zinc-900 mb-2">구매 및 판매 방법</h1>
      <p className="text-[13px] text-zinc-500 mb-6">알뜰상품권의 거래 방법을 안내해 드립니다.</p>

      {/* Warning Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
        <p className="text-[13px] font-semibold text-amber-800 mb-2">본 플랫폼은 중개 서비스만을 제공하며, 거래 당사자 간 발생하는 법적 분쟁에 대한 책임을 지지 않습니다.</p>
        <p className="text-[12px] text-amber-700 mb-2">알뜰상품권는 상품권 거래를 위한 게시글 등록·업체 정보 노출 등 중개 기능만을 제공합니다. 결제 대행(에스크로) 서비스는 제공하지 않으며, 거래 대금의 지급 및 상품권 전달은 회원·업체 간 직접 이루어집니다.</p>
        <ul className="text-[12px] text-amber-700 list-disc pl-4 space-y-0.5">
          <li>금전거래 금지</li>
          <li>상품권을 이용한 금융행위 금지</li>
          <li>반복 시 제재</li>
        </ul>
      </div>

      {/* Buy Steps */}
      <section className="mb-10">
        <h2 className="text-[15px] font-semibold text-zinc-800 mb-4 flex items-center gap-2">
          <span className="text-lg">🛒</span> 구매 방법
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {buySteps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.num} className="card p-5 text-center card-hover">
                <Icon size={28} className="mx-auto text-zinc-400 mb-2" />
                <div className="w-7 h-7 bg-green-500 text-white rounded-full flex items-center justify-center text-[12px] font-bold mx-auto mb-2">{step.num}</div>
                <p className="text-[13px] font-semibold text-zinc-800 mb-1">{step.title}</p>
                <p className="text-[11px] text-zinc-500 whitespace-pre-line">{step.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="card p-5 mt-4">
          <h3 className="text-[13px] font-semibold text-zinc-800 mb-3">구매 시 주의사항</h3>
          <div className="space-y-2.5">
            {[
              { title: '업체 정보 확인:', desc: '프리미엄 업체, 평점, 리뷰를 꼼꼼히 확인하고 신뢰할 수 있는 업체를 선택하세요.' },
              { title: '사업자 조회:', desc: '국세청 홈택스에서 정상 사업자인지 확인하고, 더치트에서 연락처·계좌 사기 이력을 조회하세요.' },
              { title: '전화·문자로 상세 확인:', desc: '상품권 종류·금액·유효기간·사용 가능 여부 등을 업체 전화번호로 직접 확인하세요.' },
              { title: '거래 조건 명확히 합의:', desc: '결제 방법·상품권 전달 방식 등 모든 조건을 전화 또는 문자로 명확히 합의한 후 거래하세요.' },
              { title: '상품권 즉시 확인:', desc: '수령한 상품권의 정상 작동 여부를 즉시 확인하세요.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-2">
                <CheckCircle size={14} className="text-green-500 shrink-0 mt-0.5" />
                <p className="text-[12px] text-zinc-600"><strong>{item.title}</strong> {item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sell Steps */}
      <section>
        <h2 className="text-[15px] font-semibold text-zinc-800 mb-4 flex items-center gap-2">
          <span className="text-lg">💰</span> 판매 방법
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {sellSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.num} className="card p-5 text-center card-hover">
                <Icon size={28} className="mx-auto text-zinc-400 mb-2" />
                <div className="w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center text-[12px] font-bold mx-auto mb-2">{step.num}</div>
                <p className="text-[13px] font-semibold text-zinc-800 mb-1">{step.title}</p>
                <p className="text-[11px] text-zinc-500 whitespace-pre-line">{step.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="card p-5 mt-4">
          <h3 className="text-[13px] font-semibold text-zinc-800 mb-3">판매 시 주의사항</h3>
          <div className="space-y-2.5">
            {[
              { title: '정확한 정보 기재:', desc: '상품권 종류, 액면가, 유효기간, 본인 연락처를 정확히 기재해 주세요.' },
              { title: '입금 확인 후 전달:', desc: '반드시 입금을 확인한 후 상품권을 전달하세요.' },
              { title: '연락 기록 보관:', desc: '거래 협의 내용은 문자로 남겨 분쟁 시 증거로 활용할 수 있도록 하세요.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-2">
                <CheckCircle size={14} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[12px] text-zinc-600"><strong>{item.title}</strong> {item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
