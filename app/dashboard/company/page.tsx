'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';

export default function CompanyPage() {
  const { user, isLoggedIn, login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn || !user) {
      router.push('/login');
      return;
    }
    fetch(`/api/user?id=${user.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setForm({
            name: data.user.name || '',
            email: data.user.email || '',
            phone: data.user.phone || '',
          });
        }
      })
      .catch(() => setError('프로필을 불러올 수 없습니다.'))
      .finally(() => setLoading(false));
  }, [user, isLoggedIn, router]);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, name: form.name, phone: form.phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '저장 실패');
      // Auth context 업데이트
      login({ ...user, name: data.user.name, phone: data.user.phone });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-16 text-center text-zinc-400 text-[13px]">불러오는 중...</div>
      </DashboardLayout>
    );
  }

  const isBusiness = user?.type === 'business';
  // 업체는 이메일이 `{businessNumber}@biz.altteul-giftcard` 형식
  const businessNumberMatch = isBusiness ? form.email.match(/^(\d+)@biz\.altteul-giftcard$/) : null;
  const businessNumber = businessNumberMatch
    ? businessNumberMatch[1].replace(/(\d{3})(\d{2})(\d+)/, '$1-$2-$3')
    : null;

  return (
    <DashboardLayout>
      <div className="card p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h3 className="section-title mb-0">{isBusiness ? '업체 정보' : '내 프로필'}</h3>
          {saved && <span className="text-[12px] text-emerald-600">✓ 저장되었습니다</span>}
        </div>

        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-[12px] font-medium text-zinc-600 mb-1">{isBusiness ? '사업체명' : '이름'}</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="input"
            />
          </div>
          {businessNumber && (
            <div>
              <label className="block text-[12px] font-medium text-zinc-600 mb-1">사업자등록번호</label>
              <input
                type="text"
                value={businessNumber}
                className="input bg-zinc-50 text-zinc-500 cursor-not-allowed"
                readOnly
              />
              <p className="text-[11px] text-zinc-400 mt-1">사업자등록번호는 변경할 수 없습니다.</p>
            </div>
          )}
          <div>
            <label className="block text-[12px] font-medium text-zinc-600 mb-1">이메일</label>
            <input
              type="email"
              value={form.email}
              className="input bg-zinc-50 text-zinc-500 cursor-not-allowed"
              readOnly
            />
            <p className="text-[11px] text-zinc-400 mt-1">이메일은 변경할 수 없습니다.</p>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-zinc-600 mb-1">연락처</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="010-0000-0000"
              className="input"
            />
          </div>

          {error && <p className="text-[12px] text-red-500">{error}</p>}

          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
