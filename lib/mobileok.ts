import crypto from 'crypto';

/**
 * 드림시큐리티 휴대폰 본인확인(표준창) 암복호화 — 개발가이드 V3 Java 샘플의 Node.js 포팅.
 * 키파일(mok_keyInfo.dat) + 키파일 비밀번호는 서버 env로 주입한다(코드/깃에 넣지 않음).
 *   MOK_KEYFILE_B64   : mok_keyInfo.dat 파일 바이트를 base64 인코딩한 값(컨테이너 배포에 권장)
 *   MOK_KEYFILE_PATH  : (대안) mok_keyInfo.dat 절대경로 (서버 안전 디렉토리)
 *   MOK_KEY_PASSWORD  : 키파일 비밀번호(mobileOK_password)
 *   MOK_ENV           : 'prod' | 'dev' (기본 dev)
 */

export interface MokKeyInfo {
  ServiceId: string;
  ClientPrivateKey: string; // PKCS#8, base64 (DER)
  ServerPublicKey: string; // X.509 SPKI, base64 (DER)
}

// ── 1. 키파일(mok_keyInfo.dat) 복호화: AES-256-CBC ──
// key = SHA256(pw)[0:16] + SHA256(SHA256(pw))[16:32], iv = SHA256(SHA256(pw))[0:16]
export function decryptKeyInfo(encrypted: Buffer, password: string): MokKeyInfo {
  const hash1 = crypto.createHash('sha256').update(Buffer.from(password, 'utf8')).digest(); // 32B
  const hash2 = crypto.createHash('sha256').update(hash1).digest(); // 32B
  const aesKey = Buffer.concat([hash1.subarray(0, 16), hash2.subarray(16, 32)]); // 32B
  const iv = hash2.subarray(0, 16); // 16B
  const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, iv); // PKCS5 == PKCS7(기본)
  const out = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return JSON.parse(out.toString('utf8')) as MokKeyInfo;
}

// base64(DER) → KeyObject 헬퍼
function publicKeyFromB64(b64: string) {
  return crypto.createPublicKey({ key: Buffer.from(b64, 'base64'), format: 'der', type: 'spki' });
}
function privateKeyFromB64(b64: string) {
  return crypto.createPrivateKey({ key: Buffer.from(b64, 'base64'), format: 'der', type: 'pkcs8' });
}

// ── 2. 거래요청정보(encryptReqClientInfo) 생성: RSA/ECB/OAEPWithSHA-256AndMGF1Padding ──
export function encryptReqClientInfo(serverPublicKeyB64: string, clientTxId: string, requestTime: string): string {
  const json = JSON.stringify({ version: 'V2', clientTxId, requestTime });
  const enc = crypto.publicEncrypt(
    { key: publicKeyFromB64(serverPublicKeyB64), padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    Buffer.from(json, 'utf8'),
  );
  return enc.toString('base64');
}

// 인증결과 개인정보 JSON (개발가이드 5장 복호화 결과)
export interface MokResult {
  siteId?: string;
  clientTxId?: string;
  txId?: string;
  providerId?: string;
  serviceType?: string;
  ci?: string;
  di?: string;
  userName?: string;
  userPhone?: string;
  userBirthday?: string;
  userGender?: string; // 1: 남자, 2: 여자
  userNation?: string; // 0: 내국인, 1: 외국인
  reqAuthType?: string;
  reqDate?: string;
  issuer?: string;
  issueDate?: string;
  [k: string]: unknown;
}

// ── 5. 인증결과(encryptMOKResult) 복호화 + 무결성 검증 ──
// encryptMOKResult = "encryptKeyIvHashData(RSA) | encryptResultData(AES)"
//  → RSA(개인키) 복호화로 keyIvHashData = "base64(keyIv 48B) | hashData(SHA-256 base64)"
//  → keyIv[0:32]=AES키, keyIv[32:48]=IV → AES-256-CBC로 실제 결과 JSON 복호화
//  → 복호화 결과의 SHA-256(base64) 가 hashData 와 일치해야 함(변조 검증)
export function decryptMokResult(encryptMOKResult: string, clientPrivateKeyB64: string): MokResult {
  const parts = encryptMOKResult.split('|');
  if (parts.length !== 2) throw new Error('encryptMOKResult 형식 오류');
  const [encKeyIvHash, encResult] = parts;

  const keyIvHash = crypto.privateDecrypt(
    { key: privateKeyFromB64(clientPrivateKeyB64), padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    Buffer.from(encKeyIvHash, 'base64'),
  ).toString('utf8');
  const kih = keyIvHash.split('|');
  if (kih.length !== 2) throw new Error('keyIvHashData 형식 오류');
  const [base64KeyIv, hashData] = kih;

  const keyIv = Buffer.from(base64KeyIv, 'base64'); // 48B
  if (keyIv.length !== 48) throw new Error('keyIv 길이 오류');
  const aesKey = keyIv.subarray(0, 32);
  const iv = keyIv.subarray(32, 48);

  const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, iv);
  const plain = Buffer.concat([decipher.update(Buffer.from(encResult, 'base64')), decipher.final()]);

  // 무결성 검증: SHA-256(복호화 평문) base64 == hashData
  const computed = crypto.createHash('sha256').update(plain).digest('base64');
  if (computed !== hashData) throw new Error('무결성 검증 실패(데이터 변조 의심)');

  return JSON.parse(plain.toString('utf8')) as MokResult;
}

// ── 환경 URL / 설정 ──
export function mokEnv() {
  const prod = process.env.MOK_ENV === 'prod';
  return {
    prod,
    resultRequestUrl: prod
      ? 'https://cert.mobile-ok.com/gui/service/v1/result/request'
      : 'https://scert.mobile-ok.com/gui/service/v1/result/request',
    scriptUrl: prod
      ? 'https://cert.mobile-ok.com/resources/js/index.js'
      : 'https://scert.mobile-ok.com/resources/js/index.js',
  };
}

// 키파일 로드(캐시). 미설정 시 null → 본인확인 비활성.
// MOK_KEYFILE_B64(권장) 우선, 없으면 MOK_KEYFILE_PATH.
let cachedKey: MokKeyInfo | null = null;
export async function loadKeyInfo(): Promise<MokKeyInfo | null> {
  if (cachedKey) return cachedKey;
  const b64 = process.env.MOK_KEYFILE_B64;
  const path = process.env.MOK_KEYFILE_PATH;
  const pw = process.env.MOK_KEY_PASSWORD;
  if (!pw || (!b64 && !path)) return null;
  try {
    const buf = b64 ? Buffer.from(b64, 'base64') : await (await import('fs/promises')).readFile(path as string);
    cachedKey = decryptKeyInfo(buf, pw);
    return cachedKey;
  } catch (e) {
    console.error('[mobileok] 키파일 로드 실패:', e);
    return null;
  }
}

export function isMokConfigured(): boolean {
  return !!(process.env.MOK_KEY_PASSWORD && (process.env.MOK_KEYFILE_B64 || process.env.MOK_KEYFILE_PATH));
}

// 이용상품/이용코드 기본값
export const MOK_SERVICE_TYPE = 'telcoAuth'; // 휴대폰 본인확인
export const MOK_USAGE_SIGNUP = '01001'; // 회원가입
