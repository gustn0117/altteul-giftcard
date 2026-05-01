'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Smartphone, BarChart3, Shield, Clock, CheckCircle2, AlertCircle, Megaphone, ChevronDown } from 'lucide-react';

const AD_PRODUCTS = [
  {
    id: 'hero_banner',
    name: '메인 히어로 배너',
    size: '1140 x 200 px',
    position: '메인 페이지 최상단',
    price: 500000,
    unit: '월',
    popular: true,
    features: ['최대 노출량', '전체 유저 도달', '브랜드 인지도 극대화'],
    desc: '사이트 방문 시 가장 먼저 보이는 프리미엄 위치. 전체 사용자 100%에 노출됩니다.',
  },
  {
    id: 'main_top',
    name: '메인 상단 배너',
    size: '1140 x 90 px',
    position: '히어로 배너 아래',
    price: 300000,
    unit: '월',
    popular: false,
    features: ['높은 클릭률', '자연스러운 노출'],
    desc: '게시글 목록 바로 위에 위치하여 상품 탐색 전 자연스럽게 노출됩니다.',
  },
  {
    id: 'board_top',
    name: '게시판 상단 배너',
    size: '960 x 90 px',
    position: '삽니다/팝니다 게시판 상단',
    price: 250000,
    unit: '월',
    popular: false,
    features: ['구매 의향 높은 유저', '타겟 마케팅'],
    desc: '거래글을 적극적으로 탐색하는 유저에게 직접 노출되는 타겟 상품입니다.',
  },
  {
    id: 'detail_bottom',
    name: '게시글 상세 하단',
    size: '740 x 90 px',
    position: '개별 게시글 하단',
    price: 200000,
    unit: '월',
    popular: false,
    features: ['구매 결정 단계 노출', '높은 전환율'],
    desc: '상품 상세 정보를 확인한 유저에게 노출되는 고효율 광고 위치입니다.',
  },
  {
    id: 'footer_banner',
    name: '푸터 상단 배너',
    size: '1140 x 80 px',
    position: '페이지 하단 푸터 위',
    price: 150000,
    unit: '월',
    popular: false,
    features: ['전 페이지 노출', '반복 인지 효과'],
    desc: '모든 페이지 하단에 지속 노출. 반복 인지를 통한 브랜드 각인에 유리합니다.',
  },
  {
    id: 'popup',
    name: '팝업 광고',
    size: '400 x 500 px',
    position: '사이트 접속 시 화면 중앙',
    price: 400000,
    unit: '월',
    popular: false,
    features: ['강제 노출', '이벤트/프로모션'],
    desc: '신규 방문자에게 풀스크린 팝업으로 노출되어 이벤트·프로모션에 최적화됩니다.',
  },
  {
    id: 'premium_buyer',
    name: '프리미엄 구매 업체',
    size: '카드형',
    position: '메인 / 게시판 삽니다 탭',
    price: 100000,
    unit: '월~',
    popular: true,
    features: ['등급별 노출 우선순위', '전용 상세 페이지', '연락처 노출'],
    desc: '구매 업체 전용 프리미엄 카드. 등급(프리미엄/스탠다드/베이직)별 차등 노출됩니다.',
  },
];

const BUDGET_OPTIONS = [
  '100만원 이하',
  '100~300만원',
  '300~500만원',
  '500만원 이상',
  '상담 후 결정',
];

const FAQS = [
  {
    q: '광고 집행까지 얼마나 걸리나요?',
    a: '문의 접수 후 24시간 이내 담당자가 연락드리며, 소재/위치 확정 후 평균 2~3영업일 이내 게재됩니다.',
  },
  {
    q: '최소 계약 기간이 있나요?',
    a: '모든 상품은 월 단위 계약이 가능합니다. 3개월 이상 장기 계약 시 5~15% 할인 혜택이 적용됩니다.',
  },
  {
    q: '광고 성과 리포트를 받을 수 있나요?',
    a: '네. 노출수·클릭수·CTR 등 월간 리포트를 제공하며, 프리미엄 상품은 실시간 대시보드로 열람 가능합니다.',
  },
  {
    q: '광고 소재는 직접 제작해야 하나요?',
    a: '기본적으로 광고주가 제공하시지만, 디자인 리소스가 없는 경우 소정의 비용으로 제작 대행이 가능합니다.',
  },
  {
    q: '게재가 거부되는 경우가 있나요?',
    a: '불법 거래 유도·허위 과장 광고·경쟁 플랫폼 광고는 심의상 거부될 수 있으며, 거부 시 결제는 전액 환불됩니다.',
  },
];

export default function AdvertisingPage() {
  const [form, setForm] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    ad_type: '',
    budget: '',
    message: '',
    agree: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<null | { ok: boolean; msg: string }>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    if (!form.agree) {
      setResult({ ok: false, msg: '개인정보 수집·이용에 동의해주세요.' });
      return;
    }
    if (!form.name.trim() || !form.phone.trim() || !form.message.trim()) {
      setResult({ ok: false, msg: '이름·연락처·문의 내용은 필수입니다.' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/ad-inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          company: form.company,
          phone: form.phone,
          email: form.email,
          ad_type: form.ad_type,
          budget: form.budget,
          message: form.message,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '전송 실패');
      setResult({ ok: true, msg: '문의가 접수되었습니다. 24시간 내 담당자가 연락드리겠습니다.' });
      setForm({ name: '', company: '', phone: '', email: '', ad_type: '', budget: '', message: '', agree: false });
    } catch (err) {
      setResult({ ok: false, msg: err instanceof Error ? err.message : '전송에 실패했습니다.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[960px] mx-auto px-5 py-8">
      {/* Hero */}
      <div className="bg-zinc-900 rounded-lg px-8 py-12 mb-8 text-center">
        <div className="inline-flex items-center gap-2 bg-white/5 text-zinc-300 text-[11px] tracking-wider uppercase px-3 py-1 rounded-full mb-4">
          <Megaphone size={12} /> Advertising
        </div>
        <h1 className="text-white text-[24px] md:text-[32px] font-semibold mb-3 leading-tight">광고 문의</h1>
        <p className="text-zinc-400 text-[14px] max-w-lg mx-auto leading-relaxed mb-6">
          상품권 거래에 특화된 실구매 유저에게 직접 도달하는 광고 상품을 안내해 드립니다.<br className="hidden md:block" />
          맞춤 견적 및 패키지 할인도 제공됩니다.
        </p>
        <a href="#inquiry" className="btn-primary inline-flex h-10 px-6 text-[13px]">
          지금 문의하기 <ArrowRight size={14} />
        </a>
      </div>

      {/* Quick summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        {[
          { label: '광고 상품', value: '7종' },
          { label: '최소 요금', value: '10만원~' },
          { label: '평균 게재', value: '2~3일' },
          { label: '계약 단위', value: '월' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className="text-[11px] text-zinc-400 mb-1">{s.label}</p>
            <p className="text-[16px] font-bold text-zinc-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Products */}
      <div className="mb-10">
        <div className="text-center mb-6">
          <h2 className="text-[20px] font-semibold text-zinc-900 mb-1">광고 상품 안내</h2>
          <p className="text-[13px] text-zinc-500">위치와 예산에 맞는 광고 상품을 선택하세요.</p>
        </div>
        <div className="space-y-3">
          {AD_PRODUCTS.map(p => (
            <div key={p.id} className={`card overflow-hidden ${p.popular ? 'border-accent' : ''}`}>
              {p.popular && (
                <div className="bg-accent text-white text-[10px] font-medium text-center py-1 tracking-wider uppercase">인기 상품</div>
              )}
              <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-semibold text-zinc-900 mb-1">{p.name}</h3>
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <span className="badge bg-zinc-100 text-zinc-500">{p.size}</span>
                    <span className="badge bg-zinc-100 text-zinc-500">{p.position}</span>
                  </div>
                  <p className="text-[12px] text-zinc-500 leading-relaxed mb-2">{p.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {p.features.map(f => (
                      <span key={f} className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
                        <CheckCircle2 size={11} className="text-accent shrink-0" /> {f}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right md:shrink-0 md:w-32">
                  <p className="text-[18px] font-bold text-zinc-900 whitespace-nowrap">
                    {p.price.toLocaleString()}
                    <span className="text-[11px] font-normal text-zinc-400">원</span>
                  </p>
                  <p className="text-[11px] text-zinc-400">/ {p.unit}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div className="mb-10">
        <h2 className="text-[18px] font-semibold text-zinc-900 mb-4 text-center">광고주 혜택</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="card p-5 text-center">
            <Shield size={20} className="mx-auto mb-3 text-accent" />
            <h4 className="text-[13px] font-semibold mb-1">안전한 플랫폼</h4>
            <p className="text-[11px] text-zinc-500 leading-relaxed">계약서 기반 거래 시스템으로 신뢰도 높은 사용자층이 형성되어 있습니다.</p>
          </div>
          <div className="card p-5 text-center">
            <BarChart3 size={20} className="mx-auto mb-3 text-accent" />
            <h4 className="text-[13px] font-semibold mb-1">실시간 성과 리포트</h4>
            <p className="text-[11px] text-zinc-500 leading-relaxed">노출수·클릭수·CTR 등 광고 성과를 실시간으로 확인하실 수 있습니다.</p>
          </div>
          <div className="card p-5 text-center">
            <Clock size={20} className="mx-auto mb-3 text-accent" />
            <h4 className="text-[13px] font-semibold mb-1">유연한 계약 기간</h4>
            <p className="text-[11px] text-zinc-500 leading-relaxed">월 단위 계약으로 부담 없이 시작, 성과에 따라 연장·할인이 가능합니다.</p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="mb-10">
        <h2 className="text-[18px] font-semibold text-zinc-900 mb-4 text-center">자주 묻는 질문</h2>
        <div className="card overflow-hidden">
          {FAQS.map((f, i) => {
            const open = openFaq === i;
            return (
              <div key={f.q} className={`border-b border-zinc-100 last:border-b-0`}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-zinc-50 transition-colors"
                >
                  <span className="text-[13px] font-semibold text-zinc-800 flex-1">Q. {f.q}</span>
                  <ChevronDown size={14} className={`text-zinc-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && (
                  <div className="px-5 pb-4 text-[12px] text-zinc-600 leading-relaxed bg-zinc-50/50">
                    A. {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Inquiry Form */}
      <div id="inquiry" className="card p-6 md:p-8 mb-10 scroll-mt-20">
        <div className="text-center mb-6">
          <h2 className="text-[18px] font-semibold text-zinc-900 mb-1">광고 집행 문의</h2>
          <p className="text-[12px] text-zinc-500">담당자가 영업일 기준 24시간 내 연락드립니다.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">담당자 이름 *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                maxLength={50}
                required
                className="input h-10"
                placeholder="홍길동"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">회사/업체명</label>
              <input
                type="text"
                value={form.company}
                onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
                maxLength={100}
                className="input h-10"
                placeholder="(선택)"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">연락처 *</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                maxLength={20}
                required
                className="input h-10"
                placeholder="010-0000-0000"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">이메일</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                maxLength={100}
                className="input h-10"
                placeholder="(선택)"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">관심 광고 상품</label>
              <select
                value={form.ad_type}
                onChange={e => setForm(p => ({ ...p, ad_type: e.target.value }))}
                className="input h-10"
              >
                <option value="">선택하세요</option>
                {AD_PRODUCTS.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
                <option value="기타/패키지">기타 / 맞춤 패키지</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">월 예산</label>
              <select
                value={form.budget}
                onChange={e => setForm(p => ({ ...p, budget: e.target.value }))}
                className="input h-10"
              >
                <option value="">선택하세요</option>
                {BUDGET_OPTIONS.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-600 mb-1">문의 내용 *</label>
            <textarea
              value={form.message}
              onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              rows={5}
              maxLength={2000}
              required
              className="input"
              placeholder="원하시는 광고 기간, 집행 목표, 소재 유무 등을 자유롭게 적어주세요."
              style={{ height: 'auto', minHeight: '120px', padding: '10px 12px' }}
            />
            <p className="text-[10px] text-zinc-400 text-right mt-1">{form.message.length}/2000</p>
          </div>

          <label className="flex items-start gap-2 text-[12px] text-zinc-600 cursor-pointer">
            <input
              type="checkbox"
              checked={form.agree}
              onChange={e => setForm(p => ({ ...p, agree: e.target.checked }))}
              className="mt-0.5 w-3.5 h-3.5"
            />
            <span>
              개인정보 수집·이용에 동의합니다. (수집 항목: 이름·연락처·이메일. 이용 목적: 광고 문의 응대. 보유 기간: 3년)
            </span>
          </label>

          {result && (
            <div className={`flex items-start gap-2 p-3 text-[12px] rounded ${
              result.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
            }`}>
              {result.ok ? <CheckCircle2 size={14} className="mt-0.5 shrink-0" /> : <AlertCircle size={14} className="mt-0.5 shrink-0" />}
              <span>{result.msg}</span>
            </div>
          )}

          <div className="flex items-center justify-center gap-3 pt-2">
            <button type="submit" disabled={submitting} className="btn-primary h-11 px-8 text-[13px] disabled:opacity-60">
              {submitting ? '전송 중...' : '문의 보내기'}
            </button>
            <a href="tel:1234-5678" className="btn-secondary h-11 px-5 text-[13px]">
              <Smartphone size={14} /> 1234-5678
            </a>
          </div>
        </form>
      </div>

      {/* Related Links */}
      <div className="text-center text-[12px] text-zinc-500">
        이미 업체 계정이 있으시다면{' '}
        <Link href="/login" className="text-accent font-medium hover:underline">로그인</Link>
        {' '}후 대시보드에서 광고를 관리하실 수 있습니다.
        {' · '}
        <Link href="/register-business" className="text-accent font-medium hover:underline">신규 업체 등록</Link>
      </div>
    </div>
  );
}
