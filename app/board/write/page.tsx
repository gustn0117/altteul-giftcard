'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Lock, Tag, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { categories } from '@/data/mock';
import { createPost, getPost, updatePost } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatNumber, parseNumber } from '@/lib/format';
import LeftSidebar from '@/components/layout/LeftSidebar';
import RightSidebar from '@/components/layout/RightSidebar';

// 만료 정책 (일 단위)
const SELL_EXPIRE_DAYS = 7;   // 팝니다: 7일 후 잠금 (30일 후 자동삭제)
const BUY_EXPIRE_DAYS = 7;    // 삽니다: 7일 후 잠금 (운영자 해제)

export default function WritePostPage() {
  return (
    <Suspense fallback={<div className="container-main py-20 text-center text-gray-400 text-[13px]">불러오는 중...</div>}>
      <WritePostContent />
    </Suspense>
  );
}

function WritePostContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoggedIn } = useAuth();

  const editId = searchParams.get('edit');
  const postType = (searchParams.get('type') as 'sell' | 'buy') || 'sell';
  const isEdit = !!editId;
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAuthChecked(true), 50);
    return () => clearTimeout(t);
  }, []);

  // 삽니다(buy) 글은 로그인 필수
  useEffect(() => {
    if (!authChecked || isEdit) return;
    if (postType === 'buy' && !isLoggedIn) {
      const redirect = encodeURIComponent('/board/write?type=buy');
      router.replace(`/login?redirect=${redirect}`);
    }
  }, [authChecked, postType, isLoggedIn, isEdit, router]);

  const [form, setForm] = useState({
    type: postType,
    category: '',
    categoryName: '',
    title: '',
    // 팝니다 신규: 매입률(%) + 발송 월/일
    percentage: '',
    sendMonth: '',
    sendDay: '',
    // 삽니다 (기존 금액 방식 유지)
    faceValue: '',
    price: '',
    delivery: '7일 이내 발송',
    deliveryMethod: 'mobile',
    description: '',
    region: '',
    guestName: '',
    guestPassword: '',
    guestPhone: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(isEdit);
  const [editAuth, setEditAuth] = useState({ verified: false, password: '' });
  const [editPost, setEditPost] = useState<{ guest_password?: string | null; author_id?: string | null } | null>(null);

  useEffect(() => {
    if (editId) {
      setLoadingEdit(true);
      getPost(editId)
        .then((post) => {
          setEditPost({ guest_password: post.guest_password, author_id: post.author_id });
          setForm((prev) => ({
            ...prev,
            type: post.type,
            category: post.category,
            categoryName: '',
            title: post.title,
            percentage: post.percentage != null ? String(post.percentage) : '',
            sendMonth: post.send_month != null ? String(post.send_month) : '',
            sendDay: post.send_day != null ? String(post.send_day) : '',
            faceValue: post.face_value != null ? String(post.face_value) : '',
            price: post.price != null ? String(post.price) : '',
            delivery: post.delivery || '7일 이내 발송',
            deliveryMethod: post.delivery_method || 'mobile',
            description: '',
            region: '',
            guestName: post.guest_name || '',
            guestPhone: post.guest_phone || '',
          }));

          // 회원 글이면 로그인 필요
          if (post.author_id && post.author_id !== user?.id) {
            alert('본인 글만 수정할 수 있습니다.');
            router.push(`/board/${editId}`);
            return;
          }
          if (post.author_id && post.author_id === user?.id) {
            setEditAuth({ verified: true, password: '' });
          }
        })
        .catch(() => {
          alert('게시글을 불러오지 못했습니다.');
          router.push('/board');
        })
        .finally(() => setLoadingEdit(false));
    }
  }, [editId, router, user?.id]);

  const handleChange = (field: string, value: string) => {
    if (field === 'type' && value === 'buy' && !isLoggedIn && !isEdit) {
      const redirect = encodeURIComponent('/board/write?type=buy');
      router.push(`/login?redirect=${redirect}`);
      return;
    }
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'category') {
        const cat = categories.find(c => c.id === value);
        next.categoryName = cat ? cat.name : '';
      }
      return next;
    });
  };

  const faceValue = Number(form.faceValue) || 0;
  const price = Number(form.price) || 0;
  const discount = faceValue > 0 ? Math.round((1 - price / faceValue) * 100) : 0;
  const percentage = Number(form.percentage) || 0;
  const sendMonth = Number(form.sendMonth) || 0;
  const sendDay = Number(form.sendDay) || 0;

  const verifyEditPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (editPost?.guest_password === editAuth.password) {
      setEditAuth({ ...editAuth, verified: true });
    } else {
      alert('비밀번호가 일치하지 않습니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 삽니다(buy)는 회원만
    if (form.type === 'buy' && !isLoggedIn && !isEdit) {
      alert('구매글은 로그인 후 작성할 수 있습니다.');
      const redirect = encodeURIComponent('/board/write?type=buy');
      router.push(`/login?redirect=${redirect}`);
      return;
    }

    // 비회원 판매글 필수 검증 (로그인 안된 경우)
    if (!isLoggedIn && !isEdit) {
      if (!form.guestName.trim()) return alert('이름을 입력하세요.');
      if (!form.guestPassword.trim() || form.guestPassword.length < 4) return alert('비밀번호는 4자 이상 입력하세요.');
    }

    // 팝니다(sell) 신규 검증
    if (form.type === 'sell') {
      if (!percentage || percentage <= 0 || percentage > 200) return alert('매입률(%)을 1~200 사이로 입력하세요.');
      if (!sendMonth || sendMonth < 1 || sendMonth > 12) return alert('발송 월(1~12)을 입력하세요.');
      if (!sendDay || sendDay < 1 || sendDay > 31) return alert('발송 일(1~31)을 입력하세요.');
    }

    setSubmitting(true);
    try {
      const expireDays = form.type === 'sell' ? SELL_EXPIRE_DAYS : BUY_EXPIRE_DAYS;
      const expiresAt = new Date(Date.now() + expireDays * 86400000).toISOString();

      const sendTag = form.type === 'sell' && sendMonth && sendDay ? `${sendMonth}월 ${sendDay}일 발송` : form.delivery;
      const payload: Record<string, unknown> = {
        type: form.type as 'sell' | 'buy',
        title: form.title,
        category: form.category,
        delivery_method: form.deliveryMethod,
        delivery: form.type === 'sell' ? sendTag : form.delivery,
        tags: [sendTag, form.region ? `#${form.region}` : '', form.deliveryMethod === 'mobile' ? '#모바일' : form.deliveryMethod === 'parcel' ? '#택배' : '#직접만남'].filter(Boolean),
      };

      if (form.type === 'sell') {
        // 팝니다는 percentage + 월/일 사용 (face_value/price는 null)
        payload.percentage = percentage;
        payload.send_month = sendMonth;
        payload.send_day = sendDay;
        payload.face_value = null;
        payload.price = null;
      } else {
        // 삽니다는 기존 금액 방식
        payload.face_value = faceValue;
        payload.price = price;
      }

      // 신규 등록 시에만 만료 시각 설정 (수정 시는 기존 만료 유지)
      if (!isEdit) payload.expires_at = expiresAt;

      if (isLoggedIn && user) {
        payload.author_id = user.id;
      } else {
        payload.author_id = null;
        if (!isEdit) {
          payload.guest_name = form.guestName;
          payload.guest_password = form.guestPassword;
          payload.guest_phone = form.guestPhone || null;
        }
      }

      if (isEdit && editId) {
        await updatePost(editId, payload);
        router.push(`/board/${editId}`);
      } else {
        const created = await createPost(payload);
        router.push(`/board/${created.id}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '등록에 실패했습니다.';
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingEdit) {
    return <div className="container-main py-20 text-center text-gray-400 text-[13px]">불러오는 중...</div>;
  }

  // 비회원 글 수정 시 비밀번호 인증 화면
  if (isEdit && editPost && !editPost.author_id && !editAuth.verified) {
    return (
      <div className="container-main py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[18px] font-bold text-gray-800">게시글 수정</h1>
          <div className="breadcrumb">
            <Link href="/">HOME</Link> &gt; <Link href="/board">게시판</Link> &gt; 수정
          </div>
        </div>
        <div className="flex gap-4">
          <LeftSidebar />
          <div className="flex-1 min-w-0">
            <div className="max-w-[420px] mx-auto bg-white border border-gray-200 p-6">
              <div className="text-center mb-5">
                <Lock size={24} className="mx-auto text-gray-400 mb-2" />
                <h2 className="text-[15px] font-bold">비밀번호 확인</h2>
                <p className="text-[12px] text-gray-500 mt-1">글 작성 시 설정한 비밀번호를 입력하세요.</p>
              </div>
              <form onSubmit={verifyEditPassword} className="space-y-3">
                <input type="password" value={editAuth.password} onChange={(e) => setEditAuth({ ...editAuth, password: e.target.value })}
                  placeholder="비밀번호" className="w-full h-10 px-3 border border-gray-300 text-[13px] focus:border-accent focus:outline-none" autoFocus />
                <button type="submit" className="btn-accent w-full h-10">확인</button>
              </form>
            </div>
          </div>
          <RightSidebar />
        </div>
      </div>
    );
  }

  const writeLabel = form.type === 'sell' ? '상품권 팝니다' : '상품권 삽니다';
  const WriteIcon = form.type === 'sell' ? Tag : ShoppingCart;

  return (
    <div className="container-main py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[18px] font-bold text-gray-800">{isEdit ? '글 수정' : writeLabel + ' 글쓰기'}</h1>
        <div className="breadcrumb">
          <Link href="/">HOME</Link> &gt; <Link href={`/board?tab=${form.type}`}>{writeLabel}</Link> &gt; {isEdit ? '수정' : '글쓰기'}
        </div>
      </div>

      <div className="flex gap-4">
        <LeftSidebar />

        <div className="flex-1 min-w-0 max-w-[800px]">
          <div className="bg-white border border-gray-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
              <Link href={`/board?tab=${form.type}`} className="flex items-center gap-1 text-[12px] text-gray-500 hover:text-accent">
                <ArrowLeft size={12} /> 목록
              </Link>
              <span className="flex items-center gap-1.5 text-[12px] text-accent font-bold">
                <WriteIcon size={12} /> {isEdit ? '글 수정' : writeLabel}
              </span>
              <span />
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Post type */}
          <div>
            <label className="block text-[12px] font-medium text-gray-600 mb-1.5">글 유형 *</label>
            <div className="flex gap-2">
              {[{ value: 'sell', label: '상품권 팝니다', Icon: Tag }, { value: 'buy', label: '상품권 삽니다', Icon: ShoppingCart }].map(opt => (
                <label key={opt.value} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-bold cursor-pointer transition-colors border ${
                  form.type === opt.value ? 'border-accent bg-accent text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-accent hover:text-accent'
                }`}>
                  <input type="radio" name="postType" value={opt.value} checked={form.type === opt.value}
                    onChange={(e) => handleChange('type', e.target.value)} className="sr-only" />
                  <opt.Icon size={13} /> {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-zinc-600 mb-1">상품권 종류 *</label>
            <select value={form.category} onChange={(e) => handleChange('category', e.target.value)} className="input" required>
              <option value="">선택하세요</option>
              {categories.filter(c => c.id !== 'all').map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-zinc-600 mb-1">제목 *</label>
            <input type="text" value={form.title} onChange={(e) => handleChange('title', e.target.value)}
              placeholder="예: 신세계 10만원권 판매" className="input" required />
          </div>

          {/* 팝니다: 매입률(%) + 월/일 발송 */}
          {form.type === 'sell' ? (
            <>
              <div>
                <label className="block text-[12px] font-medium text-zinc-600 mb-1">매입률 (%) *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min={1} max={200} step="0.1"
                    value={form.percentage}
                    onChange={(e) => handleChange('percentage', e.target.value)}
                    placeholder="92" className="input flex-1" required
                  />
                  <span className="text-[14px] font-bold text-accent">%</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">예: 92 (액면가 대비 92% 매입)</p>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-zinc-600 mb-1">발송 예정일 *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min={1} max={12}
                    value={form.sendMonth}
                    onChange={(e) => handleChange('sendMonth', e.target.value)}
                    placeholder="5" className="input w-20" required
                  />
                  <span className="text-[13px] text-zinc-600">월</span>
                  <input
                    type="number" min={1} max={31}
                    value={form.sendDay}
                    onChange={(e) => handleChange('sendDay', e.target.value)}
                    placeholder="15" className="input w-20" required
                  />
                  <span className="text-[13px] text-zinc-600">일 발송</span>
                </div>
                {sendMonth > 0 && sendDay > 0 && (
                  <p className="text-[11px] text-accent mt-1 font-medium">표시: {sendMonth}월 {sendDay}일 발송</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-zinc-600 mb-1">개당 상품권 금액 (원) *</label>
                  <input type="text" inputMode="numeric" value={formatNumber(form.faceValue)}
                    onChange={(e) => handleChange('faceValue', parseNumber(e.target.value))} placeholder="100,000" className="input" required />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-zinc-600 mb-1">개당 구매금액 (원) *</label>
                  <input type="text" inputMode="numeric" value={formatNumber(form.price)}
                    onChange={(e) => handleChange('price', parseNumber(e.target.value))} placeholder="70,000" className="input" required />
                </div>
              </div>

              {faceValue > 0 && price > 0 && (
                <div className="bg-zinc-50 rounded-md px-4 py-3 text-[13px] border border-zinc-200">
                  할인율: <span className="text-zinc-900 font-semibold">{discount}%</span>
                </div>
              )}

              <div>
                <label className="block text-[12px] font-medium text-zinc-600 mb-1">발송 예정</label>
                <select value={form.delivery} onChange={(e) => handleChange('delivery', e.target.value)} className="input">
                  <option value="즉시발송">즉시발송</option>
                  <option value="3일 이내 발송">3일 이내 발송</option>
                  <option value="5일 이내 발송">5일 이내 발송</option>
                  <option value="7일 이내 발송">7일 이내 발송</option>
                  <option value="14일 이내 발송">14일 이내 발송</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-[12px] font-medium text-zinc-600 mb-1">배송 방법</label>
            <div className="flex gap-2">
              {[{ value: 'mobile', label: '모바일' }, { value: 'parcel', label: '택배' }, { value: 'direct', label: '직접만남' }].map(opt => (
                <label key={opt.value} className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[13px] font-medium rounded-md cursor-pointer transition-colors ${
                  form.deliveryMethod === opt.value ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                }`}>
                  <input type="radio" name="deliveryMethod" value={opt.value} checked={form.deliveryMethod === opt.value}
                    onChange={(e) => handleChange('deliveryMethod', e.target.value)} className="sr-only" />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-zinc-600 mb-1">지역</label>
            <input type="text" value={form.region} onChange={(e) => handleChange('region', e.target.value)}
              placeholder="예: 서울, 전국" className="input" />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-zinc-600 mb-1">상세 설명</label>
            <textarea value={form.description} onChange={(e) => handleChange('description', e.target.value)}
              placeholder="추가 설명을 입력하세요" rows={4} className="input h-auto py-3 resize-none" />
          </div>

          {/* 비회원 정보 — 판매(팝니다)만 비회원 허용 */}
          {!isLoggedIn && !isEdit && form.type === 'sell' && (
            <div className="card bg-zinc-50 border-zinc-200 p-4">
              <p className="text-[12px] font-semibold text-zinc-700 mb-2">비회원 작성 정보</p>
              <p className="text-[11px] text-zinc-500 mb-3">글 수정·삭제 시 아래 정보가 필요합니다. 회원가입 없이 작성할 수 있습니다.</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-[12px] font-medium text-zinc-600 mb-1">이름/닉네임 *</label>
                  <input type="text" value={form.guestName}
                    onChange={(e) => handleChange('guestName', e.target.value)}
                    placeholder="게시글에 표시됩니다" className="input" required />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-zinc-600 mb-1">연락처</label>
                  <input type="text" value={form.guestPhone}
                    onChange={(e) => handleChange('guestPhone', e.target.value)}
                    placeholder="010-0000-0000 (선택)" className="input" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-zinc-600 mb-1">비밀번호 * (4자 이상)</label>
                  <input type="password" value={form.guestPassword}
                    onChange={(e) => handleChange('guestPassword', e.target.value)}
                    placeholder="글 수정·삭제 시 필요합니다" className="input" minLength={4} required />
                </div>
              </div>
            </div>
          )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <Link href={`/board?tab=${form.type}`} className="btn-secondary h-10 px-4 text-[13px]">취소</Link>
                <button type="submit" disabled={submitting} className="btn-accent h-10 px-6 text-[13px] disabled:opacity-60">
                  {submitting ? '처리 중...' : isEdit ? '수정하기' : '등록하기'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <RightSidebar />
      </div>
    </div>
  );
}
