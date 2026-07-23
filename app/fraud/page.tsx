import PageContent from '@/components/PageContent';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('site_pages')
    .select('title, subtitle, content')
    .eq('slug', 'fraud')
    .maybeSingle();

  return (
    <div className="max-w-200 mx-auto px-5 py-8">
      <h1 className="text-xl font-bold text-zinc-900 mb-2">{data?.title || 'fraud'}</h1>
      {data?.subtitle && <p className="text-[13px] text-zinc-500 mb-8">{data.subtitle}</p>}
      <div className="card p-6">
        {data?.content ? (
          <PageContent content={data.content} />
        ) : (
          <p className="text-[13px] text-zinc-500">내용이 아직 등록되지 않았습니다.</p>
        )}
      </div>
    </div>
  );
}
