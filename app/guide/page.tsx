'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FileText, ShoppingCart, Tag, MessageCircle, Shield, AlertTriangle, CheckCircle2, ArrowRight, Building2, Users, MapPin } from 'lucide-react';
import { Suspense } from 'react';

type GuideTab = 'user' | 'business' | 'about';

function GuideContent() {
  const searchParams = useSearchParams();
  const tab = (searchParams.get('tab') as GuideTab) || 'user';

  return (
    <div className="container-main py-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[18px] font-bold text-gray-800">이용안내</h1>
        <div className="breadcrumb">
          <Link href="/">HOME</Link> &gt; 이용안내
        </div>
      </div>

      <div className="bg-white border border-gray-200 mb-6">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <Link
            href="/guide?tab=user"
            className={`flex-1 py-3 text-center text-[13px] transition-colors ${
              tab === 'user' ? 'font-bold text-accent border-b-2 border-accent bg-accent/5' : 'text-gray-500 hover:text-accent'
            }`}
          >
            고객 이용안내
          </Link>
          <Link
            href="/guide?tab=business"
            className={`flex-1 py-3 text-center text-[13px] transition-colors ${
              tab === 'business' ? 'font-bold text-accent border-b-2 border-accent bg-accent/5' : 'text-gray-500 hover:text-accent'
            }`}
          >
            업체 이용안내
          </Link>
          <Link
            href="/guide?tab=about"
            className={`flex-1 py-3 text-center text-[13px] transition-colors ${
              tab === 'about' ? 'font-bold text-accent border-b-2 border-accent bg-accent/5' : 'text-gray-500 hover:text-accent'
            }`}
          >
            회사소개
          </Link>
        </div>

        {/* 고객 이용안내 */}
        {tab === 'user' && (
          <div>
            <div className="p-8 text-center bg-gradient-to-b from-gray-50 to-white">
              <div className="flex items-center justify-center gap-6 mb-8">
                <div className="w-[110px] h-[110px] rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-[14px] font-bold text-accent">예판상품권</span>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="w-[90px] h-[90px] rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-[12px] font-bold text-gray-600">이용고객</span>
                  </div>
                  <div className="w-[90px] h-[90px] rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-[12px] font-bold text-gray-600">등록업체</span>
                  </div>
                </div>
              </div>
              <h2 className="text-[22px] font-bold text-gray-800 mb-3">전국 상품권 업체 찾아주는 검색 사이트</h2>
              <p className="text-[13px] text-gray-500 max-w-[600px] mx-auto">
                고객이 직접 상품권 업체를 비교하고, 검색하고, 선택할 수 있도록 서비스를 제공하며
                상담부터 거래까지 한 번에 쉽고 빠르게 진행할 수 있습니다.
              </p>
              <div className="mt-4 inline-block bg-accent/10 border border-accent/20 px-4 py-2 text-[12px] text-gray-700">
                <span className="text-accent font-bold mr-1">TIP</span>
                예판상품권에 광고 중인 등록업체마다 기준과 상품, 할인율이 모두 다르기 때문에 여러 업체와 상담해보시는게 유리합니다.
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 p-4">
                  <h3 className="text-[14px] font-bold mb-3 flex items-center gap-2">
                    <MapPin size={14} className="text-accent" /> 지역별 업체찾기
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['전체', '서울', '경기', '인천', '대전', '대구', '부산', '광주'].map(r => (
                      <Link key={r} href="/board?tab=buy" className="px-3 py-1.5 text-[11px] border border-gray-200 text-gray-600 hover:text-accent hover:border-accent transition-colors">
                        {r}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="border border-gray-200 p-4">
                  <h3 className="text-[14px] font-bold mb-3 flex items-center gap-2">
                    <ShoppingCart size={14} className="text-accent" /> 상품별 업체찾기
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['전체', '신세계', '롯데', '문화상품권', '컬쳐랜드', '스타벅스', '해피머니', '온캐시'].map(t => (
                      <Link key={t} href={`/search?q=${encodeURIComponent(t === '전체' ? '상품권' : t)}&tab=buy`} className="px-3 py-1.5 text-[11px] border border-gray-200 text-gray-600 hover:text-accent hover:border-accent transition-colors">
                        {t}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 업체 이용안내 */}
        {tab === 'business' && (
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                <Building2 size={28} className="text-accent" />
              </div>
              <h2 className="text-[20px] font-bold text-gray-800 mb-2">업체 등록 안내</h2>
              <p className="text-[13px] text-gray-500">전국 최대 상품권 매입 중개 플랫폼에 등록하세요</p>
            </div>

            <div className="max-w-[800px] mx-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { step: 1, title: '제휴 신청', desc: '사업자 정보와 메신저 연락처를 제출합니다.' },
                  { step: 2, title: '담당자 연락', desc: '영업일 기준 1-2일 내 담당자가 연락드립니다.' },
                  { step: 3, title: '등록 완료', desc: '광고 게시 및 상담 문의가 시작됩니다.' },
                ].map(s => (
                  <div key={s.step} className="border border-gray-200 p-4">
                    <div className="w-8 h-8 rounded-full bg-accent text-white text-[12px] font-bold flex items-center justify-center mb-2">{s.step}</div>
                    <p className="text-[13px] font-bold text-gray-800 mb-1">{s.title}</p>
                    <p className="text-[12px] text-gray-500">{s.desc}</p>
                  </div>
                ))}
              </div>

              <div className="border border-gray-200 p-5">
                <h3 className="text-[14px] font-bold mb-3">광고 등급별 혜택</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px] border border-gray-100">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="py-2 px-3 text-left font-medium text-gray-600">등급</th>
                        <th className="py-2 px-3 text-left font-medium text-gray-600">노출 위치</th>
                        <th className="py-2 px-3 text-left font-medium text-gray-600">특전</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 px-3"><span className="badge bg-yellow-50 text-yellow-600">프리미엄</span></td>
                        <td className="py-2 px-3 text-gray-600">메인 상단 + 지역별/상품별 상단</td>
                        <td className="py-2 px-3 text-gray-500">우선 배치 + 카카오톡 노출</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 px-3"><span className="badge bg-blue-50 text-blue-600">스탠다드</span></td>
                        <td className="py-2 px-3 text-gray-600">메인 일반 + 카테고리 목록</td>
                        <td className="py-2 px-3 text-gray-500">일반 노출</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3"><span className="badge bg-zinc-100 text-zinc-500">베이직</span></td>
                        <td className="py-2 px-3 text-gray-600">카테고리 목록 하단</td>
                        <td className="py-2 px-3 text-gray-500">기본 노출</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-accent/5 border border-accent/20 p-6 text-center">
                <h3 className="text-[15px] font-bold mb-2">지금 제휴를 신청하세요</h3>
                <p className="text-[12px] text-gray-600 mb-4">담당자와 1:1 상담을 통해 최적의 플랜을 찾아드립니다.</p>
                <Link href="/register-business" className="btn-accent inline-flex h-10 px-6 text-[13px]">
                  제휴 신청하기 <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 회사소개 */}
        {tab === 'about' && (
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                <Users size={28} className="text-accent" />
              </div>
              <h2 className="text-[20px] font-bold text-gray-800 mb-2">예판상품권 회사소개</h2>
              <p className="text-[13px] text-gray-500">안전하고 빠른 상품권 거래 플랫폼</p>
            </div>

            <div className="max-w-[800px] mx-auto space-y-5">
              <section>
                <h3 className="text-[14px] font-bold mb-2 text-gray-800">플랫폼 소개</h3>
                <p className="text-[13px] text-gray-600 leading-relaxed">
                  예판상품권는 전국의 상품권 매입 업체와 고객을 연결하는 중개 플랫폼입니다.
                  고객이 직접 업체를 비교/선택할 수 있도록 정보를 제공하며, 상담부터 거래까지 한 번에 진행할 수 있도록 지원합니다.
                </p>
              </section>

              <section>
                <h3 className="text-[14px] font-bold mb-2 text-gray-800">주요 서비스</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { title: '지역별 업체 검색', desc: '전국 17개 시도별 업체 검색' },
                    { title: '상품별 업체 검색', desc: '상품권 종류별 맞춤 매입 업체' },
                    { title: '안전거래 중개', desc: '에스크로 기반 안전 거래 지원' },
                    { title: '통합 검색', desc: '상품권·업체·커뮤니티 글 통합 검색' },
                  ].map(s => (
                    <div key={s.title} className="border border-gray-200 p-3">
                      <p className="text-[12px] font-bold text-gray-800">{s.title}</p>
                      <p className="text-[11px] text-gray-500 mt-1">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-[14px] font-bold mb-2 text-gray-800">사업자 정보</h3>
                <div className="border border-gray-200 p-4 text-[12px] text-gray-600 space-y-1.5">
                  <div className="flex"><span className="w-[100px] text-gray-400">사이트명</span><span>예판상품권</span></div>
                  <div className="flex"><span className="w-[100px] text-gray-400">대표자</span><span>운영팀</span></div>
                  <div className="flex"><span className="w-[100px] text-gray-400">사업자번호</span><span>255-62-00840</span></div>
                  <div className="flex"><span className="w-[100px] text-gray-400">통신판매업</span><span>제2025-서울강남-03876호</span></div>
                  <div className="flex"><span className="w-[100px] text-gray-400">주소</span><span>서울특별시 강남구</span></div>
                  <div className="flex"><span className="w-[100px] text-gray-400">고객센터</span><span>1599-9687 (평일 10:00-17:00)</span></div>
                </div>
              </section>

              <div className="bg-accent/5 border border-accent/20 p-5 text-center">
                <p className="text-[12px] text-gray-700">
                  <span className="inline-flex items-center gap-1 text-accent font-bold mr-2">
                    <span className="bg-accent text-white text-[10px] px-1.5 py-0.5 rounded-sm">공지</span>
                  </span>
                  예판상품권는 광고 플랫폼만 제공할 뿐 직접적인 매입 및 중개를 하지 않습니다.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 공통: 구매/판매 가이드 (user 탭에서만) */}
      {tab === 'user' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <section>
              <h2 className="text-[15px] font-bold mb-3 flex items-center gap-2">
                <ShoppingCart size={16} className="text-accent" /> 구매 방법
              </h2>
              <div className="space-y-2">
                {[
                  { step: 1, title: '판매글 찾기', desc: '메인 또는 게시판에서 원하는 상품권을 찾습니다.' },
                  { step: 2, title: '업체 전화번호 확인', desc: '상세 페이지에 표기된 업체 전화번호를 확인합니다.' },
                  { step: 3, title: '전화 또는 문자 연락', desc: '업체 번호로 직접 전화·문자하여 수량·금액·발송 조건을 협의합니다.' },
                  { step: 4, title: '입금 → 수령', desc: '협의된 방식으로 입금 후 상품권을 수령하면 거래 완료.' },
                ].map(item => (
                  <div key={item.step} className="bg-white border border-gray-200 p-3 flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-accent text-white text-[11px] font-bold flex items-center justify-center shrink-0">{item.step}</div>
                    <div>
                      <p className="text-[12px] font-bold text-gray-800">{item.title}</p>
                      <p className="text-[11px] text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-[15px] font-bold mb-3 flex items-center gap-2">
                <Tag size={16} className="text-accent" /> 판매 방법
              </h2>
              <div className="space-y-2">
                {[
                  { step: 1, title: '판매글 작성', desc: '회원가입 없이도 판매글을 등록할 수 있습니다.' },
                  { step: 2, title: '상세 정보 입력', desc: '상품권 종류, 액면가, 판매가, 발송 방법, 연락처를 입력합니다.' },
                  { step: 3, title: '구매자 연락 수신', desc: '글에 기재된 연락처로 전화·문자가 오면 응답합니다.' },
                  { step: 4, title: '협의 후 거래 진행', desc: '전화 또는 문자로 수량·입금 방법을 협의하고 거래를 진행합니다.' },
                ].map(item => (
                  <div key={item.step} className="bg-white border border-gray-200 p-3 flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-700 text-white text-[11px] font-bold flex items-center justify-center shrink-0">{item.step}</div>
                    <div>
                      <p className="text-[12px] font-bold text-gray-800">{item.title}</p>
                      <p className="text-[11px] text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="mb-6">
            <h2 className="text-[15px] font-bold mb-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-accent" /> 안전 거래 수칙
            </h2>
            <div className="bg-white border border-gray-200 p-4 space-y-2">
              {[
                '선입금을 요구하는 경우 사기를 의심하세요',
                '개인정보(주민등록번호, 계좌비밀번호)는 절대 제공하지 마세요',
                '지나치게 높은 할인율은 사기일 가능성이 높습니다',
                '플랫폼 외부(카톡, 텔레그램 등)에서의 직거래는 보호받을 수 없습니다',
                '계약서 없이는 절대 거래하지 마세요',
                '피해 발생 시 경찰 사이버수사대(182)에 즉시 신고하세요',
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 size={13} className="text-accent shrink-0 mt-0.5" />
                  <p className="text-[12px] text-gray-700">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="bg-accent/5 border border-accent/20 p-6 text-center">
            <h3 className="text-[15px] font-bold mb-2">더 궁금한 점이 있으신가요?</h3>
            <p className="text-[12px] text-gray-600 mb-4">자주 묻는 질문(FAQ)이나 고객센터로 문의하세요.</p>
            <div className="flex items-center justify-center gap-2">
              <Link href="/faq" className="btn-secondary h-9 px-4 text-[12px]">
                <MessageCircle size={13} /> 자주 묻는 질문
              </Link>
              <Link href="/fraud" className="btn-accent h-9 px-4 text-[12px]">
                <FileText size={13} /> 사기 방지 가이드 <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function GuidePage() {
  return (
    <Suspense fallback={<div className="container-main py-10 text-center text-gray-400 text-[13px]">불러오는 중...</div>}>
      <GuideContent />
    </Suspense>
  );
}
