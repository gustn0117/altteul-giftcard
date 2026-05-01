export default function PrivacyPage() {
  return (
    <div className="max-w-[800px] mx-auto px-5 py-8">
      <h1 className="text-xl font-bold text-zinc-900 mb-2">개인정보처리방침</h1>
      <p className="text-[13px] text-zinc-500 mb-8">최종 수정일: 2026년 3월 1일</p>

      <div className="card p-6 space-y-6 text-[13px] text-zinc-600 leading-relaxed">
        <section>
          <h2 className="text-[14px] font-semibold text-zinc-800 mb-2">1. 수집하는 개인정보 항목</h2>
          <p className="mb-2">회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.</p>
          <ul className="list-disc pl-4 space-y-1">
            <li><strong>필수항목:</strong> 이메일, 비밀번호, 이름, 연락처</li>
            <li><strong>업체 회원 추가항목:</strong> 사업자등록번호, 대표자명, 사업장 주소, 메신저 정보</li>
            <li><strong>자동 수집항목:</strong> 접속 IP, 접속 시간, 서비스 이용 기록</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[14px] font-semibold text-zinc-800 mb-2">2. 개인정보의 수집 및 이용 목적</h2>
          <ul className="list-disc pl-4 space-y-1">
            <li>회원 가입 및 관리</li>
            <li>서비스 제공 및 거래 중개</li>
            <li>분쟁 해결 및 신고 처리</li>
            <li>서비스 개선 및 통계 분석</li>
            <li>부정 이용 방지</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[14px] font-semibold text-zinc-800 mb-2">3. 개인정보의 보유 및 이용 기간</h2>
          <p>회원 탈퇴 시 즉시 파기하는 것을 원칙으로 합니다. 단, 관련 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간 동안 보관합니다.</p>
          <ul className="list-disc pl-4 space-y-1 mt-2">
            <li>계약 또는 청약철회에 관한 기록: 5년</li>
            <li>대금 결제 및 재화 등의 공급에 관한 기록: 5년</li>
            <li>소비자 불만 또는 분쟁 처리에 관한 기록: 3년</li>
            <li>접속 기록: 3개월</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[14px] font-semibold text-zinc-800 mb-2">4. 개인정보의 제3자 제공</h2>
          <p>회사는 원칙적으로 회원의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.</p>
          <ul className="list-disc pl-4 space-y-1 mt-2">
            <li>회원의 사전 동의가 있는 경우</li>
            <li>법령의 규정에 따르거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[14px] font-semibold text-zinc-800 mb-2">5. 개인정보의 파기 절차 및 방법</h2>
          <p>전자적 파일 형태의 정보는 복구 및 재생되지 않도록 기술적 방법을 사용하여 완전히 삭제하며, 종이에 출력된 개인정보는 분쇄하거나 소각합니다.</p>
        </section>

        <section>
          <h2 className="text-[14px] font-semibold text-zinc-800 mb-2">6. 이용자 및 법정대리인의 권리와 행사 방법</h2>
          <p>이용자는 언제든지 자신의 개인정보를 조회하거나 수정할 수 있으며, 회원 탈퇴를 통해 개인정보 삭제를 요청할 수 있습니다.</p>
        </section>

        <section>
          <h2 className="text-[14px] font-semibold text-zinc-800 mb-2">7. 개인정보 보호책임자</h2>
          <ul className="list-none space-y-1">
            <li>담당자: 개인정보보호팀</li>
            <li>이메일: privacy@altteul-giftcard.co.kr</li>
            <li>전화: 1234-5678</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[14px] font-semibold text-zinc-800 mb-2">8. 개인정보처리방침 변경</h2>
          <p>본 개인정보처리방침은 법령, 정책 또는 보안 기술의 변경에 따라 내용이 추가, 삭제 및 수정될 수 있으며, 변경 시 최소 7일 전에 공지사항을 통해 안내합니다.</p>
        </section>
      </div>
    </div>
  );
}
