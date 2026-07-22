import PageContent from '@/components/PageContent';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function TermsPage() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('site_pages')
    .select('title, subtitle, content')
    .eq('slug', 'terms')
    .maybeSingle();

  const title = data?.title || '이용약관';
  const subtitle = data?.subtitle || '';
  const content = data?.content || '';

  return (
    <div className="max-w-200 mx-auto px-5 py-8">
      <h1 className="text-xl font-bold text-zinc-900 mb-2">{title}</h1>
      {subtitle && <p className="text-[13px] text-zinc-500 mb-8">{subtitle}</p>}

      <div className="card p-6">
        {content ? (
          <PageContent content={content} />
        ) : (
          <p className="text-[13px] text-zinc-500">내용이 아직 등록되지 않았습니다.</p>
        )}
      </div>
    </div>
  );
}
