import Link from 'next/link';
import PageContent from '@/components/PageContent';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const TABS = [
  { key: 'user', slug: 'guide-user', label: '고객 이용안내' },
  { key: 'business', slug: 'guide-business', label: '업체 이용안내' },
  { key: 'about', slug: 'guide-about', label: '회사소개' },
] as const;

export default async function GuidePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const sp = await searchParams;
  const active = TABS.find((t) => t.key === sp.tab) ?? TABS[0];

  const supabase = createServiceClient();
  const { data } = await supabase
    .from('site_pages')
    .select('title, subtitle, content')
    .eq('slug', active.slug)
    .maybeSingle();

  return (
    <div className="container-main py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[18px] font-bold text-gray-800">이용안내</h1>
        <div className="breadcrumb">
          <Link href="/">HOME</Link> &gt; 이용안내
        </div>
      </div>

      <div className="bg-white border border-gray-200">
        {/* 탭 */}
        <div className="flex border-b border-gray-200">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/guide?tab=${t.key}`}
              className={`flex-1 py-3 text-center text-[13px] transition-colors ${
                active.key === t.key ? 'font-bold text-accent border-b-2 border-accent bg-accent/5' : 'text-gray-500 hover:text-accent'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* 내용 */}
        <div className="p-5 md:p-6">
          {data?.subtitle && <p className="text-[13px] text-zinc-500 mb-4">{data.subtitle}</p>}
          {data?.content ? (
            <PageContent content={data.content} />
          ) : (
            <p className="text-[13px] text-zinc-500">내용이 아직 등록되지 않았습니다.</p>
          )}
        </div>
      </div>

      {/* 하단 도움 링크 */}
      <div className="mt-6 bg-accent/5 border border-accent/20 p-6 text-center">
        <h3 className="text-[15px] font-bold mb-2">더 궁금한 점이 있으신가요?</h3>
        <p className="text-[12px] text-gray-600 mb-4">자주 묻는 질문(FAQ)이나 사기 방지 안내를 확인하세요.</p>
        <div className="flex items-center justify-center gap-2">
          <Link href="/faq" className="btn-secondary h-9 px-4 text-[12px]">자주 묻는 질문</Link>
          <Link href="/fraud" className="btn-accent h-9 px-4 text-[12px]">사기 방지 안내</Link>
        </div>
      </div>
    </div>
  );
}
