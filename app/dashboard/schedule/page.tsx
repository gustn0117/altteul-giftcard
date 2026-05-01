'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getChats } from '@/lib/api';
import type { DBChat } from '@/lib/types';

const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function SchedulePage() {
  const { user } = useAuth();
  const [chats, setChats] = useState<DBChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth] = useState(new Date());
  const [filterTab, setFilterTab] = useState('전체');

  useEffect(() => {
    if (!user) return;
    getChats(user.id).then(setChats).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().getDate();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const activeChats = chats.filter(c => c.status !== '거래완료' && c.current_step < 6);
  const completedChats = chats.filter(c => c.status === '거래완료' || c.current_step >= 6);

  const filteredChats = filterTab === '전체' ? chats :
    filterTab === '완료' ? completedChats :
    filterTab === '진행중' ? activeChats : chats;

  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

  return (
    <DashboardLayout>
      {loading ? (
        <div className="py-16 text-center text-zinc-400 text-[13px]">불러오는 중...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Calendar */}
          <div className="card p-4">
            <h3 className="text-[13px] font-semibold mb-3">스케줄 현황</h3>
            <div className="text-center mb-2">
              <span className="text-[13px] font-medium">{year}년 {monthNames[month]}</span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-[11px] text-center mb-1">
              {daysOfWeek.map(d => <div key={d} className="py-1 text-zinc-400 font-medium">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 text-[11px] text-center">
              {calendarDays.map((day, idx) => (
                <div key={idx} className={`py-1.5 rounded ${
                  day === today ? 'bg-zinc-900 text-white font-medium' : day ? 'hover:bg-zinc-100 cursor-pointer text-zinc-700' : ''
                }`}>{day || ''}</div>
              ))}
            </div>
          </div>

          {/* Stats + Table */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="card p-4 text-center">
                <p className="text-[11px] text-zinc-400 mb-1">총 거래</p>
                <p className="text-xl font-semibold">{chats.length}<span className="text-[12px] text-zinc-400">건</span></p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-[11px] text-zinc-400 mb-1">진행중</p>
                <p className="text-xl font-semibold text-blue-600">{activeChats.length}<span className="text-[12px] text-zinc-400">건</span></p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-[11px] text-zinc-400 mb-1">완료</p>
                <p className="text-xl font-semibold">{completedChats.length}<span className="text-[12px] text-zinc-400">건</span></p>
              </div>
            </div>

            <div className="flex border-b border-zinc-200">
              {['전체', '진행중', '완료'].map(tab => (
                <button key={tab} onClick={() => setFilterTab(tab)}
                  className={`tab-underline text-[12px] ${filterTab === tab ? 'active' : ''}`}>{tab}</button>
              ))}
            </div>

            <div className="card overflow-hidden">
              <table className="w-full text-[13px]">
                <thead><tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="table-header text-left py-2.5 px-4">상대방</th>
                  <th className="table-header text-left py-2.5 px-4">상품</th>
                  <th className="table-header text-center py-2.5 px-4">단계</th>
                  <th className="table-header text-center py-2.5 px-4">상태</th>
                  <th className="table-header text-left py-2.5 px-4">날짜</th>
                </tr></thead>
                <tbody>
                  {filteredChats.map(c => {
                    const isBuyer = c.buyer_id === user?.id;
                    const partner = isBuyer ? c.seller : c.buyer;
                    const status = c.current_step >= 6 ? '완료' : '진행중';
                    return (
                      <tr key={c.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                        <td className="py-2.5 px-4 font-medium">{(partner as { name?: string })?.name || '-'}</td>
                        <td className="py-2.5 px-4 text-zinc-500">{(c.post as { title?: string })?.title || '-'}</td>
                        <td className="py-2.5 px-4 text-center"><span className="badge bg-zinc-100 text-zinc-500">{c.current_step}/6</span></td>
                        <td className="py-2.5 px-4 text-center"><span className={`badge ${status === '완료' ? 'bg-zinc-100 text-zinc-600' : 'bg-blue-50 text-blue-600'}`}>{status}</span></td>
                        <td className="py-2.5 px-4 text-zinc-400 text-[11px]">{new Date(c.updated_at).toLocaleDateString('ko-KR')}</td>
                      </tr>
                    );
                  })}
                  {filteredChats.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-zinc-400">거래 내역이 없습니다.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
