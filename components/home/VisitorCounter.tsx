'use client';

import { useEffect, useRef, useState } from 'react';

interface VisitorState {
  date: string;       // 'YYYY-MM-DD'
  today: number;      // 오늘 방문자 (자정 초기화)
  total: number;      // 누적 상담 (영구 보존)
  lastTickAt: number; // 마지막 증가 시각 (ms)
}

const KEY = 'visitor_counter_v1';
const INITIAL_TOTAL = 1_118_612; // 누적 시작값
const TICK_MS = 60_000;          // 매 1분마다 증가

/** 시간대별 분당 증가량 (1-5명 / 5-10명 / 30-60명 / 80-120명) */
function tickIncrement(hour: number): number {
  if (hour < 6)        return rand(1, 5);
  if (hour < 12)       return rand(5, 10);
  if (hour < 18)       return rand(30, 60);
  return rand(80, 120);
}
function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function load(): VisitorState {
  if (typeof window === 'undefined') {
    return { date: todayKey(), today: 0, total: INITIAL_TOTAL, lastTickAt: Date.now() };
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as VisitorState;
      // 날짜 변경 시: today 초기화, total은 보존
      if (parsed.date !== todayKey()) {
        return { date: todayKey(), today: 0, total: parsed.total ?? INITIAL_TOTAL, lastTickAt: Date.now() };
      }
      return parsed;
    }
  } catch { /* 무시 */ }
  return { date: todayKey(), today: 0, total: INITIAL_TOTAL, lastTickAt: Date.now() };
}

function save(state: VisitorState) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* 무시 */ }
}

export default function VisitorCounter() {
  const [state, setState] = useState<VisitorState>(() => load());
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    // 초기 로드 시: 백그라운드에서 지난 시간만큼 catchup tick (최대 240분 = 4시간)
    const init = load();
    const minutesSinceLast = Math.min(240, Math.floor((Date.now() - init.lastTickAt) / TICK_MS));
    if (minutesSinceLast > 0) {
      let t = init.today;
      let tot = init.total;
      const now = new Date();
      for (let i = 0; i < minutesSinceLast; i++) {
        const inc = tickIncrement(now.getHours());
        t += inc;
        tot += Math.ceil(inc * 0.05);
      }
      const next = { ...init, today: t, total: tot, lastTickAt: Date.now() };
      setState(next); save(next);
    }

    // 매 분 증가
    const id = setInterval(() => {
      const cur = stateRef.current;
      // 자정 지나면 today 초기화
      if (cur.date !== todayKey()) {
        const reset = { date: todayKey(), today: 0, total: cur.total, lastTickAt: Date.now() };
        setState(reset); save(reset);
        return;
      }
      const hour = new Date().getHours();
      const inc = tickIncrement(hour);
      const next = {
        ...cur,
        today: cur.today + inc,
        total: cur.total + Math.ceil(inc * 0.05),
        lastTickAt: Date.now(),
      };
      setState(next); save(next);
    }, TICK_MS);

    return () => clearInterval(id);
  }, []);

  return (
    <section>
      <div className="grid grid-cols-2 bg-white border border-gray-200 rounded-xl overflow-hidden divide-x divide-gray-200">
        <Stat label="오늘 방문자" value={state.today} unit="명" />
        <Stat label="누적 상담수" value={state.total} unit="건" />
      </div>
    </section>
  );
}

function Stat({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="flex items-center justify-center gap-1.5 py-2 px-2">
      <span className="text-[10.5px] text-gray-500 font-medium whitespace-nowrap shrink-0">{label}</span>
      <span className="w-px h-3 bg-gray-300 shrink-0" aria-hidden />
      <span className="text-[13px] md:text-[14.5px] font-extrabold text-gray-900 tabular-nums whitespace-nowrap">
        {value.toLocaleString()}
        <span className="text-[10px] text-gray-400 font-normal ml-0.5">{unit}</span>
      </span>
    </div>
  );
}
