'use client';

import { useState } from 'react';

interface Props {
  phone: string;
  editablePhone?: boolean;
  userId?: string;
  onVerified: (info: { phone: string; verificationId: string }) => void;
}

export default function PhoneVerifyBox({ phone: initialPhone, editablePhone, userId, onVerified }: Props) {
  const [phone, setPhone] = useState(initialPhone);
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const send = async () => {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch('/api/auth/phone/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const d = await res.json();
      if (!res.ok) { setMsg(d.error || '발송 실패'); return; }
      setSent(true);
      setMsg(d.devCode ? `테스트 모드: 인증번호 ${d.devCode}` : '인증번호를 문자로 보냈습니다.');
    } finally { setBusy(false); }
  };

  const verify = async () => {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch('/api/auth/phone/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, userId }),
      });
      const d = await res.json();
      if (!res.ok) { setMsg(d.error || '인증 실패'); return; }
      setDone(true); setMsg('인증되었습니다.');
      onVerified({ phone, verificationId: d.verificationId });
    } finally { setBusy(false); }
  };

  if (done) return <p className="text-[12px] text-emerald-600 font-medium">✓ 휴대폰 인증 완료</p>;

  return (
    <div className="space-y-2 rounded-lg border border-gray-200 p-3 bg-gray-50">
      <p className="text-[12px] text-gray-600">등록하려면 휴대폰 인증이 필요합니다.</p>
      <div className="flex gap-2">
        <input
          type="tel" inputMode="numeric" value={phone} disabled={!editablePhone || sent}
          onChange={(e) => setPhone(e.target.value)} placeholder="휴대폰 번호"
          className="input h-9 text-[13px] flex-1 disabled:bg-gray-100"
        />
        <button type="button" onClick={send} disabled={busy}
          className="btn-secondary h-9 px-3 text-[12px] shrink-0 disabled:opacity-60">
          {sent ? '재발송' : '인증번호 받기'}
        </button>
      </div>
      {sent && (
        <div className="flex gap-2">
          <input
            type="tel" inputMode="numeric" maxLength={6} value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))} placeholder="인증번호 6자리"
            className="input h-9 text-[13px] flex-1"
          />
          <button type="button" onClick={verify} disabled={busy || code.length !== 6}
            className="btn-primary h-9 px-4 text-[12px] shrink-0 disabled:opacity-60">확인</button>
        </div>
      )}
      {msg && <p className="text-[11.5px] text-gray-600">{msg}</p>}
    </div>
  );
}
