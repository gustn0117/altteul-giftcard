'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ImageUploader from '@/components/ImageUploader';
import { categories } from '@/data/mock';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [intro, setIntro] = useState('');
  const [hours, setHours] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // 현재 저장된 값 불러오기
  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/user?id=${user.id}`)
      .then((r) => r.json())
      .then((d) => {
        const u = d.user;
        if (!u) return;
        setIntro(u.intro || '');
        setHours(u.business_hours || '');
        setImageUrl(u.intro_image_url || '');
        setSelectedCategories(u.main_categories ? String(u.main_categories).split(',').filter(Boolean) : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(id)) return prev.filter((c) => c !== id);
      if (prev.length >= 2) { alert('주력 카테고리는 최대 2개까지 선택할 수 있습니다.'); return prev; }
      return [...prev, id];
    });
    setSaved(false);
  };

  const filteredCategories = categories.filter((c) => c.id !== 'all');

  const save = async () => {
    if (!user?.id) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          intro,
          businessHours: hours,
          introImageUrl: imageUrl,
          mainCategories: selectedCategories.join(','),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '저장 실패');
      setSaved(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  if (user && user.type !== 'business') {
    return (
      <DashboardLayout>
        <div className="card p-8 text-center text-zinc-500 text-[13px]">업체 회원만 사용할 수 있는 페이지입니다.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="card p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="section-title mb-0">업체 소개 페이지 관리</h3>
          {saved && <span className="text-[12px] text-emerald-600">✓ 저장되었습니다</span>}
        </div>

        {loading ? (
          <div className="py-12 text-center text-zinc-400 text-[13px]">불러오는 중...</div>
        ) : (
        <div className="space-y-5 max-w-2xl">
          {/* 소개 이미지 (업로드) */}
          <div>
            <label className="block text-[12px] font-medium text-zinc-600 mb-1">업체 소개 이미지</label>
            <p className="text-[11px] text-zinc-400 mb-3">업체 소개 영역 상단에 표시됩니다. 가로형 이미지 권장(예: 800×400).</p>
            <ImageUploader value={imageUrl} onChange={(url) => { setImageUrl(url); setSaved(false); }} folder="intro" />
          </div>

          {/* 주력 카테고리 */}
          <div>
            <label className="block text-[12px] font-medium text-zinc-600 mb-1">주력 상품권 카테고리</label>
            <p className="text-[11px] text-zinc-400 mb-3">업체 소개에 표시됩니다. 최대 2개까지 선택 가능.</p>
            <div className="flex flex-wrap gap-2">
              {filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`badge cursor-pointer transition-colors ${
                    selectedCategories.includes(cat.id) ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* 업체 소개 */}
          <div>
            <label className="block text-[12px] font-medium text-zinc-600 mb-1">업체 소개</label>
            <textarea
              value={intro}
              onChange={(e) => { setIntro(e.target.value); setSaved(false); }}
              placeholder="업체 소개를 입력하세요 (상세페이지에 노출됩니다)"
              rows={4}
              className="input h-auto py-3 resize-none"
            />
          </div>

          {/* 운영 시간 */}
          <div>
            <label className="block text-[12px] font-medium text-zinc-600 mb-1">운영 시간</label>
            <input
              type="text"
              value={hours}
              onChange={(e) => { setHours(e.target.value); setSaved(false); }}
              placeholder="예: 평일 09:00 - 18:00 / 24시간"
              className="input"
            />
          </div>

          <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-60">
            {saving ? '저장 중...' : '저장하기'}
          </button>
        </div>
        )}
      </div>
    </DashboardLayout>
  );
}
