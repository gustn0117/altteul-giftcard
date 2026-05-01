'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, CheckCircle2, AlertCircle, MessageCircle, Phone, Clock } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: '',
    agree: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<null | { ok: boolean; msg: string }>(null);

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
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          subject: form.subject,
          message: form.message,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '전송 실패');
      setResult({ ok: true, msg: '문의가 접수되었습니다. 영업일 기준 24시간 내 연락드리겠습니다.' });
      setForm({ name: '', phone: '', email: '', subject: '', message: '', agree: false });
    } catch (err) {
      setResult({ ok: false, msg: err instanceof Error ? err.message : '전송에 실패했습니다.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[760px] mx-auto px-5 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[18px] font-bold text-gray-800">1:1 문의</h1>
        <div className="breadcrumb">
          <Link href="/">HOME</Link> &gt; 고객센터 &gt; 1:1 문의
        </div>
      </div>

      {/* 안내 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <div className="card p-4">
          <Phone size={18} className="text-accent mb-2" />
          <p className="text-[12px] font-bold text-gray-800 mb-0.5">전화 상담</p>
          <p className="text-[11px] text-gray-500">평일 10:00 ~ 17:00</p>
        </div>
        <div className="card p-4">
          <MessageCircle size={18} className="text-accent mb-2" />
          <p className="text-[12px] font-bold text-gray-800 mb-0.5">1:1 문의</p>
          <p className="text-[11px] text-gray-500">아래 폼으로 접수 가능</p>
        </div>
        <div className="card p-4">
          <Clock size={18} className="text-accent mb-2" />
          <p className="text-[12px] font-bold text-gray-800 mb-0.5">응답 시간</p>
          <p className="text-[11px] text-gray-500">영업일 기준 24시간 이내</p>
        </div>
      </div>

      {/* 폼 */}
      <div className="card p-6 md:p-8 mb-6">
        <div className="mb-5">
          <h2 className="text-[16px] font-semibold text-gray-900 mb-1">문의 내용을 작성해주세요</h2>
          <p className="text-[12px] text-gray-500">자세하게 작성해주실수록 빠른 답변이 가능합니다.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">이름 *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                maxLength={50}
                required
                className="input h-10"
                placeholder="홍길동"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">연락처 *</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                maxLength={20}
                required
                className="input h-10"
                placeholder="010-0000-0000"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">이메일</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                maxLength={100}
                className="input h-10"
                placeholder="(선택)"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">문의 분류</label>
              <select
                value={form.subject}
                onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                className="input h-10"
              >
                <option value="">선택하세요</option>
                <option value="거래 관련">거래 관련</option>
                <option value="회원/계정">회원/계정</option>
                <option value="신고/분쟁">신고/분쟁</option>
                <option value="버그/오류">버그/오류 신고</option>
                <option value="제휴/광고">제휴/광고</option>
                <option value="기타">기타</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">문의 내용 *</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
              rows={6}
              maxLength={2000}
              required
              className="input"
              placeholder="문의 내용을 자세히 작성해주세요."
              style={{ height: 'auto', minHeight: '140px', padding: '10px 12px' }}
            />
            <p className="text-[10px] text-gray-400 text-right mt-1">{form.message.length}/2000</p>
          </div>

          <label className="flex items-start gap-2 text-[12px] text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={form.agree}
              onChange={(e) => setForm((p) => ({ ...p, agree: e.target.checked }))}
              className="mt-0.5 w-3.5 h-3.5"
            />
            <span>
              개인정보 수집·이용에 동의합니다. (수집 항목: 이름·연락처·이메일. 이용 목적: 문의 응대. 보유 기간: 3년)
            </span>
          </label>

          {result && (
            <div
              className={`flex items-start gap-2 p-3 text-[12px] rounded ${
                result.ok
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-600 border border-red-200'
              }`}
            >
              {result.ok ? (
                <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
              ) : (
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
              )}
              <span>{result.msg}</span>
            </div>
          )}

          <div className="flex items-center justify-end pt-2">
            <button type="submit" disabled={submitting} className="btn-primary h-11 px-8 text-[13px] disabled:opacity-60">
              {submitting ? '전송 중...' : '문의 보내기'}
              <ArrowRight size={14} />
            </button>
          </div>
        </form>
      </div>

      <p className="text-[12px] text-gray-500 text-center">
        자주 묻는 질문은{' '}
        <Link href="/faq" className="text-accent font-bold hover:underline">
          FAQ
        </Link>
        에서 먼저 확인해보세요.
      </p>
    </div>
  );
}
