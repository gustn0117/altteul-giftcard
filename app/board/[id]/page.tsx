'use client';

import { use, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, Clock, Pencil, Tag, ShoppingCart, CheckCircle, Timer, RotateCcw } from 'lucide-react';
import { getPost, togglePostComplete, requestExtension } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import ContactReveal from '@/components/board/ContactReveal';
import type { DBPost, DBUser } from '@/lib/types';
import { getCategoryName } from '@/data/mock';
import { BrandLogo } from '@/components/BrandLogo';
import HomeAside from '@/components/layout/HomeAside';

type PostWithAuthor = DBPost & { author: DBUser };

function formatRemainingTime(expiresAt: string | null): string | null {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return '만료됨';
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  if (days > 0) return `${days}일 ${hours}시간 남음`;
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}시간 ${minutes}분 남음`;
}

const DM_LABELS: Record<string, string> = { mobile: '모바일', parcel: '택배', direct: '직접만남' };
function deliveryMethodText(dm: string | null | undefined): string {
  return (dm || '').split(',').map((s) => DM_LABELS[s.trim()] || s.trim()).filter(Boolean).join(', ') || '-';
}

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const [post, setPost] = useState<PostWithAuthor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [buyPublic, setBuyPublic] = useState(true); // 삽니다 연락처 공개 설정 (기본 공개)

  const reload = useCallback(() => {
    return getPost(id)
      .then((data) => setPost(data))
      .catch((err) => setError(err.message || '게시글을 불러오지 못했습니다.'));
  }, [id]);

  useEffect(() => {
    setLoading(true);
    reload().finally(() => setLoading(false));
  }, [reload]);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => setBuyPublic(d.buy_contact_public !== false))
      .catch(() => {});
  }, []);

  if (loading) {
    return <div className="container-main py-20 text-center text-gray-400 text-[13px]">불러오는 중...</div>;
  }

  if (error || !post) {
    return (
      <div className="container-main py-20 text-center">
        <p className="text-gray-500 text-[13px] mb-4">{error || '게시글을 찾을 수 없습니다.'}</p>
        <Link href="/board" className="text-[12px] text-accent font-bold hover:underline">← 목록으로</Link>
      </div>
    );
  }

  const isSell = post.type === 'sell';
  const isGuestPost = !post.author_id;
  // 비회원 글은 로그인 세션으로 작성자를 식별할 수 없으므로 방문자를 작성자로 취급하면 안 된다.
  // (예전엔 || isGuestPost 라서 비회원 글의 블라인드·완료해제·연장 권한이 모두 뚫렸음)
  const isAuthor = isLoggedIn && !!post.author_id && user?.id === post.author_id;
  const authorName = post.author?.name || post.guest_name || '알 수 없음';
  const backTab = isSell ? 'sell' : 'buy';
  const headerLabel = isSell ? '상품권 팝니다' : '상품권 삽니다';
  const HeaderIcon = isSell ? Tag : ShoppingCart;

  // '목록' 버튼은 브라우저 뒤로가기와 똑같이 동작 → 보던 페이지·지역·스크롤 위치 그대로 복원.
  // 목록에서 들어온 게 아니거나(직접 URL 접속) 히스토리가 없으면 목록 첫 화면으로.
  const goToList = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push(`/board?tab=${backTab}`);
  };

  const isCompleted = !!post.completed_at;
  const rawPhone = post.guest_phone || post.author?.phone || '';
  const remaining = formatRemainingTime(post.expires_at);

  const handleToggleComplete = async () => {
    if (!isAuthor) return;
    const next = !isCompleted;
    if (next && !confirm('판매완료로 표시하면 연락처가 비공개되고 글이 회색 처리됩니다. 진행할까요?')) return;
    if (!next && !confirm('판매완료를 해제하시겠습니까?')) return;
    setBusy(true);
    try {
      await togglePostComplete(id, next);
      await reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : '처리 실패');
    } finally {
      setBusy(false);
    }
  };

  // 직접 연장이 아니라 '연장 신청' — 실제 연장은 관리자가 기간을 정해 승인한다
  const handleExtend = async () => {
    if (!isAuthor) return;
    if (!confirm('게시기간 연장을 신청하시겠습니까?\n관리자 승인 후 연장됩니다.')) return;
    setBusy(true);
    try {
      await requestExtension(id);
      await reload();
      alert('연장 신청이 접수되었습니다. 관리자 승인 후 연장됩니다.');
    } catch (err) {
      alert(err instanceof Error ? err.message : '연장 신청 실패');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-main py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[18px] font-bold text-gray-800">{headerLabel}</h1>
        <div className="breadcrumb">
          <Link href="/">HOME</Link> &gt; <Link href={`/board?tab=${backTab}`}>{headerLabel}</Link> &gt; 상세
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <HomeAside />

        <div className="flex-1 min-w-0">
          {/* 상태 안내 배너 */}
          {post.type === 'buy' && !post.approved_at && (
            <div className="mb-3 px-4 py-3 bg-amber-50 border border-amber-200 text-[13px] text-amber-800 flex items-start gap-2">
              <Clock size={16} className="shrink-0 mt-0.5" />
              <span className="min-w-0"><strong>승인 대기 중</strong>인 구매글입니다. 관리자 승인(게시 기간 설정) 후 목록에 노출됩니다.</span>
            </div>
          )}
          {isCompleted && (
            <div className="mb-3 px-4 py-3 bg-zinc-100 border border-zinc-300 text-[13px] text-zinc-700 flex items-start gap-2">
              <CheckCircle size={16} className="shrink-0 mt-0.5" />
              <span className="min-w-0"><strong>판매완료</strong> 처리된 글입니다. 연락처는 비공개됩니다.</span>
              {isAuthor && (
                <button onClick={handleToggleComplete} disabled={busy} className="ml-auto shrink-0 text-[12px] text-accent hover:underline">
                  완료 해제
                </button>
              )}
            </div>
          )}
          {!isCompleted && !isAuthor && remaining && (
            <div className="mb-3 px-4 py-2 bg-gray-50 border border-gray-200 text-[12px] text-gray-600 flex items-start gap-2">
              <Timer size={14} className="text-accent shrink-0 mt-0.5" />
              <span className="min-w-0">글 만료까지 {remaining}</span>
            </div>
          )}
          {!isCompleted && isAuthor && (
            <div className="mb-3 px-4 py-2 bg-gray-50 border border-gray-200 text-[12px] text-gray-600 flex items-center gap-2">
              <Timer size={14} className="text-accent shrink-0" />
              {remaining ? `만료까지 ${remaining}` : '게시기간이 만료되어 광고칸에서 내려간 상태입니다. (글은 삭제되지 않습니다)'}
              {post.extension_requested_at ? (
                <span className="ml-auto shrink-0 text-[12px] text-amber-600 font-bold">연장 신청됨 · 승인 대기</span>
              ) : (
                <button onClick={handleExtend} disabled={busy} className="ml-auto shrink-0 text-[12px] text-accent font-bold hover:underline flex items-center gap-1">
                  <RotateCcw size={11} /> 연장 신청
                </button>
              )}
            </div>
          )}

          <article className="bg-white border border-gray-200 mb-4 overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
              <button type="button" onClick={goToList} className="flex items-center gap-1 text-[12px] text-gray-500 hover:text-accent">
                <ArrowLeft size={12} /> 목록
              </button>
              <span className="flex items-center gap-1.5 text-[12px] text-accent font-bold">
                <HeaderIcon size={12} /> {headerLabel}
              </span>
              {isAuthor ? (
                <div className="flex items-center gap-3">
                  <Link href={`/board/write?edit=${post.id}`} className="text-[11px] text-gray-500 hover:text-accent flex items-center gap-0.5">
                    <Pencil size={11} /> 수정
                  </Link>
                  {!isCompleted && (
                    <button onClick={handleToggleComplete} disabled={busy} className="flex items-center gap-1 text-[11px] text-zinc-600 hover:text-zinc-900 font-bold">
                      <CheckCircle size={11} /> {busy ? '처리 중...' : '판매완료'}
                    </button>
                  )}
                </div>
              ) : <span />}
            </div>

            {/* Title block */}
            <div className="px-5 py-5 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {isCompleted && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-bold rounded bg-zinc-700 text-white">
                    <CheckCircle size={11} /> 완료
                  </span>
                )}
                <BrandLogo name={getCategoryName(post.category)} size="sm" />
                {(Date.now() - new Date(post.created_at).getTime() < 3 * 86400000) && !isCompleted && (
                  <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-sm">NEW</span>
                )}
                {post.tags?.map(t => (
                  <span key={t} className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-sm">
                    {t.startsWith('#') ? t : `#${t}`}
                  </span>
                ))}
              </div>
              <h2 className="text-[18px] font-bold text-gray-800 mb-2">{post.title}</h2>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
                <span className="text-gray-700 font-medium">
                  {authorName}
                  {isGuestPost && <span className="ml-1 text-gray-400 font-normal text-[10px]">개인판매자</span>}
                </span>
                <span className="flex items-center gap-1"><Clock size={11} />{new Date(post.created_at).toLocaleString('ko-KR')}</span>
                <span className="flex items-center gap-1"><Eye size={11} />조회 {post.views}</span>
              </div>
            </div>

            {/* Info grid */}
            <div className="px-5 py-5 border-b border-gray-100">
              <div className="bg-gray-50 border border-gray-100 p-5">
                {post.percentage != null ? (
                  /* 팝니다=판매율+발송일 / 삽니다=매입률+매입가능시간 */
                  /* 3개 항목을 항상 가로 한 줄로 */
                  <div className="grid grid-cols-3 gap-2 md:gap-4 text-[13px]">
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-400 mb-1 whitespace-nowrap">상품권 종류</p>
                      <p className="font-bold text-gray-800 truncate">{getCategoryName(post.category)}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-400 mb-1 whitespace-nowrap">{isSell ? '판매율' : '매입률'}</p>
                      <p className="font-bold text-accent text-[18px] md:text-[20px] whitespace-nowrap">{post.percentage}%</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-400 mb-1 whitespace-nowrap">{isSell ? '발송 예정일' : '매입 가능 시간'}</p>
                      <p className="font-bold text-gray-800 truncate">
                        {isSell
                          ? (post.send_month && post.send_day ? `${post.send_month}월 ${post.send_day}일` : '협의')
                          : (post.delivery || '-')}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* 삽니다 또는 기존 데이터: 액면가/할인율/가격 */
                  <div className="grid grid-cols-4 gap-2 md:gap-4 text-[12px] md:text-[13px]">
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-400 mb-1 whitespace-nowrap">상품권 종류</p>
                      <p className="font-bold text-gray-800 truncate">{getCategoryName(post.category)}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-400 mb-1 whitespace-nowrap">액면가</p>
                      <p className="font-bold text-gray-800 truncate">{(post.face_value ?? 0).toLocaleString()}원</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-400 mb-1 whitespace-nowrap">할인율</p>
                      <p className="font-bold text-accent whitespace-nowrap">{post.discount ?? 0}%</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-400 mb-1 whitespace-nowrap">{isSell ? '판매가' : '희망가'}</p>
                      <p className="font-bold text-[14px] md:text-[16px] text-gray-900 truncate">{(post.price ?? 0).toLocaleString()}원</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="px-5 py-5 border-b border-gray-100">
              {post.description && (
                <div className="mb-4">
                  <p className="text-[11px] text-gray-400 mb-2">상세 설명</p>
                  <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap">{post.description}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px]">
                <div>
                  <p className="text-[11px] text-gray-400 mb-1">배송 방법</p>
                  <p className="font-medium text-gray-700">{deliveryMethodText(post.delivery_method)}</p>
                </div>
                {isSell && (
                  <div>
                    <p className="text-[11px] text-gray-400 mb-1">발송 안내</p>
                    <p className="font-medium text-gray-700">{post.delivery || '판매일로부터 7일 이내 발송'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 연락처 (팝니다=블라인드+500P 열람 / 삽니다=설정에 따라 공개) */}
            <div className="px-5 py-5 bg-gray-50">
              <ContactReveal
                postId={id}
                postType={isSell ? 'sell' : 'buy'}
                rawPhone={rawPhone}
                authorName={authorName}
                isAuthor={isAuthor}
                isCompleted={isCompleted}
                isLoggedIn={isLoggedIn}
                currentUserId={user?.id}
                buyPublic={buyPublic}
              />
            </div>

            {/* 업체 소개 (업체회원이 업체소개 페이지에서 등록한 경우) */}
            {post.author?.type === 'business' && (post.author.intro || post.author.intro_image_url || post.author.business_hours) && (
              <div className="px-5 py-5 border-t border-gray-100">
                <p className="text-[12px] font-bold text-gray-800 mb-3">업체 소개</p>
                {post.author.intro_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.author.intro_image_url} alt={`${authorName} 소개`}
                    className="w-full max-h-56 object-cover rounded-lg border border-gray-200 mb-3" />
                )}
                {post.author.intro && (
                  <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap mb-3">{post.author.intro}</p>
                )}
                {post.author.business_hours && (
                  <div className="flex items-center gap-2 text-[12px]">
                    <span className="text-gray-400">운영 시간</span>
                    <span className="font-medium text-gray-700">{post.author.business_hours}</span>
                  </div>
                )}
              </div>
            )}

            {/* Bottom nav */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
              <button type="button" onClick={goToList} className="btn-secondary h-8 px-3 text-[12px]">
                <ArrowLeft size={12} /> 목록
              </button>
              <Link href={`/board/write?type=${backTab}`} className="btn-accent h-8 px-3 text-[12px]">
                새 글 작성
              </Link>
            </div>
          </article>
        </div>

      </div>
    </div>
  );
}
