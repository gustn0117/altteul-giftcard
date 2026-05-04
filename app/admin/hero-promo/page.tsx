'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Image as ImageIcon } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';

export default function AdminHeroPromoPage() {
  const [imageUrl, setImageUrl] = useState('');
  const [imageUrlMobile, setImageUrlMobile] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/hero-promo')
      .then(r => r.json())
      .then(data => {
        setImageUrl(data?.image_url ?? '');
        setImageUrlMobile(data?.image_url_mobile ?? '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setUrl = (which: 'pc' | 'mobile', url: string) => {
    if (which === 'pc') setImageUrl(url);
    else setImageUrlMobile(url);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/hero-promo', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // 텍스트는 모두 비움 (이미지만 모드)
          eyebrow: null,
          headline: null,
          sub: null,
          cta_text: null,
          cta_link: null,
          image_url: imageUrl || null,
          image_url_mobile: imageUrlMobile || null,
        }),
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

  return (
    <div className="container-main py-6">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/admin" className="text-[12px] text-gray-500 hover:text-accent flex items-center gap-1"><ArrowLeft size={12}/>운영자홈</Link>
        <h1 className="text-[18px] font-bold text-gray-800 flex items-center gap-2">
          <ImageIcon size={18} className="text-accent" /> 메인 홍보 이미지
        </h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 max-w-3xl">
        {loading ? (
          <p className="text-center py-12 text-gray-400 text-[13px]">불러오는 중...</p>
        ) : (
          <>
            <p className="text-[12.5px] text-gray-600 mb-5 leading-relaxed">
              메인 페이지 상단 홍보 박스에 노출될 이미지를 PC와 모바일에 따로 업로드하세요.<br/>
              모바일 이미지를 비워두면 PC 이미지가 자동 사용됩니다 (비율 차이로 잘림 가능).
            </p>

            <div className="space-y-5">
              <ImageUploader
                value={imageUrl}
                onChange={(url) => setUrl('pc', url)}
                folder="hero-promo"
                label="🖥️ PC 이미지 — 권장 1800 × 600px (3:1 비율)"
                hint="실제 노출 크기 약 890 × 297px"
              />
              <ImageUploader
                value={imageUrlMobile}
                onChange={(url) => setUrl('mobile', url)}
                folder="hero-promo"
                label="📱 모바일 이미지 — 권장 750 × 420px (16:9 비율)"
                hint="실제 노출 크기 약 345 × 195px"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-5 mt-5 border-t border-gray-100">
              {saved && (
                <span className="text-[12px] text-emerald-600 font-bold">✓ 저장됨</span>
              )}
              <button onClick={handleSave} disabled={saving}
                className="inline-flex items-center gap-1.5 h-10 px-5 bg-accent hover:bg-blue-700 text-white text-[13px] font-bold rounded-md transition-colors disabled:opacity-60">
                <Save size={14} /> {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
