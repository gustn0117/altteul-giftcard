// 숫자에 쉼표 추가: 1234567 -> "1,234,567"
export function formatNumber(value: string | number): string {
  const num = String(value).replace(/[^0-9]/g, '');
  if (!num) return '';
  return Number(num).toLocaleString('ko-KR');
}

// 쉼표 제거하고 숫자만 반환: "1,234,567" -> "1234567"
export function parseNumber(value: string): string {
  return value.replace(/[^0-9]/g, '');
}

// 전화번호를 하이픈 형식으로: 01079901400 -> 010-7990-1400
export function formatPhone(raw?: string | null): string {
  const d = (raw || '').replace(/[^0-9]/g, '');
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) {
    if (d.startsWith('02')) return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  }
  if (d.length === 9 && d.startsWith('02')) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
  return raw || '';
}
