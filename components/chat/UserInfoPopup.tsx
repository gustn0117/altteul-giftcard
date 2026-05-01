'use client';

import { X, Flag, User, ShieldCheck } from 'lucide-react';

interface UserInfoPopupProps {
  user: {
    name: string;
    type: string;
    joinDate: string;
    tradeCompleted: number;
    tradeOngoing: number;
    tradeDelayed: number;
  };
  onClose: () => void;
}

export default function UserInfoPopup({ user, onClose }: UserInfoPopupProps) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg border border-zinc-200 w-full max-w-[340px] shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
          <h3 className="text-[13px] font-semibold">거래 상대 정보</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600"><X size={16} /></button>
        </div>

        <div className="p-4">
          {/* Profile */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400">
              <User size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold">{user.name}</span>
                <span className="badge bg-zinc-100 text-zinc-500">{user.type}</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">가입일: {user.joinDate}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-zinc-50 rounded-md p-2.5 text-center">
              <p className="text-[16px] font-semibold text-zinc-900">{user.tradeCompleted}</p>
              <p className="text-[10px] text-zinc-400">완료</p>
            </div>
            <div className="bg-blue-50 rounded-md p-2.5 text-center">
              <p className="text-[16px] font-semibold text-blue-600">{user.tradeOngoing}</p>
              <p className="text-[10px] text-blue-500">진행중</p>
            </div>
            <div className="bg-red-50 rounded-md p-2.5 text-center">
              <p className="text-[16px] font-semibold text-red-500">{user.tradeDelayed}</p>
              <p className="text-[10px] text-red-400">지연</p>
            </div>
          </div>

          {/* Safety */}
          <div className="flex items-center gap-2 px-3 py-2.5 bg-zinc-50 rounded-md mb-3">
            <ShieldCheck size={14} className="text-zinc-400 shrink-0" />
            <p className="text-[11px] text-zinc-500">사기 의심 시 경찰 사이버수사대(182)에 즉시 신고하세요.</p>
          </div>

          <button className="btn-secondary w-full h-8 text-[11px] text-red-500 border-red-200 hover:bg-red-50">
            <Flag size={12} /> 이 사용자 신고
          </button>
        </div>
      </div>
    </div>
  );
}
