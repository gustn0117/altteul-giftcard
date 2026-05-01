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
