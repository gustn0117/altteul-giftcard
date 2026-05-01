import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const PER_TYPE_LIMIT = 30;

function escapeIlike(raw: string) {
  return raw.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export async function GET(req: NextRequest) {
  const rawQ = (req.nextUrl.searchParams.get('q') || '').trim();
  const type = req.nextUrl.searchParams.get('type') || 'all'; // all | post | buyer | community

  if (rawQ.length < 1) {
    return NextResponse.json({ q: rawQ, posts: [], buyers: [], community: [] });
  }
  if (rawQ.length > 80) {
    return NextResponse.json({ error: '검색어가 너무 깁니다.' }, { status: 400 });
  }

  const q = escapeIlike(rawQ);
  const pattern = `%${q}%`;
  const supabase = createServiceClient();

  const wantPosts = type === 'all' || type === 'post';
  const wantBuyers = type === 'all' || type === 'buyer';
  const wantCommunity = type === 'all' || type === 'community';

  const [postsRes, buyersRes, communityRes] = await Promise.all([
    wantPosts
      ? supabase
          .from('posts')
          .select('id, type, category, title, face_value, price, discount, region, delivery, delivery_method, created_at, author_id, guest_name')
          .or(`title.ilike.${pattern},region.ilike.${pattern},delivery.ilike.${pattern},guest_name.ilike.${pattern}`)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(PER_TYPE_LIMIT)
      : Promise.resolve({ data: [], error: null }),
    wantBuyers
      ? supabase
          .from('premium_buyers')
          .select('id, name, description, phone, region, brands, image_url, tier, priority, is_active, created_at')
          .or(`name.ilike.${pattern},description.ilike.${pattern},region.ilike.${pattern}`)
          .eq('is_active', true)
          .order('priority', { ascending: false })
          .limit(PER_TYPE_LIMIT)
      : Promise.resolve({ data: [], error: null }),
    wantCommunity
      ? supabase
          .from('community_posts')
          .select('id, category, title, content, author_name, views, is_pinned, created_at')
          .or(`title.ilike.${pattern},content.ilike.${pattern},author_name.ilike.${pattern}`)
          .order('created_at', { ascending: false })
          .limit(PER_TYPE_LIMIT)
      : Promise.resolve({ data: [], error: null }),
  ]);

  // brands(text[])는 or 체인으로 ILIKE 처리 불가 → 클라이언트 사이드에서 후처리
  let buyers = buyersRes.data || [];
  if (wantBuyers) {
    const { data: brandMatched } = await supabase
      .from('premium_buyers')
      .select('id, name, description, phone, region, brands, image_url, tier, priority, is_active, created_at')
      .contains('brands', [rawQ])
      .eq('is_active', true)
      .limit(PER_TYPE_LIMIT);
    if (brandMatched && brandMatched.length) {
      const existing = new Set(buyers.map((b: { id: string }) => b.id));
      for (const b of brandMatched) {
        if (!existing.has(b.id)) buyers.push(b);
      }
      buyers = buyers.slice(0, PER_TYPE_LIMIT);
    }
  }

  return NextResponse.json({
    q: rawQ,
    posts: postsRes.data || [],
    buyers,
    community: communityRes.data || [],
    errors: {
      posts: postsRes.error?.message,
      buyers: buyersRes.error?.message,
      community: communityRes.error?.message,
    },
  });
}
