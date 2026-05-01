'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
  folder?: string; // Supabase Storage 폴더명 (예: 'ads', 'buyers', 'posts')
}

export default function ImageUpload({ value, onChange, label, className = '', folder }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    if (folder) formData.append('folder', folder);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '업로드 실패');
      onChange(data.url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '업로드 실패');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      {label && <label className="block text-[11px] font-medium text-zinc-500 mb-1">{label}</label>}

      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="" className="h-20 rounded border border-zinc-200 object-cover" />
          <button onClick={() => onChange('')}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-zinc-900 text-white rounded-full flex items-center justify-center hover:bg-zinc-700">
            <X size={10} />
          </button>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()} disabled={uploading}
          className="flex items-center gap-2 px-3 py-2 border border-dashed border-zinc-300 rounded-lg text-[12px] text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 transition-colors disabled:opacity-50">
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {uploading ? '업로드 중...' : '이미지 업로드'}
        </button>
      )}

      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}

      <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
    </div>
  );
}
