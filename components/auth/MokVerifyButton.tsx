'use client';

import { useEffect, useRef, useState } from 'react';
import { ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';

// 드림시큐리티 표준창 SDK 타입(전역)
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MOBILEOK?: { process: (reqUrl: string, device: string, callback: string) => void };
  }
}

export type MokVerified = { verificationId: string; name: string; phone: string };

/**
 * 휴대폰 본인확인(드림시큐리티 표준창) 버튼.
 * - /api/mok/config 로 사용 가능 여부 + 스크립트 URL(개발/운영) 조회 → 미설정이면 렌더 안 함.
 * - 클릭 시 SDK 로드 후 MOBILEOK.process(요청URL, 기기, '') 로 표준창 팝업.
 * - 팝업(returnUrl)이 postMessage 로 claimToken 전달 → /api/mok/result 로 실명/전화 교환 → onVerified.
 */
export default function MokVerifyButton({
  usage = '01001',
  onVerified,
  verified,
}: {
  usage?: string;
  onVerified: (v: MokVerified) => void;
  verified?: { name: string; phone: string } | null;
}) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [scriptUrl, setScriptUrl] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [started, setStarted] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const onVerifiedRef = useRef(onVerified);
  onVerifiedRef.current = onVerified;

  useEffect(() => {
    fetch('/api/mok/config')
      .then((r) => r.json())
      .then((c) => { setEnabled(!!c.enabled); setScriptUrl(c.scriptUrl || null); })
      .catch(() => setEnabled(false));
  }, []);

  // 표준창 SDK 미리 로드 — 클릭 시점에 window.open 이 제스처 안에서 동기 실행돼야
  // 팝업이 차단되지 않는다(await 후 열면 첫 클릭이 막힘).
  useEffect(() => {
    if (!scriptUrl) return;
    if (window.MOBILEOK) { setScriptReady(true); return; }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${scriptUrl}"]`);
    if (existing) {
      existing.addEventListener('load', () => setScriptReady(true));
      if (window.MOBILEOK) setScriptReady(true);
      return;
    }
    const s = document.createElement('script');
    s.src = scriptUrl; s.async = true;
    s.onload = () => setScriptReady(true);
    s.onerror = () => setErr('본인확인 모듈을 불러오지 못했습니다.');
    document.head.appendChild(s);
  }, [scriptUrl]);

  // 표준창 팝업 결과 수신
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      const d = e.data;
      if (!d || d.source !== 'mok') return;
      setStarted(false);
      if (!d.ok || !d.claimToken) {
        setBusy(false);
        setErr('본인확인이 취소되었거나 실패했습니다.');
        return;
      }
      fetch('/api/mok/result', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimToken: d.claimToken }),
      })
        .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
        .then(({ ok, j }) => {
          setBusy(false);
          if (!ok) { setErr(j.error || '본인확인 결과를 가져오지 못했습니다.'); return; }
          onVerifiedRef.current({ verificationId: j.verificationId, name: j.name, phone: j.phone });
        })
        .catch(() => { setBusy(false); setErr('본인확인 결과 처리 중 오류가 발생했습니다.'); });
    }
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  // 클릭 제스처 안에서 동기 실행 (팝업 차단 방지)
  const start = () => {
    if (!window.MOBILEOK) {
      setErr('본인확인 모듈을 준비 중입니다. 잠시 후 다시 눌러주세요.');
      return;
    }
    setErr(null); setBusy(true); setStarted(true);
    const device = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'MB' : 'WB';
    window.MOBILEOK.process(`/api/mok/request?usage=${usage}`, device, '');
  };

  if (enabled === false) return null; // 미설정 시 숨김

  // 인증 완료 상태
  if (verified) {
    return (
      <div className="flex items-center gap-2 w-full h-12 px-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[14px] font-bold">
        <CheckCircle2 size={18} className="shrink-0" />
        본인확인 완료 · {verified.name}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={start}
        disabled={!scriptReady}
        className="flex items-center justify-center gap-2 w-full h-12 rounded-lg font-bold text-[14.5px] bg-gray-900 text-white hover:bg-black transition-all disabled:opacity-60"
      >
        {busy ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
        {busy ? '본인확인 진행 중…' : scriptReady ? '휴대폰 본인확인' : '본인확인 준비 중…'}
      </button>
      {started && (
        <p className="text-[11px] text-gray-400 mt-1.5 text-center">
          팝업 창에서 본인확인을 완료해주세요. 창이 안 보이면 버튼을 다시 눌러주세요.
        </p>
      )}
      {err && <p className="text-[11px] text-rose-500 mt-1.5 text-center">{err}</p>}
    </div>
  );
}
