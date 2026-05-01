import { MessageCircle, FileText, Scale, AlertTriangle, XCircle } from 'lucide-react';

const buyerDisputes = [
  '상품권 미수령 또는 전달 지연',
  '상품권이 이미 사용되었거나 무효',
  '등록된 금액과 실제 금액 불일치',
  '유효기간 만료된 상품권 수령',
  '상품 설명과 다른 상품 수령',
];

const sellerDisputes = [
  '구매자의 부당한 거래 취소 요청',
  '정상 상품 전달 후 대금 미지급',
  '구매자의 무응답 (연락 두절)',
  '허위 사유로 환불 요청',
  '악의적인 평가 및 리뷰',
];

const steps = [
  { icon: MessageCircle, num: 1, title: '당사자 협의', desc: '업체 전화·문자로\n먼저 협의 시도', color: 'bg-blue-500' },
  { icon: FileText, num: 2, title: '신고 접수', desc: '협의 실패 시\n플랫폼에 신고 접수', color: 'bg-amber-500' },
  { icon: Scale, num: 3, title: '조정 지원', desc: '플랫폼의 제한적\n조정 지원', color: 'bg-purple-500' },
  { icon: AlertTriangle, num: 4, title: '법적 절차 안내', desc: '미해결 시\n법적 절차 직접 진행', color: 'bg-red-500' },
];

export default function DisputeGuidePage() {
  return (
    <div className="max-w-[800px] mx-auto px-5 py-8">
      <h1 className="text-xl font-bold text-zinc-900 mb-2">분쟁 정책</h1>
      <p className="text-[13px] text-zinc-500 mb-6">거래 중 문제 발생 시 해결 절차를 안내해 드립니다.</p>

      {/* Warning Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
        <p className="text-[13px] font-semibold text-amber-800 mb-1">본 플랫폼은 중개 서비스만을 제공하며, 거래 당사자 간 발생하는 법적 분쟁에 대한 책임을 지지 않습니다.</p>
        <p className="text-[12px] text-amber-700">거래로 인한 분쟁은 당사자 간 직접 해결함을 원칙으로 합니다. 플랫폼은 신고 접수 및 제한적인 조정 지원을 할 수 있으나, 이는 법적 구속력을 갖지 않습니다.</p>
      </div>

      {/* Dispute Types */}
      <section className="mb-10">
        <h2 className="text-[15px] font-semibold text-zinc-800 mb-4">분쟁 유형</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <XCircle size={18} className="text-red-500" />
              <h3 className="text-[13px] font-semibold text-zinc-800">구매자 분쟁</h3>
            </div>
            <ul className="space-y-1.5">
              {buyerDisputes.map((d, i) => (
                <li key={i} className="text-[12px] text-zinc-600 flex items-start gap-1.5">
                  <span className="text-zinc-400 mt-0.5">•</span>{d}
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <XCircle size={18} className="text-orange-500" />
              <h3 className="text-[13px] font-semibold text-zinc-800">판매자 분쟁</h3>
            </div>
            <ul className="space-y-1.5">
              {sellerDisputes.map((d, i) => (
                <li key={i} className="text-[12px] text-zinc-600 flex items-start gap-1.5">
                  <span className="text-zinc-400 mt-0.5">•</span>{d}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Resolution Steps */}
      <section className="mb-10">
        <h2 className="text-[15px] font-semibold text-zinc-800 mb-4">분쟁 해결 절차</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.num} className="card p-5 text-center card-hover">
                <Icon size={28} className="mx-auto text-zinc-400 mb-2" />
                <div className={`w-7 h-7 ${step.color} text-white rounded-full flex items-center justify-center text-[12px] font-bold mx-auto mb-2`}>
                  {step.num}
                </div>
                <p className="text-[13px] font-semibold text-zinc-800 mb-1">{step.title}</p>
                <p className="text-[11px] text-zinc-500 whitespace-pre-line">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Detailed Procedure */}
      <section>
        <h2 className="text-[15px] font-semibold text-zinc-800 mb-4">상세 절차</h2>
        <div className="card p-5 space-y-5">
          <div>
            <h3 className="text-[13px] font-semibold text-zinc-800 mb-1">1단계: 당사자 협의 (필수)</h3>
            <p className="text-[12px] text-zinc-600 mb-1">분쟁 발생 시 먼저 업체 전화·문자를 통해 상대방과 협의를 시도해야 합니다.</p>
            <p className="text-[11px] text-zinc-500">협의 기간: 최소 24시간 이상 협의 시도 후 신고 접수 가능</p>
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-zinc-800 mb-1">2단계: 신고 접수</h3>
            <p className="text-[12px] text-zinc-600">당사자 간 협의가 실패한 경우, 플랫폼에 신고를 접수할 수 있습니다. 통화·문자 기록, 입금 내역, 캡처 등 증거 자료를 함께 제출해 주세요.</p>
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-zinc-800 mb-1">3단계: 조정 지원</h3>
            <p className="text-[12px] text-zinc-600">플랫폼은 양측의 주장을 검토하고 제한적인 조정을 지원합니다. 단, 이는 법적 구속력이 없으며, 양측이 합의에 이르지 못할 수 있습니다.</p>
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-zinc-800 mb-1">4단계: 법적 절차 안내</h3>
            <p className="text-[12px] text-zinc-600">조정으로 해결되지 않는 경우, 법적 절차를 진행하셔야 합니다. 사이버수사대(182)에 신고하시거나, 법률 전문가의 조언을 받으시기 바랍니다.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
