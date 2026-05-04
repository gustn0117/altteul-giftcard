'use client';

import { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  /** Supabase Storage 폴더명 */
  folder?: string;
  /** 라벨 (옵션) */
  label?: string;
  /** 힌트 (옵션) */
  hint?: string;
}

/**
 * Supabase Storage(altteul-giftcard 버킷) 직접 업로드 위젯.
 * - 파일 선택 또는 드래그&드롭 → /api/upload → 즉시 URL 채움
 * - 업로드된 이미지 미리보기 + 제거 버튼
 * - 5MB / jpg, png, gif, webp, svg
 */
export default function ImageUploader({ value, onChange, folder = 'uploads', label, hint }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setError(null);
    if (file.size > 5 * 1024 * 1024) {
      setError('파일 크기는 5MB 이하여야 합니다.');
      return;
    }
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      setError('jpg, png, gif, webp, svg만 업로드 가능합니다.');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', folder);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '업로드에 실패했습니다.');
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : '업로드 실패');
    } finally {
      setUploading(false);
    }
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) upload(f);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) upload(f);
  };

  return (
    <div>
      {label && <label className="block text-[12px] font-bold text-gray-700 mb-1">{label}</label>}

      {value ? (
        <div className="relative inline-block group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="업로드된 이미지" className="w-full max-w-xs h-40 object-cover rounded-lg border border-gray-200" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 inline-flex items-center justify-center w-7 h-7 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 text-gray-600 transition-colors"
            aria-label="이미지 제거"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            dragOver ? 'border-accent bg-accent/5' : 'border-gray-300 hover:border-accent hover:bg-gray-50'
          }`}
        >
          {uploading ? (
            <>
              <Loader2 size={24} className="text-accent animate-spin" />
              <p className="text-[12px] text-gray-500">업로드 중...</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <ImageIcon size={20} className="text-gray-500" />
              </div>
              <p className="text-[12.5px] text-gray-700 font-bold">
                클릭 또는 파일 끌어놓기
              </p>
              <p className="text-[10.5px] text-gray-400">JPG, PNG, GIF, WebP, SVG · 최대 5MB</p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        onChange={handleSelect}
        className="hidden"
      />

      {!value && !uploading && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-2 inline-flex items-center gap-1.5 h-8 px-3 text-[11.5px] font-bold text-accent border border-accent/40 rounded-md hover:bg-accent/5 transition-colors"
        >
          <Upload size={11} /> 파일 선택
        </button>
      )}

      {error && <p className="text-[11px] text-rose-500 mt-1.5">{error}</p>}
      {hint && <p className="text-[10.5px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}
