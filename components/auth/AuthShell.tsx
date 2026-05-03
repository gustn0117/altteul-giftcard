import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Zap, Users } from 'lucide-react';

const FEATURES = [
  { Icon: ShieldCheck, title: '안전한 거래', desc: '검증된 매입 업체와 안전하게 거래하세요.' },
  { Icon: Zap, title: '빠른 매입', desc: '실시간 매입률 비교, 즉시 발송까지.' },
  { Icon: Users, title: '검증된 매입 업체', desc: '운영자가 검토한 사업자만 노출됩니다.' },
];

interface AuthShellProps {
  /** 우측 폼 영역 */
  children: React.ReactNode;
  /** 우측 상단 작은 라벨 (예: "로그인", "회원가입") */
  eyebrow?: string;
  /** 좌측 패널의 큰 카피 */
  headline?: string;
  /** 좌측 패널의 서브 카피 */
  sub?: string;
}

export default function AuthShell({
  children,
  eyebrow,
  headline = '상품권을 더 똑똑하게,\n예판상품권에서.',
  sub = '전국 매입 업체와 한 곳에서 비교하고 거래하세요.',
}: AuthShellProps) {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-8 bg-gradient-to-br from-blue-50/40 via-white to-blue-50/30">
      <div className="w-full max-w-[960px] grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] bg-white border border-gray-200 rounded-2xl shadow-[0_8px_32px_rgba(15,23,42,0.06)] overflow-hidden">

        {/* 좌측 브랜드 패널 */}
        <aside
          className="hidden lg:flex flex-col justify-between p-10 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 50%, #2563EB 100%)' }}
        >
          {/* 장식 원 */}
          <div aria-hidden className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
          <div aria-hidden className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-blue-300/20 blur-3xl" />

          <div className="relative z-10">
            <Link href="/" className="inline-block">
              <Image src="/logo-light.svg" alt="예판상품권" width={240} height={64} className="h-14 w-auto" priority />
            </Link>
            <h2 className="text-[24px] font-bold mt-8 leading-snug whitespace-pre-line">
              {headline}
            </h2>
            <p className="text-[13px] text-blue-100 mt-3 leading-relaxed">{sub}</p>
          </div>

          <ul className="relative z-10 space-y-3 mt-10">
            {FEATURES.map(({ Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="shrink-0 w-8 h-8 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center">
                  <Icon size={15} className="text-white" />
                </span>
                <div className="leading-tight">
                  <p className="text-[13px] font-bold">{title}</p>
                  <p className="text-[11px] text-blue-100/80 mt-0.5">{desc}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="relative z-10 text-[10px] text-blue-200/70 mt-10">
            © 예판상품권 — 안전한 상품권 매입 중개 플랫폼
          </p>
        </aside>

        {/* 우측 폼 */}
        <section className="p-7 sm:p-10">
          {/* 모바일에서만 보이는 로고 */}
          <Link href="/" className="lg:hidden flex justify-center mb-5">
            <Image src="/logo.svg" alt="예판상품권" width={200} height={54} className="h-12 w-auto" priority />
          </Link>
          {eyebrow && (
            <p className="text-[11px] font-bold tracking-[2px] text-accent uppercase mb-2">{eyebrow}</p>
          )}
          {children}
        </section>
      </div>
    </div>
  );
}
