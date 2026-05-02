'use client';

import { use, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, Clock, Pencil, Tag, ShoppingCart, Phone, MessageSquare, CheckCircle, Timer, RotateCcw } from 'lucide-react';
import { getPost, togglePostComplete, extendPostExpiry } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { DBPost, DBUser } from '@/lib/types';
import { getCategoryName } from '@/data/mock';
import { BrandLogo } from '@/components/BrandLogo';
import HomeAside from '@/components/layout/HomeAside';

type PostWithAuthor = DBPost & { author: DBUser };

function maskPhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length < 8) return '연락처 비공개';
  // 010-****-1234 형식
  if (digits.length === 11) return `${digits.slice(0, 3)}-****-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-***-${digits.slice(6)}`;
  return digits.slice(0, 3) + '****' + digits.slice(-4);
}

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

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const [post, setPost] = useState<PostWithAuthor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => {
    return getPost(id)
      .then((data) => setPost(data))
      .catch((err) => setError(err.message || '게시글을 불러오지 못했습니다.'));
  }, [id]);

  useEffect(() => {
    setLoading(true);
    reload().finally(() => setLoading(false));
  }, [reload]);

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
  const isAuthor = (isLoggedIn && user?.id === post.author_id) || isGuestPost;
  const authorName = post.author?.name || post.guest_name || '알 수 없음';
  const backTab = isSell ? 'sell' : 'buy';
  const headerLabel = isSell ? '상품권 팝니다' : '상품권 삽니다';
  const HeaderIcon = isSell ? Tag : ShoppingCart;

  const isCompleted = !!post.completed_at;
  const rawPhone = post.guest_phone || post.author?.phone || '';

  /**
   * 연락처 노출 정책 (팝니다/sell 글 한정)
   * - 작성자 본인: 항상 보임
   * - 글 완료 처리됨 (isCompleted): 누구라도 가림 (작성자 제외)
   * - 삽니다(buy): 모두 공개
   * - 팝니다(sell): 로그인 + contact_view_until > now 인 회원만
   */
  const now = Date.now();
  const hasViewPermission = !!user?.contact_view_until && new Date(user.contact_view_until).getTime() > now;
  const showRealPhone = isAuthor
    || (!isSell)                                  // 삽니다 = 모두 공개
    || (!isCompleted && hasViewPermission);       // 팝니다 = 권한 회원만, 완료 시 X
  const contactPhone = showRealPhone ? rawPhone : '';
  const remaining = formatRemainingTime(post.expires_at);
  const viewRemainingMs = user?.contact_view_until ? new Date(user.contact_view_until).getTime() - now : 0;

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

  const handleExtend = async () => {
    if (!isAuthor) return;
    const days = isSell ? 7 : 7;
    if (!confirm(`만료를 ${days}일 연장하시겠습니까?`)) return;
    setBusy(true);
    try {
      await extendPostExpiry(id, days);
      await reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : '연장 실패');
    } finally {
      setBusy(false);
    }
  };

  const handleCall = () => {
    if (!contactPhone) return;
    window.location.href = `tel:${contactPhone.replace(/[^0-9]/g, '')}`;
  };

  const handleSms = () => {
    if (!contactPhone) return;
    window.location.href = `sms:${contactPhone.replace(/[^0-9]/g, '')}`;
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
          {isCompleted && (
            <div className="mb-3 px-4 py-3 bg-zinc-100 border border-zinc-300 text-[13px] text-zinc-700 flex items-center gap-2">
              <CheckCircle size={16} /> <strong>판매완료</strong> 처리된 글입니다. 연락처는 비공개됩니다.
              {isAuthor && (
                <button onClick={handleToggleComplete} disabled={busy} className="ml-auto text-[12px] text-accent hover:underline">
                  완료 해제
                </button>
              )}
            </div>
          )}
          {/* 권한 회원에게: 잔여 시간 표시 */}
          {isSell && !isAuthor && !isCompleted && hasViewPermission && (
            <div className="mb-3 px-4 py-2 bg-emerald-50 border border-emerald-200 text-[12px] text-emerald-800 flex items-center gap-2">
              <Eye size={14} /> 연락처 열람 권한 활성 — 만료까지 <strong>{formatRemainingTime(user!.contact_view_until)}</strong>
            </div>
          )}
          {!isCompleted && !isAuthor && remaining && (
            <div className="mb-3 px-4 py-2 bg-gray-50 border border-gray-200 text-[12px] text-gray-600 flex items-center gap-2">
              <Timer size={14} className="text-accent" /> 글 만료까지 {remaining} <span className="text-gray-400">(만료 시 작성자가 7일 연장 가능)</span>
            </div>
          )}
          {!isCompleted && isAuthor && remaining && (
            <div className="mb-3 px-4 py-2 bg-gray-50 border border-gray-200 text-[12px] text-gray-600 flex items-center gap-2">
              <Timer size={14} className="text-accent" /> 만료까지 {remaining}
              <button onClick={handleExtend} disabled={busy} className="ml-auto text-[12px] text-accent font-bold hover:underline flex items-center gap-1">
                <RotateCcw size={11} /> 7일 연장
              </button>
            </div>
          )}

          <article className="bg-white border border-gray-200 mb-4">
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
              <Link href={`/board?tab=${backTab}`} className="flex items-center gap-1 text-[12px] text-gray-500 hover:text-accent">
                <ArrowLeft size={12} /> 목록
              </Link>
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
                {isSell && post.percentage != null ? (
                  /* 팝니다: 매입률 + 발송일 */
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-[13px]">
                    <div>
                      <p className="text-[11px] text-gray-400 mb-1">상품권 종류</p>
                      <p className="font-bold text-gray-800">{getCategoryName(post.category)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 mb-1">매입률</p>
                      <p className="font-bold text-accent text-[20px]">{post.percentage}%</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 mb-1">발송 예정일</p>
                      <p className="font-bold text-gray-800">{post.send_month}월 {post.send_day}일</p>
                    </div>
                  </div>
                ) : (
                  /* 삽니다 또는 기존 데이터: 액면가/할인율/가격 */
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[13px]">
                    <div>
                      <p className="text-[11px] text-gray-400 mb-1">상품권 종류</p>
                      <p className="font-bold text-gray-800">{getCategoryName(post.category)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 mb-1">액면가</p>
                      <p className="font-bold text-gray-800">{(post.face_value ?? 0).toLocaleString()}원</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 mb-1">할인율</p>
                      <p className="font-bold text-accent">{post.discount ?? 0}%</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 mb-1">{isSell ? '판매가' : '희망가'}</p>
                      <p className="font-bold text-[16px] text-gray-900">{(post.price ?? 0).toLocaleString()}원</p>
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
                  <p className="text-[11px] text-gray-400 mb-1">발송 방법</p>
                  <p className="font-medium text-gray-700">{post.delivery_method || '-'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 mb-1">발송 안내</p>
                  <p className="font-medium text-gray-700">{post.delivery || '판매일로부터 7일 이내 발송'}</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            {!isAuthor && (
              <div className="px-5 py-5 bg-gray-50 space-y-2">
                {showRealPhone && rawPhone ? (
                  <>
                    <div className="flex items-center justify-center gap-2 py-2 text-[14px] font-bold text-gray-900 whitespace-nowrap">
                      <Phone size={16} className="text-accent shrink-0" />
                      <span className="tabular-nums">{rawPhone}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={handleCall} className="btn-accent w-full h-11 text-[13px]">
                        <Phone size={14} /> 전화하기
                      </button>
                      <button onClick={handleSms} className="btn-secondary w-full h-11 text-[13px]">
                        <MessageSquare size={14} /> 문자하기
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-500 text-center leading-relaxed">
                      {isSell ? '판매자' : '구매자'}에게 직접 전화 또는 문자로 협의하세요.
                    </p>
                  </>
                ) : !showRealPhone && rawPhone ? (
                  <div className="text-center py-4 space-y-3">
                    <p className="text-[14px] font-bold text-zinc-500 tabular-nums">{maskPhone(rawPhone)}</p>
                    {isCompleted ? (
                      <p className="text-[11px] text-zinc-400">판매완료된 글입니다. 연락처가 비공개되었습니다.</p>
                    ) : !isLoggedIn ? (
                      <>
                        <p className="text-[11.5px] text-zinc-500">연락처는 권한 회원만 볼 수 있습니다.</p>
                        <Link href={`/login?redirect=${encodeURIComponent(`/board/${id}`)}`}
                          className="inline-flex items-center gap-1 h-9 px-4 bg-accent hover:bg-blue-700 text-white text-[12.5px] font-bold rounded-full transition-colors">
                          로그인 →
                        </Link>
                      </>
                    ) : (
                      <>
                        <p className="text-[11.5px] text-zinc-500">연락처 열람 권한이 없습니다.</p>
                        <p className="text-[10.5px] text-zinc-400 leading-relaxed">
                          매입 업체로 활동하시려면 운영자에게 권한 신청을 해주세요.<br/>
                          (1일 / 7일 / 30일 단위 부여)
                        </p>
                        <Link href="/contact" className="inline-flex items-center gap-1 h-9 px-4 border-2 border-accent text-accent hover:bg-accent hover:text-white text-[12.5px] font-bold rounded-full transition-colors">
                          권한 문의 →
                        </Link>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-[12px] text-gray-500 text-center py-4">
                    연락처가 등록되지 않았습니다.
                  </p>
                )}
              </div>
            )}

            {/* Bottom nav */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
              <Link href={`/board?tab=${backTab}`} className="btn-secondary h-8 px-3 text-[12px]">
                <ArrowLeft size={12} /> 목록
              </Link>
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
