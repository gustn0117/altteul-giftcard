# 휴대폰 문자 인증(SMS OTP) 설계

작성일: 2026-07-24
상태: 승인됨 (대표님 승인 2026-07-24)

## 1. 목적 / 범위

예판상품권(중고 상품권 거래)에서 **글 작성 시점**에 휴대폰 소유를 확인해
장난 글·허위 매물을 줄인다. 실명 본인인증(CI/DI)이 아니라 **SMS OTP(문자 인증)** 로,
"그 전화번호를 지금 소유하고 있음"만 확인한다.

- 회원가입 시에는 인증을 **요구하지 않는다** (기존 가입 그대로).
- 인증은 **팝니다/삽니다 글 등록 시점**에만 건다.

## 2. 동작 시나리오 (확정)

| 상황 | 등록 버튼을 누르면 |
|---|---|
| **인증된 회원** | 그대로 등록. 팝니다=자동 게시(기존), 삽니다=관리자 승인 필요(기존 그대로) |
| **미인증 회원** | "인증받은 회원이 아닙니다" 안내 → 본인(회원) 휴대폰으로 인증 → 통과 시 `users.phone_verified=true` 로 저장되어 **이후 글부터는 재인증 없음** → 이어서 등록 |
| **비회원** | 입력한 전화번호(guest_phone)로 **매 글마다** 인증 → 통과 시 등록 |

- 삽니다(구매/업체) 글의 관리자 승인 로직은 **변경 없음**. 인증은 그 위에 얹는 게이트일 뿐.
- 글 수정(edit)에는 인증을 요구하지 않는다(비회원 글 수정은 기존 비밀번호 확인 유지).

## 3. 데이터 모델 (schema: altteul_giftcard)

### 3.1 users 컬럼 추가
- `phone_verified boolean NOT NULL DEFAULT false`
- `phone_verified_at timestamptz NULL`
- 기존 회원은 default false → 첫 글 등록 시 1회 인증하면 이후 유지.

### 3.2 신규 테이블 `phone_verifications`
OTP 코드 발급/검증 상태를 담는다.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid PK (gen_random_uuid) | |
| phone | text NOT NULL | 숫자만 정규화(예: 01012345678) |
| code_hash | text NOT NULL | 6자리 코드의 sha256(코드+phone) — 평문 저장 금지 |
| expires_at | timestamptz NOT NULL | 발급 + 3분 |
| attempts | int NOT NULL DEFAULT 0 | 틀린 시도 횟수 |
| verified_at | timestamptz NULL | 성공 시각 |
| consumed_at | timestamptz NULL | 글 등록에 사용되어 소진된 시각(비회원 재사용 방지) |
| ip | text NULL | 레이트리밋/로그용 |
| created_at | timestamptz NOT NULL DEFAULT now() | |

- 인덱스: `(phone, created_at desc)`.
- 마이그레이션은 pg-meta(`POST https://api.hsweb.pics/pg/query`)로 적용 후 `notify pgrst, 'reload schema'`.

## 4. 서버 API (Next route handlers, service role)

### 4.1 `POST /api/auth/phone/send`
입력: `{ phone }`
- phone 숫자 정규화, 형식 검증(10~11자리).
- **레이트리밋**: 같은 phone 기준 최근 1시간 발급 5회 초과 시 429. 최근 발급이 30초 이내면 429(쿨다운).
- 6자리 코드 생성(암호학적 난수), `code_hash` 저장, `expires_at = now()+3분`, `attempts=0`.
- `sendVerificationSms(phone, code)` 호출.
- 응답: `{ ok: true, cooldown: 30 }` (코드는 응답에 절대 포함하지 않음. 단 테스트 모드는 5절 참고).

### 4.2 `POST /api/auth/phone/verify`
입력: `{ phone, code, userId? }`
- 해당 phone의 **가장 최근** 미소진 verification 행 조회.
- 만료(now>expires_at) → 410. 시도초과(attempts>=5) → 423. 코드 불일치 → attempts+1, 401.
- 일치 → `verified_at=now()`.
  - `userId`가 있고 그 회원의 phone과 일치하면 `users.phone_verified=true, phone_verified_at=now()` 로 갱신.
- 응답: `{ ok: true, verificationId }`.

### 4.3 글 등록과의 연결
- 회원: 클라이언트가 `user.phone_verified` 로 게이트. false면 인증 모달 → verify 성공 후 AuthContext 사용자 갱신(phone_verified=true) → 등록 진행.
- 비회원: 등록 payload에 `verificationId`(방금 성공한 행)를 포함. 클라이언트는 verify 성공한 guest_phone 에 대해서만 등록 진행.
  - 등록 직후 해당 verification 행을 `consumed_at=now()` 처리(재사용 방지)는 best-effort로 verify 응답 이후 별도 처리하거나, v1에서는 "verified_at 최근 10분 & consumed_at null" 조건으로 간주하고 등록 성공 시 소진 표시.

> 참고(보안 한계): 현재 글 생성은 브라우저에서 supabase 로 직접 insert 한다. 따라서 이번 버전의 강제력은 **클라이언트 게이트 + 서버측 OTP 진실성**(코드를 받지 않으면 verify 불가)에 있다. 완전한 서버 차단(무결성)까지 원하면 글 생성을 서버 API로 이전하는 후속 작업이 필요하다. v1 범위 밖.

## 5. 문자 발송 (SOLAPI)

- 유틸 `lib/sms.ts` 의 `sendVerificationSms(phone, code)`.
- SOLAPI REST(`POST https://api.solapi.com/messages/v4/send`), 인증 헤더는 HMAC-SHA256
  (apiKey, date(ISO8601), salt, signature=HMAC-SHA256(date+salt, apiSecret)) — **구현 시 SOLAPI 최신 문서로 정확한 서명 형식 재확인**.
- 본문 예: `[예판상품권] 인증번호 123456 (3분 내 입력)`.
- 환경변수(서버 .env, 셀프호스팅 Docker): `SOLAPI_API_KEY`, `SOLAPI_API_SECRET`, `SOLAPI_SENDER`(등록된 발신번호).
- **테스트 모드**: 위 3개 중 하나라도 없으면 실제 발송하지 않고 `console.log`로 코드 출력(+ 응답에 `devCode`는 `NODE_ENV!=='production'`일 때만 포함). 프로덕션에서는 키가 없으면 발송 실패로 명확히 안내.

## 6. UI

- 위치: `app/board/write/page.tsx` 의 제출 흐름. 전화번호 입력 옆 **[인증번호 받기]**, 코드 입력칸 + **[확인]**, 남은시간/재발송.
- 회원: 미인증 상태에서 등록 클릭 → 안내 후 인증 UI 노출(번호는 회원 전화로 고정). 통과 후 자동으로 등록 이어감.
- 비회원: guest_phone 입력 → 인증 UI. 통과해야 등록 버튼 활성.
- 카피: 실패 메시지는 원인+해결을 명확히("인증번호가 일치하지 않습니다", "인증번호가 만료됐습니다. 다시 받아주세요").
- 접근성: 키보드 포커스, `inputmode=numeric`.

## 7. 악용 방지 요약
- 코드 3분 만료 / 재발송 30초 쿨다운 / 번호당 1시간 5회 / 오입력 5회 시 무효화.
- 코드 해시 저장. 응답에 코드 미포함(테스트 모드 예외).

## 8. 범위 밖 (YAGNI)
- 실명/생년월일(CI/DI) 본인인증, 성인인증.
- 로그인·비밀번호찾기 단계의 문자 인증(이번엔 글 작성만).
- 글 생성 서버 API 이전(무결성 강화)은 후속.

## 9. 대표님 준비물
1. SOLAPI 가입 → 발신번호 등록(사전등록제).
2. `API Key / API Secret / 발신번호` → 서버 환경변수 3개.
3. 넣기 전까지는 테스트 모드로 화면·흐름 확인 가능.
