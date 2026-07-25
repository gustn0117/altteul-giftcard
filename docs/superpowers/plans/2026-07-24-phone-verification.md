# 휴대폰 문자 인증(SMS OTP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 글 등록(팝니다/삽니다) 시점에 SOLAPI 문자로 휴대폰 소유를 확인한다 — 인증 회원은 유지, 미인증 회원은 등록 시 1회, 비회원은 매번.

**Architecture:** 서버 라우트 2개(`/api/auth/phone/send`, `/verify`)가 OTP 진실성을 담당(코드는 sha256 해시로만 저장). `lib/sms.ts`가 SOLAPI 발송(키 없으면 테스트 모드=콘솔 출력). 글 작성 페이지(`app/board/write/page.tsx`)가 회원 `phone_verified` / 비회원 매-제출 인증을 게이트. 회원 인증 성공 시 `users.phone_verified=true` 저장 + AuthContext 사용자 갱신.

**Tech Stack:** Next.js 16 route handlers, Supabase(service role, schema `altteul_giftcard`), Node `crypto`, SOLAPI REST(HMAC-SHA256), Tailwind.

## Global Constraints

- Supabase 스키마: `altteul_giftcard`. 서버는 `createServiceClient()`(from `@/lib/supabase`) 사용.
- DB 마이그레이션은 pg-meta: `POST https://api.hsweb.pics/pg/query` (헤더 `apikey` + `Authorization: Bearer <service_role>`), 스키마 변경 뒤 `notify pgrst, 'reload schema'`.
- 배포: git push → webhook Docker 재빌드. 검증은 `npm run build`(컴파일) + 로컬 `PORT=3100 npm start` curl + 배포 후 ssh 터널(`localhost:4095`) Playwright. 유닛 테스트 프레임워크 없음.
- 코드는 **평문 저장 금지**(sha256(code+phone)). 응답에 코드 미포함 — 단 `NODE_ENV!=='production'` && 테스트 모드일 때만 `devCode` 포함.
- OTP 규칙: 6자리 / 만료 3분 / 재발송 쿨다운 30초 / 번호당 1시간 5회 / 오입력 5회 시 무효.
- 전화번호 정규화: 숫자만(`replace(/[^0-9]/g,'')`), 10~11자리.
- 환경변수(서버 .env): `SOLAPI_API_KEY`, `SOLAPI_API_SECRET`, `SOLAPI_SENDER`.
- 기존 동작 불변: 팝니다=자동 게시(`approved_at=now`), 삽니다=관리자 승인(`approved_at=null`). 인증은 그 위 게이트일 뿐. 글 수정(edit)엔 인증 요구 안 함.

---

## File Structure

- Create `lib/sms.ts` — SOLAPI 발송 + 테스트 모드. `sendVerificationSms(phone, code)`.
- Create `app/api/auth/phone/send/route.ts` — 코드 발급/발송(POST).
- Create `app/api/auth/phone/verify/route.ts` — 코드 검증(POST).
- Create `components/auth/PhoneVerifyBox.tsx` — 재사용 인증 UI(번호 입력→받기→코드→확인).
- Modify `lib/types.ts` — `DBUser`에 `phone_verified`, `phone_verified_at`.
- Modify `app/board/write/page.tsx` — 제출 게이트 + PhoneVerifyBox 연결.
- Modify `contexts/AuthContext.tsx` 미변경(기존 `login()`으로 사용자 갱신). 확인만.
- DB: `users`(+2 컬럼), `phone_verifications`(신규 표) — pg-meta.

---

### Task 1: DB 마이그레이션 + 타입

**Files:**
- Migrate (pg-meta): `altteul_giftcard.users`, `altteul_giftcard.phone_verifications`
- Modify: `lib/types.ts` (DBUser 인터페이스)

**Interfaces:**
- Produces: 테이블 `phone_verifications(id, phone, code_hash, expires_at, attempts, verified_at, consumed_at, ip, created_at)`; `users.phone_verified boolean`, `users.phone_verified_at timestamptz`. `DBUser.phone_verified?: boolean`.

- [ ] **Step 1: 마이그레이션 SQL 파일 작성**

`scratchpad`에 `migrate.json` 생성:
```json
{"query":"alter table altteul_giftcard.users add column if not exists phone_verified boolean not null default false, add column if not exists phone_verified_at timestamptz; create table if not exists altteul_giftcard.phone_verifications (id uuid primary key default gen_random_uuid(), phone text not null, code_hash text not null, expires_at timestamptz not null, attempts int not null default 0, verified_at timestamptz, consumed_at timestamptz, ip text, created_at timestamptz not null default now()); create index if not exists idx_phone_verif_phone_created on altteul_giftcard.phone_verifications (phone, created_at desc); notify pgrst, 'reload schema';"}
```

- [ ] **Step 2: 마이그레이션 실행**

```bash
cd "<repo>" && SRK=$(grep -hE '^SUPABASE_SERVICE_ROLE_KEY=' .env* | head -1 | cut -d= -f2- | tr -d '"'"'"' ')
curl -s -X POST "https://api.hsweb.pics/pg/query" -H "apikey: $SRK" -H "Authorization: Bearer $SRK" -H "Content-Type: application/json" --data-binary @<scratchpad>/migrate.json
```
Expected: 에러 없이 `[]` 또는 성공 응답.

- [ ] **Step 3: 컬럼/표 생성 확인**

```bash
# users 컬럼 + 표 존재 확인
curl ... --data-binary '{"query":"select column_name from information_schema.columns where table_schema='"'"'altteul_giftcard'"'"' and table_name='"'"'users'"'"' and column_name like '"'"'phone_verified%'"'"'"}'
curl ... --data-binary '{"query":"select count(*) from altteul_giftcard.phone_verifications"}'
```
Expected: `phone_verified`, `phone_verified_at` 2행 / count 0.

- [ ] **Step 4: DBUser 타입에 필드 추가**

`lib/types.ts`의 `DBUser`에 추가:
```ts
  phone_verified?: boolean;
  phone_verified_at?: string | null;
```

- [ ] **Step 5: 빌드 + 커밋**

```bash
npm run build   # 컴파일 통과 확인
git add lib/types.ts docs/superpowers/plans/2026-07-24-phone-verification.md
git commit -m "feat(auth): phone_verifications 테이블 + users.phone_verified (마이그레이션)"
```

---

### Task 2: SMS 발송 유틸 (SOLAPI + 테스트 모드)

**Files:**
- Create: `lib/sms.ts`

**Interfaces:**
- Produces: `export async function sendVerificationSms(phone: string, code: string): Promise<{ sent: boolean; test: boolean }>` — 환경변수 3개 있으면 SOLAPI 발송(sent:true,test:false), 없으면 콘솔 로그(sent:true,test:true), 발송 실패 시 throw.

- [ ] **Step 1: lib/sms.ts 작성**

```ts
import crypto from 'crypto';

const SOLAPI_URL = 'https://api.solapi.com/messages/v4/send';

function creds() {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const from = process.env.SOLAPI_SENDER;
  return apiKey && apiSecret && from ? { apiKey, apiSecret, from } : null;
}

/** SOLAPI HMAC-SHA256 인증 헤더 (구현 시 SOLAPI 최신 문서로 서명 형식 재확인) */
function authHeader(apiKey: string, apiSecret: string): string {
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(32).toString('hex');
  const signature = crypto.createHmac('sha256', apiSecret).update(date + salt).digest('hex');
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

export async function sendVerificationSms(phone: string, code: string): Promise<{ sent: boolean; test: boolean }> {
  const text = `[예판상품권] 인증번호 ${code} (3분 내 입력)`;
  const c = creds();
  if (!c) {
    // 테스트 모드 — 키 없으면 실제 발송 대신 서버 로그
    console.log(`[SMS TEST] to=${phone} code=${code}`);
    return { sent: true, test: true };
  }
  const res = await fetch(SOLAPI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: authHeader(c.apiKey, c.apiSecret) },
    body: JSON.stringify({ message: { to: phone, from: c.from, text } }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`SMS 발송 실패(${res.status}) ${body.slice(0, 200)}`);
  }
  return { sent: true, test: false };
}
```

- [ ] **Step 2: 빌드로 컴파일 확인**

```bash
npm run build
```
Expected: 통과.

- [ ] **Step 3: 테스트 모드 동작 확인(로컬)**

`Date.now`/import 문제 없는지 로컬에서 확인은 Task 3에서 API 통해 검증(유틸 단독 실행 대신 API 경유). 여기선 빌드 통과로 충분.

- [ ] **Step 4: 커밋**

```bash
git add lib/sms.ts
git commit -m "feat(auth): SOLAPI 문자 발송 유틸 + 키 없을 때 테스트 모드"
```

---

### Task 3: 인증번호 발송 API

**Files:**
- Create: `app/api/auth/phone/send/route.ts`

**Interfaces:**
- Consumes: `sendVerificationSms` (Task 2), `createServiceClient` (`@/lib/supabase`).
- Produces: `POST /api/auth/phone/send` body `{ phone }` → `{ ok:true, cooldown:30 }` (+ `devCode` in dev+test). 오류: 400(형식), 429(쿨다운/한도).

- [ ] **Step 1: send 라우트 작성**

```ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase';
import { sendVerificationSms } from '@/lib/sms';

const normalize = (p: string) => String(p || '').replace(/[^0-9]/g, '');
const hashCode = (code: string, phone: string) =>
  crypto.createHash('sha256').update(`${code}:${phone}`).digest('hex');

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    const digits = normalize(phone);
    if (digits.length < 10 || digits.length > 11) {
      return NextResponse.json({ error: '휴대폰 번호를 정확히 입력해주세요.' }, { status: 400 });
    }
    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;
    const supabase = createServiceClient();

    // 레이트리밋: 최근 1시간 발급 수, 최근 30초 쿨다운
    const hourAgo = new Date(Date.now() - 3600_000).toISOString();
    const { data: recent } = await supabase
      .from('phone_verifications')
      .select('created_at')
      .eq('phone', digits)
      .gte('created_at', hourAgo)
      .order('created_at', { ascending: false });
    if ((recent?.length ?? 0) >= 5) {
      return NextResponse.json({ error: '인증 요청이 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 });
    }
    if (recent?.[0] && Date.now() - new Date(recent[0].created_at).getTime() < 30_000) {
      return NextResponse.json({ error: '30초 후에 다시 요청해주세요.' }, { status: 429 });
    }

    const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
    const expires_at = new Date(Date.now() + 180_000).toISOString();
    const { error } = await supabase.from('phone_verifications').insert({
      phone: digits, code_hash: hashCode(code, digits), expires_at, attempts: 0, ip,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const result = await sendVerificationSms(digits, code);
    const body: Record<string, unknown> = { ok: true, cooldown: 30 };
    if (result.test && process.env.NODE_ENV !== 'production') body.devCode = code;
    return NextResponse.json(body);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'fail' }, { status: 500 });
  }
}
```

- [ ] **Step 2: 빌드**

```bash
npm run build
```
Expected: 통과.

- [ ] **Step 3: 로컬 실행 + curl 검증**

```bash
kill -9 $(lsof -ti:3100) 2>/dev/null; (PORT=3100 npm start &) ; sleep 9
curl -s -X POST localhost:3100/api/auth/phone/send -H 'Content-Type: application/json' -d '{"phone":"010-1234-5678"}'
```
Expected(개발+테스트모드): `{"ok":true,"cooldown":30,"devCode":"NNNNNN"}`. 곧바로 한 번 더 호출 → `{"error":"30초 후..."}` 429.

- [ ] **Step 4: 커밋**

```bash
git add app/api/auth/phone/send/route.ts
git commit -m "feat(auth): 인증번호 발송 API (레이트리밋·테스트모드 devCode)"
```

---

### Task 4: 인증번호 확인 API

**Files:**
- Create: `app/api/auth/phone/verify/route.ts`

**Interfaces:**
- Consumes: `createServiceClient`, `phone_verifications` 표.
- Produces: `POST /api/auth/phone/verify` body `{ phone, code, userId? }` → `{ ok:true, verificationId }`. 오류: 401(불일치), 410(만료), 423(시도초과), 404(없음). `userId` 회원 전화 일치 시 `users.phone_verified=true`.

- [ ] **Step 1: verify 라우트 작성**

```ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase';

const normalize = (p: string) => String(p || '').replace(/[^0-9]/g, '');
const hashCode = (code: string, phone: string) =>
  crypto.createHash('sha256').update(`${code}:${phone}`).digest('hex');

export async function POST(req: NextRequest) {
  try {
    const { phone, code, userId } = await req.json();
    const digits = normalize(phone);
    const codeStr = String(code || '').trim();
    if (digits.length < 10 || !/^\d{6}$/.test(codeStr)) {
      return NextResponse.json({ error: '인증번호를 정확히 입력해주세요.' }, { status: 400 });
    }
    const supabase = createServiceClient();

    // 해당 번호의 가장 최근 미소진 인증행
    const { data: rows } = await supabase
      .from('phone_verifications')
      .select('id, code_hash, expires_at, attempts, verified_at, consumed_at')
      .eq('phone', digits)
      .is('consumed_at', null)
      .order('created_at', { ascending: false })
      .limit(1);
    const v = rows?.[0];
    if (!v) return NextResponse.json({ error: '인증번호를 먼저 받아주세요.' }, { status: 404 });
    if (new Date(v.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: '인증번호가 만료됐습니다. 다시 받아주세요.' }, { status: 410 });
    }
    if (v.attempts >= 5) {
      return NextResponse.json({ error: '시도 횟수를 초과했습니다. 다시 받아주세요.' }, { status: 423 });
    }
    if (v.code_hash !== hashCode(codeStr, digits)) {
      await supabase.from('phone_verifications').update({ attempts: v.attempts + 1 }).eq('id', v.id);
      return NextResponse.json({ error: '인증번호가 일치하지 않습니다.' }, { status: 401 });
    }

    await supabase.from('phone_verifications').update({ verified_at: new Date().toISOString() }).eq('id', v.id);

    // 회원 본인 번호면 계정에 인증 완료 저장
    if (userId) {
      const { data: u } = await supabase.from('users').select('id, phone').eq('id', userId).maybeSingle();
      if (u && normalize(u.phone || '') === digits) {
        await supabase.from('users')
          .update({ phone_verified: true, phone_verified_at: new Date().toISOString() })
          .eq('id', userId);
      }
    }
    return NextResponse.json({ ok: true, verificationId: v.id });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'fail' }, { status: 500 });
  }
}
```

- [ ] **Step 2: 빌드**

```bash
npm run build
```

- [ ] **Step 3: 로컬 curl로 전체 흐름 검증**

```bash
# send로 devCode 받기
C=$(curl -s -X POST localhost:3100/api/auth/phone/send -H 'Content-Type: application/json' -d '{"phone":"01099998888"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['devCode'])")
# 틀린 코드 → 401
curl -s -X POST localhost:3100/api/auth/phone/verify -H 'Content-Type: application/json' -d '{"phone":"01099998888","code":"000000"}'
# 맞는 코드 → ok
curl -s -X POST localhost:3100/api/auth/phone/verify -H 'Content-Type: application/json' -d "{\"phone\":\"01099998888\",\"code\":\"$C\"}"
```
Expected: 첫 verify `{"error":"인증번호가 일치하지 않습니다."}`, 둘째 `{"ok":true,"verificationId":"..."}`.

- [ ] **Step 4: 커밋**

```bash
git add app/api/auth/phone/verify/route.ts
git commit -m "feat(auth): 인증번호 확인 API (회원 인증 시 phone_verified 저장)"
```

---

### Task 5: 재사용 인증 UI 컴포넌트

**Files:**
- Create: `components/auth/PhoneVerifyBox.tsx`

**Interfaces:**
- Produces: `export default function PhoneVerifyBox({ phone, editablePhone, userId, onVerified }: { phone: string; editablePhone?: boolean; userId?: string; onVerified: (info: { phone: string; verificationId: string }) => void })` — [인증번호 받기]→코드입력→[확인]. 성공 시 `onVerified` 호출. `editablePhone`이면 번호 입력칸 표시(비회원용), 아니면 전달된 phone 고정(회원용).

- [ ] **Step 1: PhoneVerifyBox 작성**

```tsx
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
```

- [ ] **Step 2: 빌드**

```bash
npm run build
```

- [ ] **Step 3: 커밋**

```bash
git add components/auth/PhoneVerifyBox.tsx
git commit -m "feat(auth): 재사용 휴대폰 인증 UI(PhoneVerifyBox)"
```

---

### Task 6: 글 작성 게이트 연결

**Files:**
- Modify: `app/board/write/page.tsx` (handleSubmit 상단 게이트, 인증 UI 노출, AuthContext 갱신)

**Interfaces:**
- Consumes: `PhoneVerifyBox` (Task 5), `useAuth().login` (사용자 갱신), API `/api/auth/phone/verify` 결과.

- [ ] **Step 1: 상태 + 게이트 추가**

`handleSubmit` 내부, 검증 통과 후 `setSubmitting(true)` **직전**에 인증 게이트 삽입. 상단에 상태 추가:
```tsx
const { user, isLoggedIn, login } = useAuth(); // login 추가로 가져오기
const [showVerify, setShowVerify] = useState(false);
const [guestVerifiedPhone, setGuestVerifiedPhone] = useState<string | null>(null);
```

`handleSubmit`에서 지역 검증 다음, 제출 시작 전:
```tsx
// 휴대폰 인증 게이트 (수정 제외)
if (!isEdit) {
  if (isLoggedIn && user) {
    if (!user.phone_verified) {
      setShowVerify(true);
      alert('인증받은 회원이 아닙니다. 휴대폰 인증 후 등록됩니다.');
      return; // 인증 UI에서 통과하면 사용자가 다시 등록
    }
  } else {
    // 비회원: 입력한 번호가 방금 인증되지 않았으면 인증 요구
    const digits = form.guestPhone.replace(/[^0-9]/g, '');
    if (!digits || guestVerifiedPhone !== digits) {
      setShowVerify(true);
      alert('휴대폰 인증 후 등록됩니다.');
      return;
    }
  }
}
```

- [ ] **Step 2: 인증 UI 렌더 + 콜백**

폼 하단(등록 버튼 근처)에 조건부 렌더:
```tsx
{showVerify && !isEdit && (
  <PhoneVerifyBox
    phone={isLoggedIn ? (user?.phone ?? '') : form.guestPhone}
    editablePhone={!isLoggedIn}
    userId={isLoggedIn ? user?.id : undefined}
    onVerified={({ phone }) => {
      if (isLoggedIn && user) {
        login({ ...user, phone_verified: true }); // 로컬 사용자 갱신 → 재인증 불필요
      } else {
        setGuestVerifiedPhone(phone.replace(/[^0-9]/g, ''));
        // 비회원은 인증한 번호를 폼에도 반영
        setForm((f) => ({ ...f, guestPhone: phone }));
      }
      setShowVerify(false);
      alert('인증 완료! 등록 버튼을 다시 눌러주세요.');
    }}
  />
)}
```
`PhoneVerifyBox` import 추가.

- [ ] **Step 3: 빌드**

```bash
npm run build
```
Expected: 통과(타입 오류 없음).

- [ ] **Step 4: 커밋**

```bash
git add app/board/write/page.tsx
git commit -m "feat(auth): 글 작성 시 휴대폰 인증 게이트 (회원 유지/비회원 매번)"
```

---

### Task 7: 배포 + 라이브 검증 + 환경변수 안내

**Files:** 없음(배포/검증). 문서: `docs/superpowers/specs/2026-07-24-phone-verification-design.md` 9절 참고.

- [ ] **Step 1: 푸시 + 배포 대기**

```bash
git push origin main
# webhook 재빌드 → 이미지 나이 'seconds' & git HEAD 일치까지 폴링
```

- [ ] **Step 2: 라이브 테스트-모드 검증(Playwright, 터널)**

`ssh -f -N -L 4095:localhost:4095 deploy` 후, 비회원 팝니다 글 작성 시나리오:
- 폼 채우고 등록 → "휴대폰 인증 후 등록" → 번호 입력→받기(devCode는 프로덕션에선 안 나옴; 서버 로그로 확인) → 코드 입력→확인 → 등록 성공.
- 회원(미인증)으로 로그인 주입 후 등록 → 인증 요구 → 통과 → `phone_verified` DB 반영 확인(pg-meta).
- **주의**: 프로덕션은 `devCode` 미포함. 검증용 코드는 `ssh deploy "docker logs altteul-giftcard-app-1 --tail 50 | grep 'SMS TEST'"` 로 확인.

- [ ] **Step 3: DB 반영 확인**

```bash
curl ... --data-binary '{"query":"select phone_verified from altteul_giftcard.users where id='"'"'<회원id>'"'"'"}'
```
Expected: `true`.

- [ ] **Step 4: 대표님께 환경변수 안내(발송 활성화)**

셀프호스팅 서버 `.env`에 아래 3개 추가 후 컨테이너 재시작 시 실제 문자 발송:
```
SOLAPI_API_KEY=...
SOLAPI_API_SECRET=...
SOLAPI_SENDER=<등록된 발신번호>
```
`SOLAPI_SENDER`는 SOLAPI에서 사전 등록한 발신번호여야 함. 키 넣기 전엔 테스트 모드(서버 로그) 유지.

- [ ] **Step 5: 최종 커밋(문서 업데이트, 필요 시)**

```bash
git add -A && git commit -m "docs: 문자 인증 배포/검증 완료 메모" || true
```

---

## Self-Review

**Spec coverage:**
- 2절 시나리오(회원 유지/미인증/비회원 매번) → Task 6 게이트. ✅
- 3.1 users 컬럼 / 3.2 phone_verifications → Task 1. ✅
- 4.1 send / 4.2 verify → Task 3/4. ✅
- 5절 SOLAPI + 테스트모드 → Task 2. ✅
- 6절 UI → Task 5/6. ✅
- 7절 악용 방지(3분/30초/5회/5시도) → Task 3(발송 레이트리밋), Task 4(만료/시도). ✅
- 9절 환경변수 → Task 7. ✅

**Placeholder scan:** 코드 블록 실제 구현 포함. SOLAPI 서명은 "구현 시 문서 재확인" 명시(설계와 동일) — 코드 자체는 동작 가능한 형태 제공. ✅

**Type consistency:** `sendVerificationSms(phone, code)`(Task2) ↔ send API 사용(Task3). `verificationId` 반환(Task4) ↔ PhoneVerifyBox onVerified(Task5) ↔ write 콜백(Task6). `phone_verified` 컬럼(Task1) ↔ verify 저장(Task4) ↔ login 갱신(Task6). `normalize`/`hashCode` 두 라우트 동일 정의(의도적 중복, DRY 예외 — 라우트 격리). ✅

**주의(무결성 한계):** 글 생성은 클라이언트 insert라 게이트는 화면 강제. 완전 서버 차단은 후속(spec 4.3 참고).
