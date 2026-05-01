'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { categories } from '@/data/mock';

export default function ProfilePage() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['lotte']);
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState('평일 09:00 - 18:00');

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const filteredCategories = categories.filter(c => c.id !== 'all');

  return (
    <DashboardLayout>
      <div className="card p-5 animate-fade-in">
        <h3 className="section-title mb-5">업체 소개 페이지 관리</h3>

        <div className="space-y-5 max-w-2xl">
          {/* Category selection */}
          <div>
            <label className="block text-[12px] font-medium text-zinc-600 mb-1">주력 상품권 카테고리</label>
            <p className="text-[11px] text-zinc-400 mb-3">삽니다 탭에서 카테고리별로 업체가 노출됩니다. 최대 2개까지 선택 가능 (추가는 관리자 문의)</p>
            <div className="flex flex-wrap gap-2">
              {filteredCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`badge cursor-pointer transition-colors ${
                    selectedCategories.includes(cat.id)
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[12px] font-medium text-zinc-600 mb-1">업체 소개</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="업체 소개를 입력하세요"
              rows={4}
              className="input h-auto py-3 resize-none"
            />
          </div>

          {/* Hours */}
          <div>
            <label className="block text-[12px] font-medium text-zinc-600 mb-1">운영 시간</label>
            <input
              type="text"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="예: 평일 09:00 - 18:00"
              className="input"
            />
          </div>

          {/* Images */}
          <div>
            <label className="block text-[12px] font-medium text-zinc-600 mb-1">업체 소개 이미지</label>
            <p className="text-[11px] text-zinc-400 mb-3">office_image 01~06 중 선택 (기본: 01). 업체 소개 페이지 상단 배경으로 표시됩니다.</p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {[1,2,3,4,5,6].map(n => (
                <div
                  key={n}
                  className="aspect-[4/3] bg-zinc-50 border border-zinc-200 rounded-lg cursor-pointer hover:border-zinc-400 flex items-center justify-center text-[11px] text-zinc-400 font-medium transition-colors"
                >
                  {String(n).padStart(2, '0')}
                </div>
              ))}
            </div>
          </div>

          <button className="btn-primary">
            저장하기
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
