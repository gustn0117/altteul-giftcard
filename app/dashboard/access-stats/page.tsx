'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';

const PERIOD_OPTIONS = [
  { key: '30', label: '30일' },
  { key: '7', label: '7일' },
  { key: '1', label: '1일' },
];

interface Totals { view: number; phone: number; sms: number; }

export default function AccessStatsPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('30');
  const [totals, setTotals] = useState<Totals>({ view: 0, phone: 0, sms: 0 });
  const [dailyData, setDailyData] = useState<{ date: string; count: number }[]>([]);
  const [allDays, setAllDays] = useState<{ date: string; count: number }[]>([]);

  // 로그인한 업체 본인의 광고 이벤트만 집계 (예전엔 전역 방문자를 모든 업체가 동일하게 봤음)
  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/ad-events?user_id=${user.id}`)
      .then((r) => r.json())
      .then((res) => {
        setTotals(res.totals ?? { view: 0, phone: 0, sms: 0 });
        setAllDays(res.last30 ?? []);
      })
      .catch(() => {});
  }, [user?.id]);

  // 기간(1/7/30일)에 맞춰 일별 데이터 자름 — last30은 오래된→최신 순이라 뒤에서 자른다
  useEffect(() => {
    const n = period === '1' ? 1 : period === '7' ? 7 : 30;
    setDailyData(allDays.slice(-n));
  }, [allDays, period]);

  const sumIn = (n: number) => allDays.slice(-n).reduce((s, d) => s + d.count, 0);
  const periodDays = period === '1' ? 1 : period === '7' ? 7 : 30;
  const periodViews = sumIn(periodDays);

  const stats = [
    { label: '전화 클릭', value: totals.phone, color: 'text-green-600' },
    { label: '문자 클릭', value: totals.sms, color: 'text-blue-600' },
    { label: '상품 클릭', value: totals.view, color: 'text-purple-600' },
  ];

  const maxCount = Math.max(...dailyData.map((d) => d.count), 1);

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-5">
        <h2 className="section-title flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          접속 통계
        </h2>
        <p className="text-[12px] text-zinc-500 -mt-2">내 광고에 대한 조회·연락 클릭 통계입니다. (누적 기준)</p>

        {/* 클릭 통계 카드 — 전화/문자/상품 (누적) */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="card p-4 card-hover">
              <p className="text-[11px] text-zinc-500 mb-1">{stat.label}</p>
              <p className={`text-xl font-semibold ${stat.color}`}>{stat.value.toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* 기간 필터 */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-0.5">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setPeriod(opt.key)}
                className={`px-3 py-1 text-[11px] rounded-md transition-colors ${
                  period === opt.key ? 'bg-white text-zinc-900 shadow-sm font-medium' : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-zinc-400 ml-1">최근 {periodDays}일 조회 {periodViews.toLocaleString()}건</span>
        </div>

        {/* 일별 조회 추이 */}
        <div className="card p-5">
          <h3 className="text-[13px] font-semibold text-zinc-800 mb-4">일별 조회 추이 (최근 {periodDays}일)</h3>
          {dailyData.length === 0 || periodViews === 0 ? (
            <div className="h-40 flex items-center justify-center text-zinc-400 text-[13px]">
              아직 조회 데이터가 없습니다.
            </div>
          ) : (
            <div className="space-y-1 max-h-130 overflow-y-auto">
              {dailyData.map((day) => (
                <div key={day.date} className="flex items-center gap-3">
                  <span className="text-[11px] text-zinc-500 w-20 shrink-0">{day.date.slice(5)}</span>
                  <div className="flex-1 h-5 bg-zinc-50 rounded overflow-hidden">
                    <div
                      className="h-full bg-green-400 rounded transition-all"
                      style={{ width: `${(day.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-zinc-600 w-8 text-right tabular-nums">{day.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
