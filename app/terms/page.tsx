export default function TermsPage() {
  return (
    <div className="max-w-[800px] mx-auto px-5 py-8">
      <h1 className="text-xl font-bold text-zinc-900 mb-2">이용약관</h1>
      <p className="text-[13px] text-zinc-500 mb-8">최종 수정일: 2026년 3월 1일</p>

      <div className="card p-6 space-y-6 text-[13px] text-zinc-600 leading-relaxed">
        <section>
          <h2 className="text-[14px] font-semibold text-zinc-800 mb-2">제1조 (목적)</h2>
          <p>본 약관은 예판상품권(이하 &quot;회사&quot;)가 운영하는 상품권 거래 중개 플랫폼(이하 &quot;서비스&quot;)의 이용 조건 및 절차, 회원과 회사 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.</p>
        </section>

        <section>
          <h2 className="text-[14px] font-semibold text-zinc-800 mb-2">제2조 (정의)</h2>
          <ul className="list-disc pl-4 space-y-1">
            <li>&quot;서비스&quot;란 회사가 제공하는 온라인 상품권 거래 중개 플랫폼을 말합니다.</li>
            <li>&quot;회원&quot;이란 본 약관에 동의하고 서비스에 가입한 자를 말합니다.</li>
            <li>&quot;업체 회원&quot;이란 사업자등록을 완료하고 상품권 매입 업체로 등록된 회원을 말합니다.</li>
            <li>&quot;게시물&quot;이란 회원이 서비스에 등록한 상품권 구매/판매 글을 말합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[14px] font-semibold text-zinc-800 mb-2">제3조 (약관의 효력 및 변경)</h2>
          <p>본 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다. 회사는 관련 법령을 위반하지 않는 범위에서 약관을 개정할 수 있습니다.</p>
        </section>

        <section>
          <h2 className="text-[14px] font-semibold text-zinc-800 mb-2">제4조 (서비스의 범위)</h2>
          <p>회사는 상품권 거래를 위한 게시글 등록, 채팅 연결, 거래 상태 관리 등 중개 기능을 제공합니다. 결제 대행(에스크로) 서비스는 제공하지 않으며, 거래 대금의 지급 및 상품권 전달은 회원 간 직접 이루어집니다.</p>
        </section>

        <section>
          <h2 className="text-[14px] font-semibold text-zinc-800 mb-2">제5조 (회원가입)</h2>
          <p>회원가입은 이용자가 약관에 동의하고 회원정보를 기입한 후 회사가 이를 승인함으로써 체결됩니다. 회사는 허위 정보를 기재한 경우 가입을 거부하거나 사후에 자격을 제한할 수 있습니다.</p>
        </section>

        <section>
          <h2 className="text-[14px] font-semibold text-zinc-800 mb-2">제6조 (회원의 의무)</h2>
          <ul className="list-disc pl-4 space-y-1">
            <li>회원은 본 약관 및 관련 법령을 준수해야 합니다.</li>
            <li>금전거래, 상품권을 이용한 금융행위는 금지됩니다.</li>
            <li>타인의 정보를 도용하거나 허위 정보를 등록해서는 안 됩니다.</li>
            <li>서비스를 이용하여 불법 행위를 해서는 안 됩니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[14px] font-semibold text-zinc-800 mb-2">제7조 (면책조항)</h2>
          <p>회사는 회원 간의 거래에 대해 어떠한 보증도 하지 않으며, 거래로 인해 발생하는 손해에 대해 책임을 지지 않습니다. 회원은 거래 상대방의 신뢰성을 스스로 판단해야 합니다.</p>
        </section>

        <section>
          <h2 className="text-[14px] font-semibold text-zinc-800 mb-2">제8조 (서비스 이용제한)</h2>
          <p>회사는 회원이 약관을 위반하거나 서비스의 정상적인 운영을 방해하는 경우, 서비스 이용을 제한하거나 회원 자격을 박탈할 수 있습니다.</p>
        </section>

        <section>
          <h2 className="text-[14px] font-semibold text-zinc-800 mb-2">제9조 (관할 법원)</h2>
          <p>서비스 이용과 관련하여 분쟁이 발생한 경우, 관할 법원은 민사소송법에 따른 법원으로 합니다.</p>
        </section>
      </div>
    </div>
  );
}
