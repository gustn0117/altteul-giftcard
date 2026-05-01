'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getChats } from '@/lib/api';
import type { DBChat } from '@/lib/types';

const STATUS_FILTERS = [
  { key: 'all', label: '전체', color: 'bg-green-500' },
  { key: 'progress', label: '진행중' },
  { key: 'paid', label: '구매완료(입금확인)' },
  { key: 'done', label: '완료' },
  { key: 'cancel', label: '취소' },
  { key: 'dispute', label: '분쟁' },
];

const PIPELINE_STEPS = [
  { label: '입금확인·발송 전', color: 'bg-amber-50', textColor: 'text-amber-700' },
  { label: '배송 진행', color: 'bg-blue-50', textColor: 'text-blue-700' },
  { label: '종료 대기', color: 'bg-purple-50', textColor: 'text-purple-700' },
  { label: '거래 완료', color: 'bg-green-50', textColor: 'text-green-700' },
];

const TRADE_STEPS = ['견적', '기본정보', '계약', '입금', '배송', '종료'];

export default function StatsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [chats, setChats] = useState<DBChat[]>([]);

  useEffect(() => {
    if (user?.id) {
      getChats(user.id).then(setChats).catch(() => {});
    }
  }, [user?.id]);

  const totalTrades = chats.length;
  const inProgress = chats.filter((c) => c.current_step < 6 && c.status !== 'cancelled').length;
  const completed = chats.filter((c) => c.current_step >= 6).length;
  const paidInProgress = chats.filter((c) => c.current_step === 4).length;

  // Trade step counts
  const stepCounts = TRADE_STEPS.map((_, i) => ({
    count: chats.filter((c) => c.current_step === i + 1).length,
    amount: chats.filter((c) => c.current_step === i + 1).reduce((s, c) => s + ((c.post as any)?.price ?? 0), 0),
  }));

  // Pipeline counts
  const pipelineCounts = [
    chats.filter((c) => c.current_step === 4).length,
    chats.filter((c) => c.current_step === 5).length,
    chats.filter((c) => c.current_step === 5 && c.status === 'pending_close').length,
    completed,
  ];

  // Filter chats for table
  const filteredChats = chats.filter((c) => {
    if (filter === 'all') return true;
    if (filter === 'progress') return c.current_step < 6 && c.status !== 'cancelled';
    if (filter === 'paid') return c.current_step === 4;
    if (filter === 'done') return c.current_step >= 6;
    if (filter === 'cancel') return c.status === 'cancelled';
    if (filter === 'dispute') return c.status === 'dispute';
    return true;
  });

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-5">
        <h2 className="section-title">통계</h2>

        {/* Status filter */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1 text-[11px] rounded-full border transition-colors ${
                filter === f.key
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <p className="text-[11px] text-zinc-400">{filter === 'all' ? '전체' : STATUS_FILTERS.find(f => f.key === filter)?.label} · {filteredChats.length}건 표시</p>

        {/* Trade Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="card p-4 card-hover">
            <p className="text-[11px] text-zinc-500 mb-1">조회 거래</p>
            <p className="text-2xl font-semibold text-zinc-900">{totalTrades}<span className="text-[12px] text-zinc-400 ml-1">건</span></p>
          </div>
          <div className="card p-4 card-hover">
            <p className="text-[11px] text-blue-500 mb-1">진행 중</p>
            <p className="text-2xl font-semibold text-blue-600">{inProgress}<span className="text-[12px] text-zinc-400 ml-1">건</span></p>
          </div>
          <div className="card p-4 card-hover">
            <p className="text-[11px] text-zinc-500 mb-1">완료</p>
            <p className="text-2xl font-semibold text-zinc-900">{completed}<span className="text-[12px] text-zinc-400 ml-1">건</span></p>
          </div>
        </div>

        {/* Pipeline */}
        <div>
          <p className="text-[12px] font-semibold text-zinc-700 mb-2">입금 이후 체결·배송 파이프라인</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PIPELINE_STEPS.map((step, i) => (
              <div key={step.label} className={`card p-4 ${step.color}`}>
                <p className={`text-[11px] ${step.textColor} mb-1`}>{step.label}</p>
                <p className={`text-xl font-semibold ${step.textColor}`}>{pipelineCounts[i]}<span className="text-[11px] font-normal ml-1">건</span></p>
              </div>
            ))}
          </div>
        </div>

        {/* Trade Step Breakdown */}
        <div>
          <p className="text-[12px] font-semibold text-zinc-700 mb-2">Trade 단계별 건수·금액</p>
          <p className="text-[10px] text-zinc-400 mb-2">견적 → 기본정보 → 계약 → 입금 → 배송 → 종료</p>
          <div className="flex flex-wrap gap-2">
            {TRADE_STEPS.map((step, i) => (
              stepCounts[i].count > 0 && (
                <div key={step} className="card px-3 py-2 text-[11px]">
                  <span className="text-zinc-600 font-medium">{step}</span>
                  <span className="text-zinc-500 ml-2">{stepCounts[i].count} 건</span>
                  {stepCounts[i].amount > 0 && (
                    <span className="text-zinc-400 ml-1">: {stepCounts[i].amount.toLocaleString()}원</span>
                  )}
                </div>
              )
            ))}
            {stepCounts.every((s) => s.count === 0) && (
              <p className="text-[11px] text-zinc-400">아직 거래 데이터가 없습니다.</p>
            )}
          </div>
        </div>

        {/* Trade List Table */}
        <div>
          <p className="text-[12px] font-semibold text-zinc-700 mb-2">거래 리스트 ({filter === 'all' ? '전체' : STATUS_FILTERS.find(f => f.key === filter)?.label}) — {filteredChats.length}건</p>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200">
                    <th className="table-header py-2.5 px-3 text-left">거래ID</th>
                    <th className="table-header py-2.5 px-3 text-left">유형</th>
                    <th className="table-header py-2.5 px-3 text-left">상대방</th>
                    <th className="table-header py-2.5 px-3 text-right">구매금액</th>
                    <th className="table-header py-2.5 px-3 text-center">상태</th>
                    <th className="table-header py-2.5 px-3 text-left">일정</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredChats.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-zinc-400 text-[13px]">거래 데이터가 없습니다.</td>
                    </tr>
                  ) : (
                    filteredChats.map((chat) => {
                      const isbuyer = chat.buyer_id === user?.id;
                      const other = isbuyer ? (chat.seller as any)?.name : (chat.buyer as any)?.name;
                      const stepLabel = TRADE_STEPS[Math.min(chat.current_step - 1, 5)] ?? '견적';
                      return (
                        <tr key={chat.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                          <td className="py-2.5 px-3 text-zinc-500 font-mono">{chat.id.slice(0, 8)}</td>
                          <td className="py-2.5 px-3">
                            <span className={`badge text-[10px] ${isbuyer ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                              {isbuyer ? '구매' : '판매'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-zinc-700">{other ?? '-'}</td>
                          <td className="py-2.5 px-3 text-right font-medium text-zinc-800">{((chat.post as any)?.price ?? 0).toLocaleString()}원</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="badge bg-green-50 text-green-600 text-[10px]">{stepLabel}</span>
                          </td>
                          <td className="py-2.5 px-3 text-zinc-400">{new Date(chat.created_at).toLocaleDateString('ko-KR')}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Chart placeholder */}
        <div className="card p-5">
          <h3 className="section-title">월별 거래 추이</h3>
          <div className="h-48 flex flex-col items-center justify-center text-zinc-400 text-[13px] bg-zinc-50 rounded-lg border border-dashed border-zinc-200">
            <svg className="w-10 h-10 text-zinc-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            거래 데이터가 쌓이면 차트가 표시됩니다.
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
