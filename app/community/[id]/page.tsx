'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, MessageCircle, Pin, Trash2, Send } from 'lucide-react';
import LeftSidebar from '@/components/layout/LeftSidebar';
import RightSidebar from '@/components/layout/RightSidebar';
import { useAuth } from '@/contexts/AuthContext';
import type { DBCommunityPost, DBCommunityComment, CommunityCategory } from '@/lib/types';

const CATEGORY_LABEL: Record<CommunityCategory, string> = {
  news: '업계뉴스',
  tip: '거래TIP',
  qna: '질문과답변',
};

export default function CommunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [post, setPost] = useState<DBCommunityPost | null>(null);
  const [comments, setComments] = useState<DBCommunityComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // 댓글 입력
  const [commentContent, setCommentContent] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const fetchData = () => {
    setLoading(true);
    fetch(`/api/community/posts/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.post) {
          setPost(data.post);
          setComments(data.comments || []);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/community/posts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('삭제 실패');
      router.push(`/community?cat=${post?.category}`);
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!commentContent.trim()) return;
    setCommentSubmitting(true);
    try {
      const res = await fetch('/api/community/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: id,
          author_id: user.id,
          author_name: user.name,
          content: commentContent.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '댓글 등록 실패');
      setCommentContent('');
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : '댓글 등록에 실패했습니다.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/community/comments?id=${commentId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('삭제 실패');
      fetchData();
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  if (loading) {
    return <div className="container-main py-10 text-center text-gray-400 text-[13px]">불러오는 중...</div>;
  }

  if (notFound || !post) {
    return (
      <div className="container-main py-10 text-center">
        <p className="text-[13px] text-gray-500 mb-4">게시글을 찾을 수 없습니다.</p>
        <Link href="/community" className="text-[12px] text-accent font-bold hover:underline">← 커뮤니티로 돌아가기</Link>
      </div>
    );
  }

  const isAuthor = user?.id === post.author_id;

  return (
    <div className="container-main py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[18px] font-bold text-gray-800">커뮤니티</h1>
        <div className="breadcrumb">
          <Link href="/">HOME</Link> &gt; <Link href="/community">커뮤니티</Link> &gt; <Link href={`/community?cat=${post.category}`}>{CATEGORY_LABEL[post.category]}</Link>
        </div>
      </div>

      <div className="flex gap-4">
        <LeftSidebar />

        <div className="flex-1 min-w-0">
          <article className="bg-white border border-gray-200 mb-4">
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
              <Link href={`/community?cat=${post.category}`} className="flex items-center gap-1 text-[12px] text-gray-500 hover:text-accent">
                <ArrowLeft size={12} /> 목록
              </Link>
              <span className="text-[12px] text-accent font-bold">{CATEGORY_LABEL[post.category]}</span>
              {isAuthor ? (
                <button onClick={handleDelete} className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-600">
                  <Trash2 size={11} /> 삭제
                </button>
              ) : <span />}
            </div>

            {/* Title block */}
            <div className="px-5 py-5 border-b border-gray-100">
              <div className="flex items-start gap-2 mb-2">
                {post.is_pinned && <Pin size={14} className="text-accent mt-1" />}
                <h2 className="text-[18px] font-bold text-gray-800 flex-1">{post.title}</h2>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-gray-500">
                <span>{post.author_name || '익명'}</span>
                <span>·</span>
                <span>{new Date(post.created_at).toLocaleString('ko-KR')}</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Eye size={10} /> {post.views}</span>
                <span className="flex items-center gap-1"><MessageCircle size={10} /> {comments.length}</span>
              </div>
            </div>

            {/* Images */}
            {post.images && post.images.length > 0 && (
              <div className="px-5 pt-5">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {post.images.map((url, idx) => (
                    <a key={url + idx} href={url} target="_blank" rel="noreferrer" className="block">
                      <img
                        src={url}
                        alt={`첨부 이미지 ${idx + 1}`}
                        loading="lazy"
                        className="w-full aspect-square object-cover rounded border border-gray-200 hover:opacity-90 transition-opacity"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Content */}
            <div className="px-5 py-6 text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap min-h-[200px]">
              {post.content || <span className="text-gray-400">내용이 없습니다.</span>}
            </div>

            {/* Bottom nav */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
              <Link href={`/community?cat=${post.category}`} className="btn-secondary h-8 px-3 text-[12px]">
                <ArrowLeft size={12} /> 목록
              </Link>
              <Link href={`/community/write?cat=${post.category}`} className="btn-accent h-8 px-3 text-[12px]">
                새 글 작성
              </Link>
            </div>
          </article>

          {/* Comments */}
          <section className="bg-white border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h3 className="text-[13px] font-bold">
                댓글 <span className="text-accent">{comments.length}</span>
              </h3>
            </div>

            <div className="divide-y divide-gray-100">
              {comments.length === 0 ? (
                <p className="px-4 py-8 text-center text-[12px] text-gray-400">첫 댓글을 남겨보세요.</p>
              ) : comments.map(c => (
                <div key={c.id} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold text-gray-800">{c.author_name || '익명'}</span>
                      <span className="text-[10px] text-gray-400">{new Date(c.created_at).toLocaleString('ko-KR')}</span>
                    </div>
                    {user?.id && c.author_id === user.id && (
                      <button onClick={() => handleCommentDelete(c.id)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                  <p className="text-[12px] text-gray-700 whitespace-pre-wrap leading-relaxed">{c.content}</p>
                </div>
              ))}
            </div>

            {/* Comment form */}
            {user ? (
              <form onSubmit={handleCommentSubmit} className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2 mb-2 text-[11px] text-gray-500">
                  <span className="text-[12px] font-bold text-gray-800">{user.name}</span>
                  <span>로 댓글 작성</span>
                </div>
                <div className="flex gap-2">
                  <textarea
                    value={commentContent}
                    onChange={e => setCommentContent(e.target.value)}
                    placeholder="댓글을 입력하세요 (최대 1000자)"
                    maxLength={1000}
                    rows={3}
                    className="flex-1 px-3 py-2 border border-gray-300 text-[12px] bg-white focus:border-accent focus:outline-none resize-y"
                  />
                  <button
                    type="submit"
                    disabled={commentSubmitting || !commentContent.trim()}
                    className="btn-accent h-[52px] w-12 shrink-0 disabled:opacity-60"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 border-t border-gray-200 bg-gray-50 text-center">
                <p className="text-[12px] text-gray-500 mb-2">댓글을 작성하려면 로그인이 필요합니다.</p>
                <Link
                  href={`/login?redirect=${encodeURIComponent(`/community/${id}`)}`}
                  className="btn-accent inline-flex h-9 px-4 text-[12px]"
                >
                  로그인하기
                </Link>
              </div>
            )}
          </section>
        </div>

        <RightSidebar />
      </div>
    </div>
  );
}
