'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Eye, RotateCcw } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';

interface HeroPromo {
  eyebrow: string;
  headline: string;
  sub: string;
  cta_text: string;
  cta_link: string;
  image_url: string;
}

const DEFAULT: HeroPromo = {
  eyebrow: 'No. 1 Giftcard Marketplace',
  headline: '상품권, 가장 높은 가격에.',
  sub: '검증된 매입 업체와 즉시 매칭. 비교는 한 곳에서.',
  cta_text: '매입률 비교하기',
  cta_link: '/recommended',
  image_url: '',
};

export default function AdminHeroPromoPage() {
  const [form, setForm] = useState<HeroPromo>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/hero-promo')
      .then(r => r.json())
      .then(data => {
        setForm({
          eyebrow: data?.eyebrow ?? DEFAULT.eyebrow,
          headline: data?.headline ?? DEFAULT.headline,
          sub: data?.sub ?? DEFAULT.sub,
          cta_text: data?.cta_text ?? DEFAULT.cta_text,
          cta_link: data?.cta_link ?? DEFAULT.cta_link,
          image_url: data?.image_url ?? '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const change = (k: keyof HeroPromo, v: string) => {
    setForm(p => ({ ...p, [k]: v }));
    setSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.headline.trim()) return alert('헤드라인은 필수입니다.');
    setSaving(true);
    try {
      const res = await fetch('/api/admin/hero-promo', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '저장 실패');
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert(err instanceof Error ? err.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!confirm('기본값으로 되돌리시겠습니까? (저장 전까지 적용 안 됨)')) return;
    setForm(DEFAULT);
    setSaved(false);
  };

  return (
    <div className="container-main py-6">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/admin" className="text-[12px] text-gray-500 hover:text-accent flex items-center gap-1"><ArrowLeft size={12}/>운영자홈</Link>
        <h1 className="text-[18px] font-bold text-gray-800 flex items-center gap-2">
          <Eye size={18} className="text-accent" /> 메인 홍보 박스 편집
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4">
        {/* 좌: 편집 폼 */}
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          {loading ? (
            <p className="text-center py-12 text-gray-400 text-[13px]">불러오는 중...</p>
          ) : (
            <>
              <Field label="작은 라벨 (Eyebrow)" hint="제목 위쪽에 작게 표시되는 텍스트. 영문 권장.">
                <input type="text" value={form.eyebrow} onChange={(e) => change('eyebrow', e.target.value)}
                  placeholder="예: No. 1 Giftcard Marketplace" className="auth-input" />
              </Field>

              <Field label="헤드라인 *" hint="가장 큰 메인 카피. 짧고 임팩트 있게.">
                <input type="text" value={form.headline} onChange={(e) => change('headline', e.target.value)}
                  placeholder="예: 상품권, 가장 높은 가격에." className="auth-input" required />
              </Field>

              <Field label="서브 카피" hint="헤드라인 아래 보조 설명.">
                <textarea value={form.sub} onChange={(e) => change('sub', e.target.value)}
                  rows={2} maxLength={120}
                  placeholder="예: 검증된 매입 업체와 즉시 매칭. 비교는 한 곳에서."
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-[13px] resize-none focus:outline-none focus:border-accent focus:ring-3 focus:ring-blue-100" />
                <p className="text-[10.5px] text-gray-400 mt-1">{(form.sub || '').length}/120자</p>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="버튼 텍스트">
                  <input type="text" value={form.cta_text} onChange={(e) => change('cta_text', e.target.value)}
                    placeholder="예: 매입률 비교하기" className="auth-input" />
                </Field>
                <Field label="버튼 링크">
                  <input type="text" value={form.cta_link} onChange={(e) => change('cta_link', e.target.value)}
                    placeholder="예: /recommended" className="auth-input" />
                </Field>
              </div>

              <ImageUploader
                value={form.image_url}
                onChange={(url) => change('image_url', url)}
                folder="hero-promo"
                label="배경 이미지 (선택)"
                hint="업로드 시 Supabase Storage(altteul-giftcard 버킷)에 자동 저장됩니다. 비워두면 흰 배경 + 그라디언트 글로우."
              />

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <button type="button" onClick={handleReset}
                  className="inline-flex items-center gap-1 h-9 px-3 text-[12px] text-gray-500 hover:text-gray-900 transition-colors">
                  <RotateCcw size={12} /> 기본값으로
                </button>
                <div className="flex items-center gap-2">
                  {saved && (
                    <span className="text-[12px] text-emerald-600 font-bold">✓ 저장됨</span>
                  )}
                  <button type="submit" disabled={saving}
                    className="inline-flex items-center gap-1.5 h-10 px-5 bg-accent hover:bg-blue-700 text-white text-[13px] font-bold rounded-md transition-colors disabled:opacity-60">
                    <Save size={14} /> {saving ? '저장 중...' : '저장'}
                  </button>
                </div>
              </div>
            </>
          )}
        </form>

        {/* 우: 미리보기 */}
        <aside className="space-y-2">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Live Preview</p>
          <div className="relative bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div aria-hidden className="absolute -top-1/3 -right-1/4 w-100 h-100 rounded-full opacity-50 blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12), transparent 70%)' }} />
            <div aria-hidden className="absolute -bottom-1/3 -left-1/4 w-90 h-90 rounded-full opacity-40 blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.10), transparent 70%)' }} />

            <div className="relative px-5 py-6 text-center">
              {form.eyebrow && (
                <p className="text-[9.5px] font-bold tracking-[0.22em] uppercase text-gray-400 mb-2.5">
                  {form.eyebrow}
                </p>
              )}
              <h2 className="text-[20px] font-black tracking-tight text-gray-900 leading-[1.15]">
                {form.headline || <span className="text-gray-300">헤드라인을 입력하세요</span>}
              </h2>
              {form.sub && (
                <p className="text-[12px] text-gray-500 mt-2 leading-relaxed">
                  {form.sub}
                </p>
              )}
              {form.cta_text && (
                <span
                  className="mt-4 inline-flex items-center gap-1.5 h-10 px-5 text-[12.5px] font-bold rounded-full"
                  style={{ background: '#0F172A', color: '#FFFFFF' }}
                >
                  {form.cta_text} →
                </span>
              )}
            </div>
          </div>
          <p className="text-[10.5px] text-gray-400 leading-relaxed">
            * 실제 메인 페이지에 동일한 디자인으로 노출됩니다. 변경사항은 저장 후 즉시 반영됩니다 (사용자 새로고침 필요).
          </p>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-bold text-gray-700 mb-1">{label}</label>
      {children}
      {hint && <p className="text-[10.5px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}
