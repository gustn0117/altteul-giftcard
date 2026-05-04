import Link from 'next/link';
import { Info, AlertTriangle } from 'lucide-react';

/** 메인 — 이용안내 / 주의사항 (컴팩트) */
export default function QuickLinks() {
  return (
    <section>
      <div className="grid grid-cols-2 bg-white border border-gray-200 rounded-xl overflow-hidden divide-x divide-gray-200">
        <Link
          href="/guide"
          className="flex items-center justify-center gap-1.5 py-2 px-2 text-gray-700 hover:text-accent transition-colors text-[12.5px] font-bold"
        >
          <Info size={14} /> 이용안내
        </Link>
        <Link
          href="/fraud"
          className="flex items-center justify-center gap-1.5 py-2 px-2 text-gray-700 hover:text-rose-600 transition-colors text-[12.5px] font-bold"
        >
          <AlertTriangle size={14} /> 주의사항
        </Link>
      </div>
    </section>
  );
}
