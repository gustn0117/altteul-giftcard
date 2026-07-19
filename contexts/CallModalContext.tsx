'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Phone, X } from 'lucide-react';
import { formatPhone } from '@/lib/format';

const NOTICE = '예판상품권 보고 연락드렸다고 말씀해주세요';

interface CallTarget {
  name: string;
  phone: string;
}

interface CallModalCtx {
  /** 통화 확인 팝업 열기. 전화번호가 없으면 무시된다. */
  openCall: (name: string, phone: string | null | undefined) => void;
}

const Ctx = createContext<CallModalCtx | null>(null);

export function useCallModal(): CallModalCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCallModal must be used within <CallModalProvider>');
  return ctx;
}

export function CallModalProvider({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<CallTarget | null>(null);

  const openCall = useCallback((name: string, phone: string | null | undefined) => {
    const safePhone = phone || '';
    const digits = safePhone.replace(/[^0-9+]/g, '');
    if (!digits) return; // 번호 없으면 팝업 안 띄움
    setTarget({ name: name || '업체', phone: safePhone });
  }, []);

  const close = useCallback(() => setTarget(null), []);

  return (
    <Ctx.Provider value={{ openCall }}>
      {children}
      {target && <CallConfirmModal target={target} onClose={close} />}
    </Ctx.Provider>
  );
}

function CallConfirmModal({ target, onClose }: { target: CallTarget; onClose: () => void }) {
  const digits = target.phone.replace(/[^0-9+]/g, '');

  // Escape로 닫기 + 배경 스크롤 잠금
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label="통화 확인"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 */}
        <div className="flex justify-end pt-2 pr-2">
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 정보 */}
        <div className="px-5 pb-1">
          <div className="flex items-center gap-3 py-3 border-b border-gray-100">
            <span className="w-16 shrink-0 text-[13px] text-gray-500">업체명</span>
            <span className="text-gray-300">|</span>
            <span className="flex-1 min-w-0 text-[14.5px] font-bold text-gray-900 truncate">{target.name}</span>
          </div>
          <div className="flex items-center gap-3 py-3">
            <span className="w-16 shrink-0 text-[13px] text-gray-500">연락처</span>
            <span className="text-gray-300">|</span>
            <span className="flex-1 min-w-0 text-[14.5px] font-bold text-accent tabular-nums truncate">{formatPhone(target.phone)}</span>
          </div>
        </div>

        {/* 안내 문구 */}
        <p className="px-5 py-3 text-center text-[12.5px] text-gray-500">
          📢 {NOTICE}
        </p>

        {/* 버튼: 취소 / 통화하기 */}
        <div className="grid grid-cols-2 gap-2 p-4 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-lg bg-gray-200 text-gray-700 text-[14px] font-bold hover:bg-gray-300 transition-colors"
          >
            취소
          </button>
          <a
            href={`tel:${digits}`}
            onClick={onClose}
            className="h-12 rounded-lg bg-accent text-white text-[14px] font-bold flex items-center justify-center gap-1.5 hover:bg-blue-700 transition-colors"
          >
            <Phone size={15} /> 통화하기
          </a>
        </div>
      </div>
    </div>
  );
}
