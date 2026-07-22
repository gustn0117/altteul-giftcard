'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, ExternalLink } from 'lucide-react';
import PageContent from '@/components/PageContent';

interface SitePage {
  slug: string;
  title: string;
  subtitle: string | null;
  content: string;
  updated_at: string;
}

export default function AdminPagesEditor() {
  const [pages, setPages] = useState<SitePage[]>([]);
  const [slug, setSlug] = useState<string>('terms');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    fetch('/api/pages')
      .then((r) => r.json())
      .then((d) => setPages(d.pages ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // 선택한 페이지 내용 반영
  useEffect(() => {
    const p = pages.find((x) => x.slug === slug);
    if (!p) return;
    setTitle(p.title || '');
    setSubtitle(p.subtitle || '');
    setContent(p.content || '');
    setSaved(false);
  }, [slug, pages]);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/pages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, title, subtitle, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '저장 실패');
      setPages((prev) => prev.map((p) => (p.slug === slug ? { ...p, title, subtitle, content } : p)));
      setSaved(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-main py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Link href="/admin" className="text-[12px] text-gray-500 hover:text-accent flex items-center gap-1"><ArrowLeft size={12} />운영자홈</Link>
          <h1 className="text-[18px] font-bold text-gray-800 ml-3 flex items-center gap-2"><FileText size={18} className="text-accent" />안내 페이지 편집</h1>
        </div>
        {saved && <span className="text-[12px] text-emerald-600">✓ 저장되었습니다</span>}
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400 text-[13px]">불러오는 중...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-4">
          {/* 페이지 선택 */}
          <div className="bg-white border border-gray-200">
            {pages.map((p) => (
              <button
                key={p.slug}
                onClick={() => setSlug(p.slug)}
                className={`w-full text-left px-4 py-3 text-[13px] border-b border-gray-100 last:border-b-0 transition-colors ${
                  slug === p.slug ? 'bg-accent text-white font-bold' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                {p.title}
                {!p.content && <span className={`block text-[10.5px] ${slug === p.slug ? 'text-white/80' : 'text-gray-400'}`}>미작성</span>}
              </button>
            ))}
          </div>

          {/* 편집 */}
          <div className="bg-white border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-gray-500">
                수정 후 <b>저장</b>을 누르면 사이트에 바로 반영됩니다.
              </p>
              <Link href={`/${slug}`} target="_blank" className="text-[11.5px] text-gray-500 hover:text-accent flex items-center gap-1">
                실제 화면 보기 <ExternalLink size={11} />
              </Link>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">페이지 제목</label>
              <input value={title} onChange={(e) => { setTitle(e.target.value); setSaved(false); }} className="input" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1">부제목 (선택)</label>
              <input value={subtitle} onChange={(e) => { setSubtitle(e.target.value); setSaved(false); }}
                placeholder="예: 최종 수정일: 2026년 3월 1일" className="input" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[12px] font-medium text-gray-600">내용</label>
                <button type="button" onClick={() => setPreview((v) => !v)}
                  className="text-[11.5px] text-accent hover:underline">
                  {preview ? '편집으로' : '미리보기'}
                </button>
              </div>

              {preview ? (
                <div className="border border-gray-200 p-4 min-h-100 bg-gray-50/50">
                  <PageContent content={content} />
                </div>
              ) : (
                <textarea
                  value={content}
                  onChange={(e) => { setContent(e.target.value); setSaved(false); }}
                  rows={22}
                  className="input h-auto py-3 font-mono text-[12.5px] leading-relaxed resize-y"
                  placeholder={'# 제목을 쓰려면 앞에 # 을 붙이세요\n일반 문장은 그냥 쓰시면 됩니다.\n\n- 점 목록은 앞에 - 를 붙이세요\n- 이렇게요'}
                />
              )}

              <div className="mt-2 px-3 py-2.5 bg-blue-50 border border-blue-200 text-[11.5px] text-blue-800 leading-relaxed">
                <b>작성 방법</b><br />
                · <b># 제목</b> — 줄 앞에 <b>#</b> 과 띄어쓰기를 붙이면 소제목이 됩니다. (예: <code># 제1조 (목적)</code>)<br />
                · <b>- 항목</b> — 줄 앞에 <b>-</b> 와 띄어쓰기를 붙이면 점 목록이 됩니다.<br />
                · 그냥 쓰면 일반 문장, <b>빈 줄</b>을 넣으면 문단이 나뉩니다.
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={save} disabled={saving} className="btn-primary h-10 px-6 text-[13px] disabled:opacity-60">
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
