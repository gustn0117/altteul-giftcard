'use client';

import { useEffect, useState } from 'react';

/**
 * 홈 방문자 카운터.
 *
 * '시각'만으로 값을 계산해서 누가 언제 보든 같은 숫자가 나온다(합성 카운터).
 *  - 오늘 방문자 = 시각기반 합성값(감소된) + 실제 순 접속자(/api/visitors 오늘 집계)
 *  - 누적 광고 클릭수 = 시작 2,000 + (방문자 대비 5% × 200~300% 랜덤) 누적
 */

const KST = 9 * 3600 * 1000;
const START_TOTAL = 2_000;    // 누적 광고 클릭수 시작값(천 단위)
const RATE = 0.06;            // 오늘 방문자 증가속도(기존 0.3의 20% = 80% 감소)
const CLICK_RATIO = 0.05;     // 방문자 대비 광고 클릭 비율(5%)
// 누적 시작 기준일 (이 날 누적 = START_TOTAL)
const EPOCH_DAY = Math.floor((Date.UTC(2026, 6, 22) + KST) / 86400000);

/** 시드 기반 의사난수 (0~1) — 같은 분이면 어느 기기에서든 같은 값 */
function seeded(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** 광고 클릭 부스트 배율 2.0~3.0 (200~300%) */
function adFactor(seed: number): number {
  return 2 + seeded(seed);
}

/** 해당 분의 방문자 증가량 (시간대별 차등 × RATE) */
function tick(dayIndex: number, minuteOfDay: number): number {
  const hour = Math.floor(minuteOfDay / 60);
  const [lo, hi] = hour < 6 ? [1, 5] : hour < 12 ? [5, 10] : hour < 18 ? [30, 60] : [80, 120];
  const r = seeded(dayIndex * 1440 + minuteOfDay);
  return Math.round((lo + r * (hi - lo)) * RATE);
}

/** 해당 분의 광고 클릭 증가량 = 방문자 × 5% × (200~300% 랜덤) */
function clickTick(dayIndex: number, minuteOfDay: number): number {
  const v = tick(dayIndex, minuteOfDay);
  const f = adFactor(dayIndex * 1440 + minuteOfDay + 500_000);
  return v * CLICK_RATIO * f;
}

/** 하루치 광고 클릭 총합(누적 증가분 계산용) */
function dailyClickTotal(dayIndex: number): number {
  let sum = 0;
  for (let m = 0; m < 1440; m++) sum += clickTick(dayIndex, m);
  return sum;
}

function compute(): { today: number; total: number } {
  const nowKst = new Date(Date.now() + KST);
  const dayIndex = Math.floor((Date.now() + KST) / 86400000);
  const minuteOfDay = nowKst.getUTCHours() * 60 + nowKst.getUTCMinutes();

  let today = 0;
  let clicksToday = 0;
  for (let m = 0; m <= minuteOfDay; m++) {
    today += tick(dayIndex, m);
    clicksToday += clickTick(dayIndex, m);
  }

  // 지난 날들의 누적 광고 클릭 증가분(하루치 대표값 × 경과일)
  const daysPassed = Math.max(0, dayIndex - EPOCH_DAY);
  const perDayGain = dailyClickTotal(EPOCH_DAY);
  const total = Math.round(START_TOTAL + daysPassed * perDayGain + clicksToday);

  return { today, total };
}

export default function VisitorCounter() {
  // 서버/클라이언트 첫 렌더 불일치를 피하려고 마운트 후 계산
  const [state, setState] = useState<{ today: number; total: number } | null>(null);
  const [realToday, setRealToday] = useState(0); // 실제 순 접속자(오늘)

  useEffect(() => {
    setState(compute());
    const id = setInterval(() => setState(compute()), 60_000);
    return () => clearInterval(id);
  }, []);

  // 실제 순 접속자 반영 (오늘 방문자에 더함) — 1분마다 갱신
  useEffect(() => {
    const load = () =>
      fetch('/api/visitors')
        .then((r) => r.json())
        .then((d) => setRealToday(Number(d?.today) || 0))
        .catch(() => {});
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  const todayShown = (state?.today ?? 0) + realToday;

  return (
    <section>
      <div className="grid grid-cols-2 bg-white border border-gray-200 rounded-xl overflow-hidden divide-x divide-gray-200">
        <Stat label="오늘 방문자" value={todayShown} unit="명" />
        <Stat label="누적 광고 클릭수" value={state?.total ?? START_TOTAL} unit="회" />
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
