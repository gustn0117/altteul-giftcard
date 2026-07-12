'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Phone, MapPin, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getPosts } from '@/lib/api';
// useAuth removed - 비회원도 번호 공개
import { useCallModal } from '@/contexts/CallModalContext';
import SellPostItem from '@/components/home/SellPostItem';
import type { DBPremiumBuyer } from '@/lib/types';
import type { DBPost, DBUser } from '@/lib/types';

type PostWithAuthor = DBPost & { author: DBUser };

export default function BuyerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { openCall } = useCallModal();
  // 비회원도 번호 공개
  const [buyer, setBuyer] = useState<DBPremiumBuyer | null>(null);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      supabase.from('premium_buyers').select('*').eq('id', id).single(),
      getPosts('buy'),
    ])
      .then(([{ data: b }, allPosts]) => {
        setBuyer(b as DBPremiumBuyer);
        // user_id로 연결된 구매글 필터
        if (b?.user_id) {
          setPosts(allPosts.filter(p => p.author_id === b.user_id));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="max-w-[740px] mx-auto px-5 py-20 text-center text-zinc-400 text-[13px]">불러오는 중...</div>;
  }

  if (!buyer) {
    return (
      <div className="max-w-[740px] mx-auto px-5 py-20 text-center">
        <p className="text-zinc-400 text-[13px] mb-4">업체를 찾을 수 없습니다.</p>
        <Link href="/" className="text-[13px] text-zinc-900 underline">홈으로</Link>
      </div>
    );
  }

  return (
    <div className="max-w-[740px] mx-auto px-5 py-6">
      <Link href="/" className="inline-flex items-center gap-1 text-[13px] text-zinc-400 hover:text-zinc-700 mb-5 transition-colors">
        <ArrowLeft size={15} /> 돌아가기
      </Link>

      {/* Hero */}
      <div className="card overflow-hidden mb-5">
        <div className="bg-zinc-900 px-6 py-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="badge bg-white/10 text-white/70">프리미엄 구매 업체</span>
            <span className="badge bg-white/10 text-white/70">AD</span>
          </div>
          <h1 className="text-white text-[20px] font-semibold mb-2">{buyer.name}</h1>
          {buyer.description && (
            <p className="text-zinc-400 text-[13px] leading-relaxed max-w-lg">{buyer.description}</p>
          )}
        </div>

        <div className="px-6 py-4 flex flex-wrap gap-4 border-b border-zinc-100">
          {buyer.phone && (
            <button
              type="button"
              onClick={() => openCall(buyer.name, buyer.phone)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-accent text-white text-[13px] font-bold hover:bg-blue-700 transition-colors"
            >
              <Phone size={14} className="shrink-0" /> 통화하기
            </button>
          )}
          {buyer.region && (
            <div className="flex items-center gap-2 text-[13px]">
              <MapPin size={14} className="text-zinc-400" />
              <span>{buyer.region}</span>
            </div>
          )}
        </div>

        {buyer.brands && buyer.brands.length > 0 && (
          <div className="px-6 py-3 flex flex-wrap gap-1.5 border-b border-zinc-100">
            <span className="text-[11px] text-zinc-400 mr-1">취급 브랜드:</span>
            {buyer.brands.map(b => (
              <span key={b} className="badge bg-zinc-100 text-zinc-600">{b}</span>
            ))}
          </div>
        )}

        <div className="px-6 py-3 flex items-center gap-2 text-[11px] text-zinc-400">
          <ShieldCheck size={13} />
          <span>예판상품권 프리미엄 인증 업체입니다. 거래 시 계약서를 반드시 확인하세요.</span>
        </div>
      </div>

      {/* 업체 구매글 */}
      {posts.length > 0 && (
        <section>
          <h2 className="section-title">{buyer.name}의 구매글</h2>
          <div className="card overflow-hidden">
            {posts.map(post => (
              <SellPostItem key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {posts.length === 0 && (
        <div className="card p-8 text-center text-zinc-400 text-[13px]">
          이 업체의 등록된 구매글이 없습니다.
        </div>
      )}
    </div>
  );
}
