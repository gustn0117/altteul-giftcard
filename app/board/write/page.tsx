'use client';
import HomeAside from '@/components/layout/HomeAside';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Lock, Tag, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { categories } from '@/data/mock';
import { createPost, getPost, updatePost } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { AD_TYPES } from '@/lib/types';
import ImageUploader from '@/components/ImageUploader';

// 만료 정책 (일 단위)
const SELL_EXPIRE_DAYS = 7;   // 팝니다: 7일 후 잠금 (30일 후 자동삭제)
const BUY_EXPIRE_DAYS = 7;    // 삽니다: 7일 후 잠금 (운영자 해제)
// 글 작성 시엔 실제 지역만 선택(전국 제외 — 전국은 목록에서 '전체 보기' 필터로만 사용)
const REGION_OPTIONS = ['서울', '경기', '인천', '대전', '대구', '부산', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
const DELIVERY_METHODS = [{ value: 'mobile', label: '모바일', tag: '#모바일' }, { value: 'parcel', label: '택배', tag: '#택배' }, { value: 'direct', label: '직접만남', tag: '#직접만남' }];
// 광고박스는 폭이 좁아 한 줄을 넘기면 잘리므로 입력 단계에서 글자수를 강제 제한한다
const TOP_MAX = 14;     // 상단문구(사진칸) 한 줄
const CENTER_MAX = 16;  // 중앙문구 각 줄

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
    delivery: postType === 'buy' ? '24시간' : '7일 이내 발송',
    deliveryMethod: 'mobile',
    description: '',
    region: '',
    // 삽니다 광고 종류 (기본: 메인광고)
    adType: 'main' as string,
    // 광고박스 상단 이미지 URL (삽니다)
    imageUrl: '',
    // 중앙문구 (최대 2줄)
    centerLine1: '',
    centerLine2: '',
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
            description: post.description || '',
            region: post.region || '',
            // 광고 종류를 로드하지 않으면 수정 시 항상 'main' 으로 덮어써져
            // 전국광고/추천업체가 조용히 메인광고로 강등된다
            adType: post.ad_type ?? 'main',
            imageUrl: post.image_url ?? '',
            centerLine1: (post.center_text || '').split('\n')[0] || '',
            centerLine2: (post.center_text || '').split('\n')[1] || '',
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

  // 배송 방법 다중 선택 토글 (콤마 구분 저장)
  const deliveryList = form.deliveryMethod.split(',').filter(Boolean);
  const toggleDelivery = (val: string) => {
    setForm((prev) => {
      const cur = prev.deliveryMethod.split(',').filter(Boolean);
      const next = cur.includes(val) ? cur.filter((v) => v !== val) : [...cur, val];
      return { ...prev, deliveryMethod: next.join(',') };
    });
  };

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

    // 판매율/매입률(%) 검증
    if (!percentage || percentage <= 0 || percentage > 200) {
      return alert(`${form.type === 'sell' ? '판매율' : '매입률'}(%)을 1~200 사이로 입력하세요.`);
    }
    if (form.type === 'sell') {
      // 발송 예정일은 선택(변경 가능) — 입력했을 때만 범위 검증
      if (form.sendMonth && (sendMonth < 1 || sendMonth > 12)) return alert('발송 월은 1~12 사이로 입력하세요.');
      if (form.sendDay && (sendDay < 1 || sendDay > 31)) return alert('발송 일은 1~31 사이로 입력하세요.');
    } else {
      // 삽니다: 배송 방법 1개 이상
      if (deliveryList.length === 0) return alert('배송 방법을 1개 이상 선택하세요.');
    }

    // 지역은 반드시 선택 (미선택 시 '전국'으로 처리되던 것 방지)
    if (!form.region) return alert('지역을 선택하세요.');

    setSubmitting(true);
    try {
      const expireDays = form.type === 'sell' ? SELL_EXPIRE_DAYS : BUY_EXPIRE_DAYS;
      const expiresAt = new Date(Date.now() + expireDays * 86400000).toISOString();

      const sellSendText = form.type === 'sell' && sendMonth && sendDay ? `${sendMonth}월 ${sendDay}일 발송` : '';
      const dmTags = deliveryList
        .map((v) => DELIVERY_METHODS.find((d) => d.value === v)?.tag)
        .filter(Boolean) as string[];
      const payload: Record<string, unknown> = {
        type: form.type as 'sell' | 'buy',
        title: form.title,
        category: form.category,
        delivery_method: form.deliveryMethod,                 // 콤마 구분 다중 선택
        delivery: form.type === 'sell' ? (sellSendText || '발송일 협의') : form.delivery, // 삽니다=매입 가능 시간
        region: form.region || null,
        description: form.description || null,
        tags: [form.type === 'sell' ? sellSendText : '', form.region ? `#${form.region}` : '', ...dmTags].filter(Boolean),
      };

      // 팝니다·삽니다 모두 percentage(판매율/매입률) 사용, 금액 필드는 사용 안 함
      payload.percentage = percentage;
      payload.face_value = null;
      payload.price = null;
      if (form.type === 'sell') {
        payload.send_month = sendMonth || null;
        payload.send_day = sendDay || null;
      } else {
        payload.send_month = null;
        payload.send_day = null;
        // 삽니다 광고 종류 — 승인되면 홈의 해당 칸(전국/메인/추천)에 노출
        payload.ad_type = form.adType || 'main';
        // 광고박스 상단 이미지
        payload.image_url = form.imageUrl || null;
        // 중앙문구 (2줄을 줄바꿈으로 합쳐 저장)
        payload.center_text = [form.centerLine1.trim(), form.centerLine2.trim()].filter(Boolean).join('\n') || null;
      }

      // 신규 등록 시에만 만료 시각 설정 (수정 시는 기존 만료 유지)
      if (!isEdit) {
        payload.expires_at = expiresAt;
        // 삽니다는 관리자 승인 전까지 미노출(approved_at null), 팝니다는 자동 승인
        payload.approved_at = form.type === 'buy' ? null : new Date().toISOString();
      }

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
        if (form.type === 'buy') {
          alert('구매글이 등록되었습니다. 관리자 승인(게시 기간 설정) 후 노출됩니다.');
        }
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
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <HomeAside />
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
        </div>
      </div>
    );
  }

  const writeLabel = form.type === 'sell' ? '상품권 팝니다' : '상품권 삽니다';
  const WriteIcon = form.type === 'sell' ? Tag : ShoppingCart;

  return (
    <div className="container-main py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[18px] font-bold text-gray-800 shrink-0">{isEdit ? '글 수정' : writeLabel + ' 글쓰기'}</h1>
        <div className="breadcrumb hidden sm:block">
          <Link href="/">HOME</Link> &gt; <Link href={`/board?tab=${form.type}`}>{writeLabel}</Link> &gt; {isEdit ? '수정' : '글쓰기'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <HomeAside />

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
            <label className="block text-[12px] font-medium text-zinc-600 mb-1">
              {form.type === 'buy' ? '상단문구 (사진칸에 표시) *' : '제목 *'}
            </label>
            <input type="text" value={form.title} onChange={(e) => handleChange('title', e.target.value)}
              placeholder={form.type === 'buy' ? '예: 신세계 최고가 매입' : '예: 신세계 10만원권 판매'}
              maxLength={form.type === 'buy' ? TOP_MAX : undefined}
              className="input" required />
            {form.type === 'buy' && (
              <p className="text-[11px] text-zinc-400 mt-1">
                광고박스 사진칸에 <b>한 줄</b>로 표시됩니다. (띄어쓰기 포함 {form.title.length}/{TOP_MAX}자)
              </p>
            )}
          </div>

          {/* 팝니다: 판매율(%) + 월/일 발송 */}
          {form.type === 'sell' ? (
            <>
              <div>
                <label className="block text-[12px] font-medium text-zinc-600 mb-1">판매율 (%) *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min={1} max={200} step="0.1"
                    value={form.percentage}
                    onChange={(e) => handleChange('percentage', e.target.value)}
                    placeholder="92" className="input flex-1" required
                  />
                  <span className="text-[14px] font-bold text-accent">%</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">예: 92 (액면가 대비 92%에 판매)</p>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-zinc-600 mb-1">발송 예정일 <span className="text-[11px] text-zinc-400 font-normal">(선택·변경 가능)</span></label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min={1} max={12}
                    value={form.sendMonth}
                    onChange={(e) => handleChange('sendMonth', e.target.value)}
                    placeholder="5" className="input w-20"
                  />
                  <span className="text-[13px] text-zinc-600 shrink-0 whitespace-nowrap">월</span>
                  <input
                    type="number" min={1} max={31}
                    value={form.sendDay}
                    onChange={(e) => handleChange('sendDay', e.target.value)}
                    placeholder="15" className="input w-20"
                  />
                  <span className="text-[13px] text-zinc-600 shrink-0 whitespace-nowrap">일 발송</span>
                </div>
                {sendMonth > 0 && sendDay > 0 && (
                  <p className="text-[11px] text-accent mt-1 font-medium">표시: {sendMonth}월 {sendDay}일 발송</p>
                )}
              </div>
            </>
          ) : (
            <>
              {/* 광고박스 상단 이미지 (선택) — 올리면 박스 상단에 뜨고 그 위에 중앙문구가 겹쳐 표시됨 */}
              <div>
                <label className="block text-[12px] font-medium text-zinc-600 mb-1">광고박스 상단 이미지 (선택)</label>
                <ImageUploader
                  value={form.imageUrl}
                  onChange={(url) => handleChange('imageUrl', url)}
                  folder="ads"
                  hint="가로형 이미지 권장(예: 640×400). 광고박스 상단에 표시되고, 그 위에 '박스 중앙문구'가 흰 글씨로 겹쳐 나옵니다. 안 올리면 어두운 배경으로 표시됩니다."
                />
              </div>

              {/* 중앙문구 — 매입률 바로 위, 최대 2줄 */}
              <div>
                <label className="block text-[12px] font-medium text-zinc-600 mb-1">중앙문구 (최대 2줄)</label>
                <input type="text" value={form.centerLine1} onChange={(e) => handleChange('centerLine1', e.target.value)}
                  placeholder="1줄 (예: 24시간 신속 매입)" maxLength={CENTER_MAX} className="input mb-2" />
                <input type="text" value={form.centerLine2} onChange={(e) => handleChange('centerLine2', e.target.value)}
                  placeholder="2줄 (선택)" maxLength={CENTER_MAX} className="input" />
                <p className="text-[11px] text-zinc-400 mt-1">
                  &apos;예판상품권 N% 매입&apos; 바로 위에 표시됩니다. 각 줄은 한 줄로 고정 (1줄 {form.centerLine1.length}/{CENTER_MAX}자 · 2줄 {form.centerLine2.length}/{CENTER_MAX}자)
                </p>
              </div>

              {/* 광고 종류 — 승인되면 홈의 해당 칸에 노출됨 */}
              <div>
                <label className="block text-[12px] font-medium text-zinc-600 mb-1">광고 종류 *</label>
                <div className="grid grid-cols-3 gap-2">
                  {AD_TYPES.map((a) => (
                    <button
                      key={a.value}
                      type="button"
                      disabled={isEdit}
                      onClick={() => handleChange('adType', a.value)}
                      className={`h-10 text-[12.5px] font-bold border transition-colors ${
                        form.adType === a.value
                          ? 'border-accent bg-accent text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-accent hover:text-accent'
                      } ${isEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
                {isEdit && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    광고 종류는 수정할 수 없습니다. 변경이 필요하면 관리자에게 문의해주세요.
                  </p>
                )}
                <p className="text-[11px] text-zinc-400 mt-1">
                  {AD_TYPES.find((a) => a.value === form.adType)?.desc}
                </p>
                <p className="mt-2 px-3 py-2 bg-amber-50 border border-amber-200 text-[11.5px] text-amber-800">
                  🕒 광고는 <b>관리자 승인 후</b> 노출됩니다. 관리자가 게시 기간(20/25/30일 등)을 설정해 승인하면
                  홈 {AD_TYPES.find((a) => a.value === form.adType)?.label}칸에 표시되고, 기간이 끝나면 자동으로 내려갑니다.
                </p>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-zinc-600 mb-1">매입률 (%) *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min={1} max={200} step="0.1"
                    value={form.percentage}
                    onChange={(e) => handleChange('percentage', e.target.value)}
                    placeholder="90" className="input flex-1" required
                  />
                  <span className="text-[14px] font-bold text-accent">%</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">예: 90 (액면가 대비 90%에 매입)</p>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-zinc-600 mb-1">매입 가능 시간</label>
                <input type="text" value={form.delivery} onChange={(e) => handleChange('delivery', e.target.value)}
                  placeholder="예: 24시간 / 평일 09:00~18:00" className="input" />
              </div>
            </>
          )}

          <div>
            <label className="block text-[12px] font-medium text-zinc-600 mb-1">배송 방법 <span className="text-[11px] text-zinc-400 font-normal">(중복 선택 가능)</span></label>
            <div className="flex gap-2">
              {DELIVERY_METHODS.map(opt => {
                const selected = deliveryList.includes(opt.value);
                return (
                  <label key={opt.value} className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[13px] font-medium rounded-md cursor-pointer transition-colors ${
                    selected ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                  }`}>
                    <input type="checkbox" checked={selected}
                      onChange={() => toggleDelivery(opt.value)} className="sr-only" />
                    {opt.label}
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-zinc-600 mb-1">지역 *</label>
            <select value={form.region} onChange={(e) => handleChange('region', e.target.value)} className="input" required>
              <option value="">지역 선택</option>
              {REGION_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-zinc-600 mb-1">
              상세 설명{form.type === 'buy' ? ' (클릭 시 상세페이지에 표시)' : ''}
            </label>
            <textarea value={form.description} onChange={(e) => handleChange('description', e.target.value)}
              placeholder={form.type === 'buy' ? '광고를 클릭하면 보이는 상세 안내를 적어주세요' : '추가 설명을 입력하세요'}
              rows={4} className="input h-auto py-3 resize-none" />
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

      </div>
    </div>
  );
}
