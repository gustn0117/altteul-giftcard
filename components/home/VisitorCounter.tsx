'use client';

import { useEffect, useState } from 'react';

/**
 * 홈 방문자 카운터.
 *
 * 예전엔 브라우저(localStorage)에 각자 저장해서 폰마다·사람마다 숫자가 달랐고,
 * 처음 들어온 사람은 0부터 시작했다.
 * 이제는 '시각'만으로 값을 계산해서 누가 언제 보든 같은 숫자가 나온다. (저장 안 함)
 */

const KST = 9 * 3600 * 1000;
const START_TOTAL = 20_000;   // 누적 시작값
const RATE = 0.3;             // 증가 속도 배율 (기존 대비)
const TOTAL_RATIO = 0.05;     // 오늘 방문자 중 누적에 더해지는 비율
// 누적 시작 기준일 (이 날 누적 = START_TOTAL)
const EPOCH_DAY = Math.floor((Date.UTC(2026, 6, 22) + KST) / 86400000);

/** 시드 기반 의사난수 (0~1) — 같은 분이면 어느 기기에서든 같은 값 */
function seeded(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** 해당 분의 증가량 (시간대별 차등 × RATE) */
function tick(dayIndex: number, minuteOfDay: number): number {
  const hour = Math.floor(minuteOfDay / 60);
  const [lo, hi] = hour < 6 ? [1, 5] : hour < 12 ? [5, 10] : hour < 18 ? [30, 60] : [80, 120];
  const r = seeded(dayIndex * 1440 + minuteOfDay);
  return Math.round((lo + r * (hi - lo)) * RATE);
}

/** 하루치 총합 (누적 증가분 계산용) — 평균적인 하루 */
function dailyTotal(dayIndex: number): number {
  let sum = 0;
  for (let m = 0; m < 1440; m++) sum += tick(dayIndex, m);
  return sum;
}

function compute(): { today: number; total: number } {
  const nowKst = new Date(Date.now() + KST);
  const dayIndex = Math.floor((Date.now() + KST) / 86400000);
  const minuteOfDay = nowKst.getUTCHours() * 60 + nowKst.getUTCMinutes();

  let today = 0;
  for (let m = 0; m <= minuteOfDay; m++) today += tick(dayIndex, m);

  // 지난 날들의 누적 증가분 (하루치는 대표값 하나로 계산해 가볍게)
  const daysPassed = Math.max(0, dayIndex - EPOCH_DAY);
  const perDayGain = Math.round(dailyTotal(EPOCH_DAY) * TOTAL_RATIO);
  const total = START_TOTAL + daysPassed * perDayGain + Math.floor(today * TOTAL_RATIO);

  return { today, total };
}

export default function VisitorCounter() {
  // 서버/클라이언트 첫 렌더 불일치를 피하려고 마운트 후 계산
  const [state, setState] = useState<{ today: number; total: number } | null>(null);

  useEffect(() => {
    setState(compute());
    const id = setInterval(() => setState(compute()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <section>
      <div className="grid grid-cols-2 bg-white border border-gray-200 rounded-xl overflow-hidden divide-x divide-gray-200">
        <Stat label="오늘 방문자" value={state?.today ?? 0} unit="명" />
        <Stat label="누적 상담수" value={state?.total ?? START_TOTAL} unit="건" />
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
