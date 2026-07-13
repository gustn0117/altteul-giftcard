-- 게시글 조회수 증가 RPC (getPost에서 supabase.rpc('increment_views', { post_id }) 호출)
-- 스키마: altteul_giftcard (클라이언트가 이 스키마로 rpc 호출)
create or replace function altteul_giftcard.increment_views(post_id uuid)
returns void
language sql
volatile
as $$
  update altteul_giftcard.posts
     set views = coalesce(views, 0) + 1
   where id = post_id;
$$;

grant execute on function altteul_giftcard.increment_views(uuid) to anon, authenticated, service_role;
