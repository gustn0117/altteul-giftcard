'use client';

import { useEffect, useRef, useState } from 'react';
import { ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';

// 드림시큐리티 표준창 SDK 타입(전역)
declare global {
  interface Window {
    MOBILEOK?: { process: (reqUrl: string, device: string, callback: string) => void };
    __mokVerifyCb?: (payload: string) => void;
  }
}

export type MokVerified = { verificationId: string; name: string; phone: string };

const CB_NAME = '__mokVerifyCb';

/**
 * 휴대폰 본인확인(드림시큐리티 표준창) 버튼.
 * SDK 흐름(client_process.js): process(url, device, '콜백명') →
 *  ① 팝업창 열림 → ② url(/api/mok/request) 로 요청정보 생성 → ③ 팝업에서 통신사 인증 →
 *  ④ 팝업 닫히고 부모창이 returnUrl 로 결과 XHR POST → ⑤ returnUrl 응답(JSON)을 콜백으로 전달.
 * 콜백에서 claimToken 을 /api/mok/result 로 교환해 실명/전화 획득 → onVerified.
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
  const [err, setErr] = useState<string | null>(null);
  const onVerifiedRef = useRef(onVerified);
  onVerifiedRef.current = onVerified;

  useEffect(() => {
    fetch('/api/mok/config')
      .then((r) => r.json())
      .then((c) => { setEnabled(!!c.enabled); setScriptUrl(c.scriptUrl || null); })
      .catch(() => setEnabled(false));
  }, []);

  // 표준창 SDK 미리 로드 — 클릭 시 window.open 이 제스처 안에서 동기 실행돼야 팝업이 안 막힌다.
  // 주의: index.js 는 로드 직후 다시 client_process.js 를 동적 로드해 window.MOBILEOK 를 정의한다.
  // 따라서 <script> onload 가 아니라 window.MOBILEOK 실제 존재를 폴링해서 준비완료로 판단한다.
  useEffect(() => {
    if (!scriptUrl) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const markWhenReady = () => {
      if (window.MOBILEOK?.process) { setScriptReady(true); if (timer) clearInterval(timer); return true; }
      return false;
    };
    if (markWhenReady()) return;
    if (!document.querySelector<HTMLScriptElement>(`script[src="${scriptUrl}"]`)) {
      const s = document.createElement('script');
      s.src = scriptUrl; s.async = true;
      s.onerror = () => setErr('본인확인 모듈을 불러오지 못했습니다.');
      document.head.appendChild(s);
    }
    timer = setInterval(markWhenReady, 200);
    const stop = setTimeout(() => { if (timer) clearInterval(timer); }, 15000);
    return () => { if (timer) clearInterval(timer); clearTimeout(stop); };
  }, [scriptUrl]);

  // SDK 가 호출할 전역 콜백 등록 (returnUrl 응답 JSON 문자열을 받음)
  useEffect(() => {
    window[CB_NAME] = (payload: string) => {
      let res: { ok?: boolean; claimToken?: string; reason?: string } = {};
      try { res = typeof payload === 'string' ? JSON.parse(payload) : payload; } catch { /* ignore */ }
      if (!res.ok || !res.claimToken) {
        setBusy(false);
        setErr('본인확인이 취소되었거나 실패했습니다. 다시 시도해주세요.');
        return;
      }
      fetch('/api/mok/result', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimToken: res.claimToken }),
      })
        .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
        .then(({ ok, j }) => {
          setBusy(false);
          if (!ok) { setErr(j.error || '본인확인 결과를 가져오지 못했습니다.'); return; }
          onVerifiedRef.current({ verificationId: j.verificationId, name: j.name, phone: j.phone });
        })
        .catch(() => { setBusy(false); setErr('본인확인 결과 처리 중 오류가 발생했습니다.'); });
    };
    return () => { delete window[CB_NAME]; };
  }, []);

  // 클릭 제스처 안에서 동기 실행 (팝업 차단 방지). 콜백명을 넘겨야 팝업 방식으로 동작.
  const start = () => {
    if (!window.MOBILEOK) {
      setErr('본인확인 모듈을 준비 중입니다. 잠시 후 다시 눌러주세요.');
      return;
    }
    setErr(null); setBusy(true);
    const device = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'MB' : 'WB';
    window.MOBILEOK.process(`/api/mok/request?usage=${usage}`, device, CB_NAME);
  };

  if (enabled === false) return null; // 미설정 시 숨김

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
      {busy && (
        <p className="text-[11px] text-gray-400 mt-1.5 text-center">
          팝업 창에서 본인확인을 완료해주세요.
        </p>
      )}
      {err && <p className="text-[11px] text-rose-500 mt-1.5 text-center">{err}</p>}
    </div>
  );
}
