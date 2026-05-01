'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ImageUpload from '@/components/ImageUpload';
import type { CommunityCategory } from '@/lib/types';

const MAX_IMAGES = 5;

const CATEGORY_LABEL: Record<CommunityCategory, string> = {
  news: '업계뉴스',
  tip: '거래TIP',
  qna: '질문과답변',
};

function WriteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const initialCat = (searchParams.get('cat') as CommunityCategory) || 'qna';

  const [category, setCategory] = useState<CommunityCategory>(initialCat);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const addImage = (url: string) => {
    if (!url) return;
    setImages(prev => (prev.length >= MAX_IMAGES ? prev : [...prev, url]));
  };
  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  useEffect(() => {
    const t = setTimeout(() => setAuthChecked(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    if (!user) {
      const redirect = encodeURIComponent(`/community/write?cat=${category}`);
      router.replace(`/login?redirect=${redirect}`);
    }
  }, [authChecked, user, router, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!user) {
      setError('로그인 후 작성해주세요.');
      return;
    }
    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          title: title.trim(),
          content: content.trim() || null,
          images,
          author_id: user.id,
          author_name: user.name,
          is_pinned: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '등록에 실패했습니다.');
      router.push(`/community/${data.post.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!authChecked || !user) {
    return (
      <div className="container-main py-10 text-center text-gray-400 text-[13px]">
        {authChecked ? '로그인 페이지로 이동 중...' : '불러오는 중...'}
      </div>
    );
  }

  return (
    <div className="container-main py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[18px] font-bold text-gray-800">커뮤니티 글쓰기</h1>
        <div className="breadcrumb">
          <Link href="/">HOME</Link> &gt; <Link href="/community">커뮤니티</Link> &gt; 글쓰기
        </div>
      </div>

      <div className="max-w-[900px] mx-auto">
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
            <Link href={`/community?cat=${category}`} className="flex items-center gap-1 text-[12px] text-gray-500 hover:text-accent">
              <ArrowLeft size={12} /> 목록
            </Link>
            <h2 className="text-[14px] font-bold">새 글 작성</h2>
            <span />
          </div>

          <div className="p-5 space-y-4">
            {/* 카테고리 */}
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1.5">카테고리 *</label>
              <div className="flex gap-1">
                {(Object.keys(CATEGORY_LABEL) as CommunityCategory[]).map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`px-4 py-2 text-[12px] border transition-colors ${
                      category === c ? 'border-accent bg-accent text-white font-bold' : 'border-gray-200 text-gray-600 hover:border-accent hover:text-accent'
                    }`}
                  >
                    {CATEGORY_LABEL[c]}
                  </button>
                ))}
              </div>
            </div>

            {/* 작성자 (로그인 사용자) */}
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1.5">작성자</label>
              <div className="h-10 px-3 flex items-center bg-gray-50 border border-gray-200 text-[13px] text-gray-700">
                {user.name}
              </div>
            </div>

            {/* 제목 */}
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1.5">제목 *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="제목을 입력하세요 (최대 200자)"
                maxLength={200}
                className="w-full h-10 px-3 border border-gray-300 text-[13px] focus:border-accent focus:outline-none"
              />
              <p className="text-[11px] text-gray-400 mt-1 text-right">{title.length}/200</p>
            </div>

            {/* 내용 */}
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1.5">내용</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="내용을 입력하세요..."
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 text-[13px] focus:border-accent focus:outline-none resize-y"
              />
            </div>

            {/* 이미지 첨부 */}
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1.5">
                이미지 첨부 <span className="text-gray-400 font-normal">(선택, 최대 {MAX_IMAGES}장 · 장당 5MB)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {images.map((url, idx) => (
                  <div key={url + idx} className="relative">
                    <img src={url} alt="" className="h-20 w-20 rounded border border-gray-200 object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-zinc-900 text-white rounded-full flex items-center justify-center hover:bg-zinc-700"
                      aria-label="이미지 삭제"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
                {images.length < MAX_IMAGES && (
                  <ImageUpload value="" onChange={addImage} folder="community" />
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-[12px] text-red-600">{error}</div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Link
                href={`/community?cat=${category}`}
                className="btn-secondary h-10 px-4 text-[12px]"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="btn-accent h-10 px-6 text-[12px] disabled:opacity-60"
              >
                {submitting ? '등록 중...' : '등록하기'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function WritePage() {
  return (
    <Suspense fallback={<div className="container-main py-10 text-center text-gray-400 text-[13px]">불러오는 중...</div>}>
      <WriteContent />
    </Suspense>
  );
}
