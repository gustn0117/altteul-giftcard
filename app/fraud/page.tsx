import { Shield, AlertTriangle, Phone, FileText, Users } from 'lucide-react';

export default function FraudPage() {
  return (
    <div className="max-w-[740px] mx-auto px-5 py-6 animate-fade-in">
      {/* Hero Section */}
      <div className="p-8 text-center mb-6 border border-zinc-800" style={{ background: '#1C1D3E', color: '#FFFFFF' }}>
        <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-4">
          <Shield size={28} className="text-white" />
        </div>
        <h1 className="text-[18px] font-bold mb-1 text-white">사기 방지 가이드</h1>
        <p className="text-zinc-300 text-[13px]">안전한 상품권 거래를 위한 필수 안내사항</p>
      </div>

      <div className="space-y-5">
        {/* Warning */}
        <div className="card bg-red-50 border-red-200 p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <div>
              <h3 className="font-semibold text-[13px] text-red-700 mb-2">주의사항</h3>
              <ul className="text-[12px] text-red-600 space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 shrink-0" />
                  플랫폼 외부에서의 직거래는 사기 피해 시 보호받을 수 없습니다.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 shrink-0" />
                  선입금을 요구하는 경우 사기를 의심하세요.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 shrink-0" />
                  개인정보(주민등록번호, 계좌비밀번호 등)를 요구하는 경우 절대 제공하지 마세요.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 shrink-0" />
                  지나치게 높은 할인율은 사기일 가능성이 높습니다.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Safe Trading Tips */}
        <div>
          <h2 className="section-title">안전 거래 수칙</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { icon: FileText, title: '통화·문자 기록 보관', desc: '업체와 주고받은 통화 녹음·문자를 캡처해 분쟁 시 증거로 활용하세요.', color: 'zinc' },
              { icon: Users, title: '상대방 정보 확인', desc: '더치트(thecheat.co.kr)에서 연락처·계좌 사기 이력을 조회하세요.', color: 'blue' },
              { icon: Shield, title: '사업자 조회', desc: '국세청 홈택스에서 사업자등록번호로 정상 사업자 여부를 확인하세요.', color: 'zinc' },
              { icon: Phone, title: '피해 신고', desc: '사기 피해 시 경찰 사이버수사대(182)에 즉시 신고하세요.', color: 'blue' },
            ].map((item) => (
              <div key={item.title} className="card card-hover p-4 flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  item.color === 'zinc' ? 'bg-zinc-100 text-zinc-900' : 'bg-blue-50 text-blue-600'
                }`}>
                  <item.icon size={16} />
                </div>
                <div>
                  <h4 className="font-medium text-[13px] text-zinc-900 mb-0.5">{item.title}</h4>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scam Patterns */}
        <div>
          <h2 className="section-title">주요 사기 유형</h2>
          <div className="card overflow-hidden">
            {[
              { title: '선입금 사기', desc: '상품권을 보내기 전에 먼저 돈을 보내달라고 요구합니다.' },
              { title: '3자 사기', desc: '제3자의 계좌로 입금을 유도하여 중간에서 가로채는 수법입니다.' },
              { title: '위조 상품권', desc: '사용 불가능한 위조/도용 상품권을 전달합니다.' },
              { title: '피싱 링크', desc: '가짜 사이트 링크를 보내 개인정보를 탈취합니다.' },
              { title: '계약서 위변조', desc: '계약 내용을 임의로 변경하여 불리한 조건을 적용합니다.' },
            ].map((item, idx) => (
              <div key={item.title} className="flex items-start gap-3 p-4 border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 transition-colors">
                <div className="w-7 h-7 bg-red-50 rounded flex items-center justify-center shrink-0">
                  <span className="text-red-500 font-semibold text-[12px]">{idx + 1}</span>
                </div>
                <div>
                  <h4 className="font-medium text-[13px] text-zinc-900">{item.title}</h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="card bg-blue-50 border-blue-100 p-6 text-center">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Phone size={18} className="text-blue-600" />
          </div>
          <p className="text-[12px] text-zinc-600 mb-1 font-medium">사기 피해 신고 및 상담</p>
          <p className="text-2xl font-semibold text-zinc-900">182</p>
          <p className="text-[11px] text-zinc-500 mt-1">경찰청 사이버수사대</p>
        </div>
      </div>
    </div>
  );
}
