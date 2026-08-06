'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { getPremiumBuyers, createNotice as apiCreateNotice, deleteNotice as apiDeleteNotice, deleteUser as apiDeleteUser, updateUser, deletePost as apiDeletePost, createPremiumBuyer, updatePremiumBuyer, deletePremiumBuyer as apiDeletePremiumBuyer } from '@/lib/api';
import ImageUpload from '@/components/ImageUpload';
import type { DBUser, DBPost, DBNotice, DBPremiumBuyer } from '@/lib/types';
import { AD_TYPES, adTypeLabel } from '@/lib/types';
import { formatPhone } from '@/lib/format';
import ImageUploader from '@/components/ImageUploader';
import type { Ad, AdSlot } from '@/lib/ads';
import { AD_SLOT_LABELS, AD_SLOT_SIZES } from '@/lib/ads';
import Link from 'next/link';
import { Users, FileText, Bell, MessageCircle, Trash2, Shield, Megaphone, Pencil, Plus, Eye, EyeOff, ArrowLeft, Radio, Crown, LayoutDashboard, TrendingUp, ExternalLink, Activity, Globe, Clock } from 'lucide-react';
import { getCategoryName, categories } from '@/data/mock';
import { getCache, setCache } from '@/lib/cache';

const ADMIN_CACHE_TTL = 30 * 1000; // 30초 (관리자라 너무 길면 변경사항 반영이 늦음)

const ALL_SLOTS = Object.keys(AD_SLOT_LABELS) as AdSlot[];

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState('');
  const [tab, setTab] = useState<'overview' | 'users' | 'posts' | 'notices' | 'premium' | 'ads' | 'community' | 'national' | 'main' | 'recommend' | 'expired' | 'writepost'>('overview');
  // 회원 목록 일반/업체 구분 필터
  const [userFilter, setUserFilter] = useState<'all' | 'normal' | 'business'>('all');
  // 업체 소개 편집 모달
  const [introEdit, setIntroEdit] = useState<{ id: string; name: string; intro: string; hours: string; imageUrl: string; categories: string[] } | null>(null);
  const [introSaving, setIntroSaving] = useState(false);
  const [stats, setStats] = useState<{
    users: { total: number; business: number; normal: number; todayNew: number };
    posts: { total: number; sell: number; buy: number; active: number; todayNew: number };
    premium: { total: number; active: number; premium: number };
    notices: { total: number; pinned: number };
  } | null>(null);
  const [users, setUsers] = useState<DBUser[]>(() => getCache<DBUser[]>('admin_users') ?? []);
  const [posts, setPosts] = useState<(DBPost & { author?: DBUser })[]>(() => getCache<(DBPost & { author?: DBUser })[]>('admin_posts') ?? []);
  const [notices, setNotices] = useState<DBNotice[]>(() => getCache<DBNotice[]>('admin_notices') ?? []);
  const [premiumBuyers, setPremiumBuyers] = useState<DBPremiumBuyer[]>(() => getCache<DBPremiumBuyer[]>('admin_premium') ?? []);
  const [ads, setAds] = useState<Ad[]>(() => getCache<Ad[]>('admin_ads') ?? []);
  const [visitors, setVisitors] = useState<{ total: number; today: number; last30: { date: string; count: number }[] }>({ total: 0, today: 0, last30: [] });
  const [buyContactPublic, setBuyContactPublic] = useState(true);
  const [settingBusy, setSettingBusy] = useState(false);
  const [footerInfo, setFooterInfo] = useState('');
  const [footerSaving, setFooterSaving] = useState(false);
  const [approveDaysMap, setApproveDaysMap] = useState<Record<string, string>>({});
  // 관리자 직접 등록 폼 (폰 인증 없이 번호 직접 입력)
  const [directForm, setDirectForm] = useState({
    type: 'sell' as 'sell' | 'buy', category: '', region: '', title: '', percentage: '',
    faceValue: '', guestName: '', guestPhone: '', description: '', sendMonth: '', sendDay: '',
    delivery: '', mobile: true, parcel: true, direct: true,
    adType: 'main' as 'national' | 'main' | 'recommend', days: '30',
    imageUrl: '', centerLine1: '', centerLine2: '', password: '102030',
  });
  const [directBusy, setDirectBusy] = useState(false);
  const [loading, setLoading] = useState(() => !getCache('admin_users'));

  // Chat viewer

  // Notice form
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticePinned, setNoticePinned] = useState(false);
  const [noticeImage, setNoticeImage] = useState('');

  // Premium buyer form
  const [showPremiumForm, setShowPremiumForm] = useState(false);
  const [editingPremium, setEditingPremium] = useState<DBPremiumBuyer | null>(null);
  const [premiumForm, setPremiumForm] = useState({ name: '', headline: '', description: '', phone: '', region: '', brands: '', image_url: '', user_id: '', priority: 0, is_active: true, tier: 'standard' as 'premium' | 'standard' | 'basic', buy_rate: '', is_best: false });

  // Ad form
  const [showAdForm, setShowAdForm] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [adForm, setAdForm] = useState({
    slot: 'hero_banner' as AdSlot,
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    advertiser: '',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    priority: 0,
    is_active: true,
  });

  const [loginError, setLoginError] = useState('');
  const [sessionChecked, setSessionChecked] = useState(false);

  // 세션 상태 확인
  useEffect(() => {
    fetch('/api/admin', { credentials: 'include' })
      .then(r => r.json())
      .then(data => { if (data.ok) setAuthed(true); })
      .catch(() => {})
      .finally(() => setSessionChecked(true));
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json();
      if (data.ok) setAuthed(true);
      else setLoginError(data.error || '비밀번호가 틀렸습니다.');
    } catch {
      setLoginError('서버 오류가 발생했습니다.');
    }
  };

  const logout = async () => {
    await fetch('/api/admin', { method: 'DELETE', credentials: 'include' });
    setAuthed(false);
    setPw('');
  };

  const fetchData = async () => {
    // 캐시가 없을 때만 로딩 인디케이터 노출 (캐시 있으면 즉시 화면 + 백그라운드 갱신)
    if (!getCache('admin_users')) setLoading(true);

    // 모든 데이터를 동시에 병렬 요청
    const [u, p, n, v, pb, ad, st] = await Promise.allSettled([
      supabase.from('users').select('*').order('created_at', { ascending: false }).limit(200),
      // 삭제된 글(deleted_at)은 사이트와 동일하게 관리자 목록에서도 제외 — 안 그러면 삭제해도 관리자엔 남아 헷갈림
      supabase.from('posts').select('*, author:users!author_id(id, name, type)').is('deleted_at', null).order('created_at', { ascending: false }).limit(200),
      supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(50),
      fetch('/api/visitors').then(r => r.json()),
      getPremiumBuyers(false),
      fetch('/api/ads').then(r => r.json()),
      fetch('/api/admin/stats', { credentials: 'include' }).then(r => r.json()),
    ]);

    if (u.status === 'fulfilled' && u.value.data) { setUsers(u.value.data); setCache('admin_users', u.value.data, ADMIN_CACHE_TTL); }
    if (p.status === 'fulfilled' && p.value.data) { setPosts(p.value.data); setCache('admin_posts', p.value.data, ADMIN_CACHE_TTL); }
    if (n.status === 'fulfilled' && n.value.data) { setNotices(n.value.data); setCache('admin_notices', n.value.data, ADMIN_CACHE_TTL); }
    if (v.status === 'fulfilled') setVisitors(v.value);
    if (pb.status === 'fulfilled') { setPremiumBuyers(pb.value); setCache('admin_premium', pb.value, ADMIN_CACHE_TTL); }
    if (ad.status === 'fulfilled') { setAds(ad.value); setCache('admin_ads', ad.value, ADMIN_CACHE_TTL); }
    if (st.status === 'fulfilled' && st.value?.users) setStats(st.value);
    // 커뮤니티 기능은 이전에 제거됨 — /api/community/posts 를 부르면 매 로드마다 404 가 났음

    setLoading(false);
  };


  useEffect(() => { if (authed) fetchData(); }, [authed]);

  useEffect(() => {
    if (!authed) return;
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.buy_contact_public === 'boolean') setBuyContactPublic(d.buy_contact_public);
        if (typeof d.footer_info === 'string') setFooterInfo(d.footer_info);
      })
      .catch(() => {});
  }, [authed]);

  const saveFooterInfo = async () => {
    if (footerSaving) return;
    setFooterSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'footer_info', value: footerInfo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '저장 실패');
      alert('하단 사업자 정보를 저장했습니다. (모든 화면 하단에 반영)');
    } catch (err) {
      alert(err instanceof Error ? err.message : '저장 실패');
    } finally {
      setFooterSaving(false);
    }
  };

  const toggleBuyContactPublic = async () => {
    if (settingBusy) return;
    const next = !buyContactPublic;
    setSettingBusy(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'buy_contact_public', value: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '설정 변경 실패');
      setBuyContactPublic(data.value);
    } catch (err) {
      alert(err instanceof Error ? err.message : '설정 변경 실패');
    } finally {
      setSettingBusy(false);
    }
  };

  // CRUD helpers - api.ts 함수 사용
  const deleteUser = async (id: string) => { if (!confirm('정말 삭제하시겠습니까?')) return; await apiDeleteUser(id); fetchData(); };
  const deletePost = async (id: string) => { if (!confirm('게시글을 삭제하시겠습니까?')) return; await apiDeletePost(id); fetchData(); };
  const approveBuyPost = async (id: string, days: number) => {
    if (!days || days <= 0) return alert('게시 기간(일)을 입력하세요.');
    const now = new Date();
    const expires = new Date(now.getTime() + days * 86400000).toISOString();
    const { error } = await supabase.from('posts').update({ approved_at: now.toISOString(), expires_at: expires, is_active: true, updated_at: now.toISOString() }).eq('id', id);
    if (error) return alert('승인 실패: ' + error.message);
    fetchData();
  };
  // 연장 신청 승인 — 만료 시각을 days 만큼 늘리고 다시 노출(승인) 상태로
  const approveExtension = async (id: string, days: number) => {
    if (!days || days <= 0) return alert('연장 기간(일)을 입력하세요.');
    const now = new Date();
    const cur = posts.find(p => p.id === id);
    // 이미 만료됐으면 지금부터, 아직 남았으면 남은 기간에 이어서
    const base = cur?.expires_at && new Date(cur.expires_at) > now ? new Date(cur.expires_at) : now;
    const expires = new Date(base.getTime() + days * 86400000).toISOString();
    const { error } = await supabase.from('posts').update({
      expires_at: expires,
      approved_at: cur?.approved_at ?? now.toISOString(),
      extension_requested_at: null,
      notified_expiry_at: null,
      is_active: true,
      updated_at: now.toISOString(),
    }).eq('id', id);
    if (error) return alert('연장 승인 실패: ' + error.message);
    fetchData();
  };
  const rejectExtension = async (id: string) => {
    if (!confirm('연장 신청을 거절할까요? (글은 그대로 유지됩니다)')) return;
    const { error } = await supabase.from('posts').update({ extension_requested_at: null, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) return alert('실패: ' + error.message);
    fetchData();
  };

  // 광고 종류 변경 (전국/메인/추천 간 이동)
  const changeAdType = async (id: string, adType: string) => {
    const { error } = await supabase.from('posts').update({ ad_type: adType, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) return alert('변경 실패: ' + error.message);
    fetchData();
  };
  // 승인 취소 → 다시 대기 상태로
  const unapproveAd = async (id: string) => {
    if (!confirm('노출을 중단하고 승인 대기로 되돌립니다.')) return;
    const { error } = await supabase.from('posts').update({ approved_at: null, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) return alert('실패: ' + error.message);
    fetchData();
  };
  const deleteNotice = async (id: string) => { if (!confirm('공지를 삭제하시겠습니까?')) return; await apiDeleteNotice(id); fetchData(); };
  const addNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim()) return;
    await apiCreateNotice({
      title: noticeTitle.trim(),
      content: noticeContent.trim() || undefined,
      is_pinned: noticePinned,
      ...(noticeImage ? { image_url: noticeImage } : {}),
    } as Parameters<typeof apiCreateNotice>[0]);
    setNoticeTitle('');
    setNoticeContent('');
    setNoticePinned(false);
    setNoticeImage('');
    fetchData();
  };
  const toggleUserType = async (id: string, t: string) => { await updateUser(id, { type: t === 'normal' ? 'business' : 'normal' } as any); fetchData(); };

  // 업체 소개 편집 (관리자가 각 업체 소개를 직접 관리)
  const openIntroEdit = (u: DBUser) => setIntroEdit({
    id: u.id, name: u.name,
    intro: u.intro || '', hours: u.business_hours || '',
    imageUrl: u.intro_image_url || '',
    categories: u.main_categories ? String(u.main_categories).split(',').filter(Boolean) : [],
  });
  const saveIntroEdit = async () => {
    if (!introEdit) return;
    setIntroSaving(true);
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: introEdit.id, intro: introEdit.intro, businessHours: introEdit.hours,
          introImageUrl: introEdit.imageUrl, mainCategories: introEdit.categories.join(','),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '저장 실패');
      setIntroEdit(null);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : '저장 실패');
    } finally {
      setIntroSaving(false);
    }
  };
  // Premium Buyer CRUD
  const resetPremiumForm = () => { setPremiumForm({ name: '', headline: '', description: '', phone: '', region: '', brands: '', image_url: '', user_id: '', priority: 0, is_active: true, tier: 'standard', buy_rate: '', is_best: false }); setEditingPremium(null); setShowPremiumForm(false); };
  const startEditPremium = (b: DBPremiumBuyer) => { setPremiumForm({ name: b.name, headline: b.headline || '', description: b.description, phone: b.phone, region: b.region, brands: b.brands?.join(', ') || '', image_url: b.image_url, user_id: b.user_id || '', priority: b.priority, is_active: b.is_active, tier: b.tier || 'standard', buy_rate: b.buy_rate != null ? String(b.buy_rate) : '', is_best: b.is_best ?? false }); setEditingPremium(b); setShowPremiumForm(true); };
  const savePremium = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: premiumForm.name, headline: premiumForm.headline.trim() || null, description: premiumForm.description, phone: premiumForm.phone, region: premiumForm.region, brands: premiumForm.brands.split(',').map(s => s.trim()).filter(Boolean), image_url: premiumForm.image_url, user_id: premiumForm.user_id || null, priority: premiumForm.priority, is_active: premiumForm.is_active, tier: premiumForm.tier, buy_rate: premiumForm.buy_rate === '' ? null : Number(premiumForm.buy_rate), is_best: premiumForm.is_best };
    if (editingPremium) {
      await updatePremiumBuyer(editingPremium.id, payload);
    } else {
      await createPremiumBuyer(payload);
    }
    resetPremiumForm();
    fetchData();
  };
  const deletePremium = async (id: string) => { if (!confirm('프리미엄 업체를 삭제하시겠습니까?')) return; await apiDeletePremiumBuyer(id); fetchData(); };
  const togglePremiumActive = async (b: DBPremiumBuyer) => { await updatePremiumBuyer(b.id, { is_active: !b.is_active }); fetchData(); };

  // Ad CRUD
  const resetAdForm = () => {
    setAdForm({ slot: 'hero_banner', title: '', description: '', image_url: '', link_url: '', advertiser: '', start_date: new Date().toISOString().slice(0, 10), end_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10), priority: 0, is_active: true });
    setEditingAd(null);
    setShowAdForm(false);
  };

  const startEditAd = (ad: Ad) => {
    setAdForm({ slot: ad.slot, title: ad.title, description: ad.description, image_url: ad.image_url, link_url: ad.link_url, advertiser: ad.advertiser, start_date: ad.start_date.slice(0, 10), end_date: ad.end_date.slice(0, 10), priority: ad.priority, is_active: ad.is_active });
    setEditingAd(ad);
    setShowAdForm(true);
  };

  const saveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...adForm, start_date: adForm.start_date + 'T00:00:00Z', end_date: adForm.end_date + 'T23:59:59Z' };
    if (editingAd) {
      await fetch('/api/ads', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, id: editingAd.id }) });
    } else {
      await fetch('/api/ads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    }
    resetAdForm();
    fetchData();
  };

  const deleteAd = async (id: string) => {
    if (!confirm('광고를 삭제하시겠습니까?')) return;
    await fetch(`/api/ads?id=${id}`, { method: 'DELETE' });
    fetchData();
  };

  const toggleAdActive = async (ad: Ad) => {
    await fetch('/api/ads', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: ad.id, is_active: !ad.is_active }) });
    fetchData();
  };

  if (!sessionChecked) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-[13px] text-zinc-400">세션 확인 중...</div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-5">
        <div className="w-full max-w-[320px]">
          <div className="text-center mb-6">
            <Shield size={32} className="mx-auto mb-2 text-zinc-400" />
            <h1 className="text-[15px] font-semibold">관리자 로그인</h1>
          </div>
          <form onSubmit={login} className="card p-5 space-y-4">
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="비밀번호" className="input" autoFocus />
            {loginError && <p className="text-[12px] text-red-500">{loginError}</p>}
            <button type="submit" className="btn-primary w-full h-10">로그인</button>
          </form>
        </div>
      </div>
    );
  }

  // 관리자 직접 등록 — 폰 인증 게이트를 거치지 않고 번호를 직접 넣어 바로 게시.
  // 팝니다·삽니다 모두 즉시 노출(approved_at=now). 삽니다는 고른 광고칸에 바로 뜬다.
  const submitDirectPost = async () => {
    const f = directForm;
    const pct = Number(f.percentage);
    const phone = f.guestPhone.replace(/[^0-9]/g, '');
    if (!f.title.trim()) return alert('제목을 입력하세요.');
    if (!f.category) return alert('상품권 종류를 선택하세요.');
    if (!f.region) return alert('지역을 선택하세요.');
    if (!pct || pct <= 0 || pct > 200) return alert(`${f.type === 'sell' ? '판매율' : '매입률'}(%)을 1~200으로 입력하세요.`);
    if (!f.guestName.trim()) return alert(f.type === 'sell' ? '판매자명을 입력하세요.' : '업체명을 입력하세요.');
    if (phone.length < 9) return alert('전화번호를 정확히 입력하세요.');
    const dmArr = (['mobile', 'parcel', 'direct'] as const).filter((k) => f[k]);
    if (dmArr.length === 0) return alert('배송/매입 방법을 1개 이상 선택하세요.');

    setDirectBusy(true);
    const now = new Date();
    const nowIso = now.toISOString();
    const isSell = f.type === 'sell';
    const sm = Number(f.sendMonth) || null;
    const sd = Number(f.sendDay) || null;
    const sellSendText = isSell && sm && sd ? `${sm}월 ${sd}일 발송` : '';
    const dmTagMap: Record<string, string> = { mobile: '#모바일', parcel: '#택배', direct: '#직접만남' };
    const dmTags = dmArr.map((v) => dmTagMap[v]);
    const days = Number(f.days) || 30;

    const payload: Record<string, unknown> = {
      type: f.type,
      title: f.title.trim(),
      category: f.category,
      percentage: pct,
      face_value: Number(String(f.faceValue).replace(/[^0-9]/g, '')) || null, // 팝니다=상품권 금액, 삽니다=구입한도
      region: f.region,
      delivery_method: dmArr.join(','),
      delivery: isSell ? (sellSendText || '발송일 협의') : (f.delivery.trim() || '협의'),
      description: f.description.trim() || null,
      tags: [isSell ? sellSendText : '', `#${f.region}`, ...dmTags].filter(Boolean),
      send_month: isSell ? sm : null,
      send_day: isSell ? sd : null,
      author_id: null,
      guest_name: f.guestName.trim(),
      guest_phone: f.guestPhone.trim(),
      guest_password: f.password.trim() || '102030', // 수정·완료 시 쓸 비번 (관리자가 지정)
      blind_locked: false,
      is_active: true,
      approved_at: nowIso, // 관리자 등록이므로 즉시 노출(팝니다·삽니다 모두)
      // 팝니다: 60일 뒤 자동삭제 대상이므로 만료 넉넉히 / 삽니다: 관리자가 정한 게시기간
      expires_at: new Date(now.getTime() + (isSell ? 60 : days) * 86400000).toISOString(),
    };
    if (!isSell) {
      payload.ad_type = f.adType;
      payload.image_url = f.imageUrl || null;                                                          // 광고박스 상단 이미지
      payload.center_text = [f.centerLine1.trim(), f.centerLine2.trim()].filter(Boolean).join('\n') || null; // 중앙문구(최대 2줄)
    }

    const { error } = await supabase.from('posts').insert(payload);
    setDirectBusy(false);
    if (error) return alert('등록 실패: ' + error.message);
    alert(`${isSell ? '판매글' : '구매글(광고)'}이 등록되었습니다.`);
    setDirectForm({ ...f, title: '', percentage: '', faceValue: '', guestName: '', guestPhone: '', description: '', sendMonth: '', sendDay: '', delivery: '', imageUrl: '', centerLine1: '', centerLine2: '' });
    fetchData();
  };

  // 삽니다 글 = 광고. 승인되어 실제 노출 중인 것만 종류별로 센다.
  // 실제 노출 중 = 승인 & 미만료 (만료 광고는 광고칸에서 내려가므로 카운트에서 제외)
  const liveAds = posts.filter((p) => p.type === 'buy' && p.approved_at && !p.deleted_at && (!p.expires_at || new Date(p.expires_at).getTime() > Date.now()));
  const adCount = (t: string) => liveAds.filter((p) => (p.ad_type ?? 'main') === t).length;
  // 만료 광고(전 종류 통합) — 승인됐지만 게시기간이 끝난 삽니다 광고
  const expiredAds = posts.filter((p) => p.type === 'buy' && !p.deleted_at && p.approved_at && p.expires_at && new Date(p.expires_at).getTime() <= Date.now());

  const filteredUsers = userFilter === 'all' ? users : users.filter((u) => (userFilter === 'business' ? u.type === 'business' : u.type !== 'business'));

  const tabs = [
    { key: 'overview' as const, label: '대시보드', icon: LayoutDashboard, count: null as number | null },
    { key: 'writepost' as const, label: '직접등록', icon: Plus, count: null as number | null },
    { key: 'users' as const, label: '회원', icon: Users, count: users.length },
    { key: 'posts' as const, label: '총 게시글', icon: FileText, count: posts.filter((p) => !p.deleted_at).length },
    { key: 'notices' as const, label: '공지', icon: Bell, count: notices.length },
    { key: 'national' as const, label: '전국광고', icon: Globe, count: adCount('national') },
    { key: 'main' as const, label: '메인광고', icon: Megaphone, count: adCount('main') },
    { key: 'recommend' as const, label: '추천업체', icon: Crown, count: adCount('recommend') },
    { key: 'expired' as const, label: '만료광고', icon: Clock, count: expiredAds.length },
  ];

  return (
    <div className="max-w-[1140px] mx-auto px-5 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="section-title mb-0">관리자 패널</h1>
        <button onClick={logout} className="btn-secondary text-[12px] h-8">로그아웃</button>
      </div>

      {/* 신규 운영자 페이지 빠른 링크 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-3">
        <a href="/admin/pages" className="card card-hover p-3 text-left">
          <span className="text-[10.5px] text-indigo-600 font-bold">안내 페이지</span>
          <p className="text-[12.5px] font-bold text-gray-900 mt-0.5">약관 / 이용안내 편집</p>
        </a>
        <a href="/admin/hero-promo" className="card card-hover p-3 text-left">
          <span className="text-[10.5px] text-violet-600 font-bold">메인 홍보</span>
          <p className="text-[12.5px] font-bold text-gray-900 mt-0.5">홍보 박스 편집</p>
        </a>
        <a href="/admin/inquiries" className="card card-hover p-3 text-left">
          <span className="text-[10.5px] text-rose-600 font-bold">문의</span>
          <p className="text-[12.5px] font-bold text-gray-900 mt-0.5">광고 / 1:1</p>
        </a>
        <a href="/admin/reports" className="card card-hover p-3 text-left">
          <span className="text-[10.5px] text-rose-600 font-bold">신고</span>
          <p className="text-[12.5px] font-bold text-gray-900 mt-0.5">사기 신고 처리</p>
        </a>
        <a href="/admin/notify" className="card card-hover p-3 text-left">
          <span className="text-[10.5px] text-blue-600 font-bold">알림 발송</span>
          <p className="text-[12.5px] font-bold text-gray-900 mt-0.5">전체/개인/업체</p>
        </a>
        <a href="/admin/points" className="card card-hover p-3 text-left">
          <span className="text-[10.5px] text-emerald-600 font-bold">포인트</span>
          <p className="text-[12.5px] font-bold text-gray-900 mt-0.5">충전 / 차감</p>
        </a>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-8 gap-2 mb-5">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`card card-hover p-3 text-left ${tab === t.key ? 'border-zinc-900' : ''}`}>
            <div className="flex items-center gap-2 mb-1">
              <t.icon size={14} className="text-zinc-400" />
              <span className="text-[11px] text-zinc-500">{t.label}</span>
            </div>
            <p className="text-xl font-semibold">{t.count ?? '—'}</p>
          </button>
        ))}
      </div>

      {/* 방문자 통계 */}
      {!loading && (
        <div className="card p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold">방문자 현황</h3>
            <span className="text-[10px] text-zinc-400">실제 방문 집계 (IP 기준 하루 1회)</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="text-center p-2 bg-zinc-50 rounded">
              <p className="text-[10px] text-zinc-400 mb-0.5">오늘 방문자</p>
              <p className="text-[18px] font-bold">{(visitors.today || 0).toLocaleString()}</p>
            </div>
            <div className="text-center p-2 bg-zinc-50 rounded">
              <p className="text-[10px] text-zinc-400 mb-0.5">누적 방문자</p>
              <p className="text-[18px] font-bold">{(visitors.total || 0).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-end gap-[3px] h-[80px]">
            {visitors.last30.map((d, i) => {
              const max = Math.max(...visitors.last30.map(v => v.count), 1);
              const h = Math.max((d.count / max) * 100, 2);
              const isToday = i === visitors.last30.length - 1;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5" title={`${d.date}: ${d.count}명`}>
                  <div className={`w-full rounded-sm transition-all ${isToday ? 'bg-zinc-900' : 'bg-zinc-200 hover:bg-zinc-300'}`} style={{ height: `${h}%` }} />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-zinc-400">
            <span>{visitors.last30[0]?.date.slice(5)}</span>
            <span>최근 30일</span>
            <span>{visitors.last30[visitors.last30.length - 1]?.date.slice(5)}</span>
          </div>
        </div>
      )}

      {loading && <div className="py-8 text-center text-zinc-400 text-[13px]">불러오는 중...</div>}

      {/* ─── Overview (종합 대시보드) ─── */}
      {!loading && tab === 'overview' && (
        <div className="space-y-4">
          {/* 사이트 설정 */}
          <div className="card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold text-zinc-800">삽니다 연락처 공개</p>
                <p className="text-[11.5px] text-zinc-500 mt-0.5">
                  {buyContactPublic
                    ? '현재 전체공개 — 누구나 삽니다 연락처를 바로 볼 수 있습니다.'
                    : '현재 비공개 — 삽니다도 팝니다처럼 500P 열람이 필요합니다.'}
                </p>
              </div>
              <button
                type="button"
                onClick={toggleBuyContactPublic}
                disabled={settingBusy}
                className={`shrink-0 relative w-12 h-7 rounded-full transition-colors disabled:opacity-50 ${buyContactPublic ? 'bg-accent' : 'bg-zinc-300'}`}
                aria-pressed={buyContactPublic}
                aria-label="삽니다 연락처 공개 토글"
              >
                <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${buyContactPublic ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </div>

          {/* 하단 사업자 정보 (푸터) 편집 */}
          <div className="card p-4">
            <p className="text-[13px] font-semibold text-zinc-800">하단 사업자 정보 (푸터)</p>
            <p className="text-[11.5px] text-zinc-500 mt-0.5 mb-2">홈·판매글·구매글 등 <b>모든 화면 맨 아래</b>에 표시됩니다. 상호명·대표자·사업자등록번호·통신판매업신고·주소 등을 자유롭게 작성하세요. (줄바꿈 그대로 나옵니다)</p>
            <textarea value={footerInfo} onChange={(e) => setFooterInfo(e.target.value)} rows={5}
              className="input w-full text-[12.5px] leading-relaxed"
              placeholder={'예)\n상호명 예판상품권 · 대표자 홍길동 · 사업자등록번호 000-00-00000\n통신판매업신고 제0000-서울강남-00000호 · 서울특별시 강남구 · 고객센터 010-8017-8500'} />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-zinc-400">비워두면 기본 문구가 표시됩니다.</span>
              <button type="button" onClick={saveFooterInfo} disabled={footerSaving}
                className="h-9 px-4 text-[12px] font-bold bg-accent text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                {footerSaving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>

          {/* 데이터 다운로드 (CSV / 전체 백업) */}
          <div className="card p-4">
            <p className="text-[13px] font-semibold text-zinc-800">데이터 다운로드 · 백업</p>
            <p className="text-[11.5px] text-zinc-500 mt-0.5 mb-2.5">회원·게시글은 엑셀(CSV)로, 전체 DB는 압축(gzip) 파일로 내려받아 보관할 수 있습니다.</p>
            <div className="flex flex-wrap gap-2">
              <a href="/api/admin/export?table=users" className="h-9 px-3.5 inline-flex items-center gap-1.5 text-[12px] font-bold bg-zinc-800 text-white rounded-md hover:bg-zinc-900">
                <FileText size={13} /> 회원 CSV
              </a>
              <a href="/api/admin/export?table=posts" className="h-9 px-3.5 inline-flex items-center gap-1.5 text-[12px] font-bold bg-zinc-800 text-white rounded-md hover:bg-zinc-900">
                <FileText size={13} /> 게시글 CSV
              </a>
              <a href="/api/admin/backup" className="h-9 px-3.5 inline-flex items-center gap-1.5 text-[12px] font-bold bg-emerald-600 text-white rounded-md hover:bg-emerald-700">
                <FileText size={13} /> 전체 DB 백업 (압축)
              </a>
            </div>
          </div>

          {/* 주요 지표 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users size={13} className="text-zinc-400" />
                <span className="text-[11px] text-zinc-500">회원</span>
              </div>
              <p className="text-xl font-semibold">{stats?.users.total ?? 0}</p>
              <p className="text-[11px] text-zinc-400 mt-1">
                업체 {stats?.users.business ?? 0} · 일반 {stats?.users.normal ?? 0}
              </p>
              <p className="text-[11px] text-emerald-600 mt-0.5">오늘 +{stats?.users.todayNew ?? 0}</p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-1">
                <FileText size={13} className="text-zinc-400" />
                <span className="text-[11px] text-zinc-500">게시글</span>
              </div>
              <p className="text-xl font-semibold">{stats?.posts.total ?? 0}</p>
              <p className="text-[11px] text-zinc-400 mt-1">
                판매 {stats?.posts.sell ?? 0} · 구매 {stats?.posts.buy ?? 0}
              </p>
              <p className="text-[11px] text-emerald-600 mt-0.5">오늘 +{stats?.posts.todayNew ?? 0}</p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={13} className="text-zinc-400" />
                <span className="text-[11px] text-zinc-500">방문자</span>
              </div>
              <p className="text-xl font-semibold">{(visitors.today || 0).toLocaleString()}</p>
              <p className="text-[11px] text-zinc-400 mt-1">누적 {(visitors.total || 0).toLocaleString()}</p>
            </div>
          </div>

          {/* 빠른 이동 */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-semibold flex items-center gap-1.5"><Activity size={13} /> 빠른 이동</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Link href="/" target="_blank" className="btn-secondary h-9 text-[12px] justify-between">
                메인 페이지 <ExternalLink size={12} />
              </Link>
              <Link href="/board?tab=buy" target="_blank" className="btn-secondary h-9 text-[12px] justify-between">
                지역별 매입찾기 <ExternalLink size={12} />
              </Link>
              <Link href="/recommended" target="_blank" className="btn-secondary h-9 text-[12px] justify-between">
                추천업체 <ExternalLink size={12} />
              </Link>
              <Link href="/notice" target="_blank" className="btn-secondary h-9 text-[12px] justify-between">
                공지사항 <ExternalLink size={12} />
              </Link>
              <Link href="/board" target="_blank" className="btn-secondary h-9 text-[12px] justify-between">
                게시판 <ExternalLink size={12} />
              </Link>
              <Link href="/guide" target="_blank" className="btn-secondary h-9 text-[12px] justify-between">
                이용안내 <ExternalLink size={12} />
              </Link>
              <Link href="/faq" target="_blank" className="btn-secondary h-9 text-[12px] justify-between">
                고객센터 <ExternalLink size={12} />
              </Link>
            </div>
          </div>

          {/* 최근 활동 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold">최근 가입 회원</h3>
                <button onClick={() => setTab('users')} className="text-[11px] text-zinc-500 hover:text-zinc-900">전체 보기</button>
              </div>
              <div className="divide-y divide-zinc-100">
                {users.slice(0, 5).map(u => (
                  <div key={u.id} className="flex items-center justify-between py-2">
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium truncate">{u.name}</p>
                      <p className="text-[11px] text-zinc-400 truncate tabular-nums">{u.phone ? formatPhone(u.phone) : '-'}</p>
                    </div>
                    <span className={`badge shrink-0 ${u.type === 'business' ? 'bg-blue-50 text-blue-600' : 'bg-zinc-100 text-zinc-500'}`}>
                      {u.type === 'business' ? '업체' : '일반'}
                    </span>
                  </div>
                ))}
                {users.length === 0 && <p className="py-6 text-center text-[12px] text-zinc-400">회원이 없습니다.</p>}
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold">최근 게시글</h3>
                <button onClick={() => setTab('posts')} className="text-[11px] text-zinc-500 hover:text-zinc-900">전체 보기</button>
              </div>
              <div className="divide-y divide-zinc-100">
                {posts.slice(0, 5).map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2 gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-medium truncate">{p.title}</p>
                      <p className="text-[11px] text-zinc-400 truncate">{p.author?.name || '-'} · {getCategoryName(p.category)}</p>
                    </div>
                    <span className={`badge shrink-0 ${p.type === 'sell' ? 'bg-blue-50 text-blue-600' : 'bg-zinc-100 text-zinc-500'}`}>
                      {p.type === 'sell' ? '판매' : '구매'}
                    </span>
                  </div>
                ))}
                {posts.length === 0 && <p className="py-6 text-center text-[12px] text-zinc-400">게시글이 없습니다.</p>}
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold">프리미엄 업체 현황</h3>
                <button onClick={() => setTab('premium')} className="text-[11px] text-zinc-500 hover:text-zinc-900">전체 보기</button>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center p-2 bg-zinc-50 rounded">
                  <p className="text-[10px] text-zinc-400 mb-0.5">전체</p>
                  <p className="text-[16px] font-semibold">{stats?.premium.total ?? 0}</p>
                </div>
                <div className="text-center p-2 bg-emerald-50 rounded">
                  <p className="text-[10px] text-zinc-400 mb-0.5">활성</p>
                  <p className="text-[16px] font-semibold text-emerald-600">{stats?.premium.active ?? 0}</p>
                </div>
                <div className="text-center p-2 bg-yellow-50 rounded">
                  <p className="text-[10px] text-zinc-400 mb-0.5">프리미엄</p>
                  <p className="text-[16px] font-semibold text-yellow-600">{stats?.premium.premium ?? 0}</p>
                </div>
              </div>
              <button onClick={() => { setTab('premium'); setShowPremiumForm(true); }} className="btn-primary w-full h-9 text-[12px]">
                <Plus size={13} /> 새 업체 등록
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Users ─── */}
      {!loading && tab === 'users' && (
        <div className="card overflow-hidden">
          {/* 일반회원 / 업체회원 구분 */}
          <div className="flex items-center gap-1 px-4 py-3 border-b border-zinc-200 bg-zinc-50">
            {([
              { k: 'all' as const, label: '전체', n: users.length },
              { k: 'normal' as const, label: '일반회원', n: users.filter(u => u.type !== 'business').length },
              { k: 'business' as const, label: '업체회원', n: users.filter(u => u.type === 'business').length },
            ]).map(f => (
              <button key={f.k} onClick={() => setUserFilter(f.k)}
                className={`h-8 px-3 text-[12px] font-bold border transition-colors ${
                  userFilter === f.k ? 'border-accent bg-accent text-white' : 'border-zinc-200 bg-white text-zinc-600 hover:border-accent hover:text-accent'
                }`}>
                {f.label} {f.n}
              </button>
            ))}
            <span className="ml-auto text-[11px] text-zinc-400">유형 배지를 누르면 일반↔업체 전환</span>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead><tr className="bg-zinc-50 border-b border-zinc-200">
              <th className="table-header text-left py-2.5 px-4">이름</th>
              <th className="table-header text-left py-2.5 px-4">연락처 (로그인 아이디)</th>
              <th className="table-header text-center py-2.5 px-4">유형</th>
              <th className="table-header text-right py-2.5 px-4">포인트</th>
              <th className="table-header text-left py-2.5 px-4">가입일</th>
              <th className="table-header text-center py-2.5 px-4">관리</th>
            </tr></thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="py-2.5 px-4 font-medium">{u.name}</td>
                  <td className="py-2.5 px-4 text-zinc-500 whitespace-nowrap tabular-nums">{u.phone ? formatPhone(u.phone) : '-'}</td>
                  <td className="py-2.5 px-4 text-center"><button onClick={() => toggleUserType(u.id, u.type)} className={`badge cursor-pointer ${u.type === 'business' ? 'bg-blue-50 text-blue-600' : 'bg-zinc-100 text-zinc-500'}`}>{u.type === 'business' ? '업체' : '일반'}</button></td>
                  <td className="py-2.5 px-4 text-right tabular-nums text-accent font-bold">{(u.points ?? 0).toLocaleString()}p</td>
                  <td className="py-2.5 px-4 text-zinc-400 text-[11px]">{new Date(u.created_at).toLocaleDateString('ko-KR')}</td>
                  <td className="py-2.5 px-4 text-center whitespace-nowrap">
                    {u.type === 'business' && (
                      <button onClick={() => openIntroEdit(u)} className="mr-2 h-7 px-2 text-[11px] border border-zinc-300 text-zinc-600 hover:border-accent hover:text-accent align-middle">소개편집</button>
                    )}
                    <button onClick={() => deleteUser(u.id)} className="text-red-400 hover:text-red-600 align-middle"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-zinc-400">회원이 없습니다.</td></tr>}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* ─── 광고 관리 (전국광고 / 메인광고 / 추천업체) ─── */}
      {!loading && (tab === 'national' || tab === 'main' || tab === 'recommend') && (() => {
        const cur = tab as 'national' | 'main' | 'recommend';
        const label = adTypeLabel(cur);
        const buyPosts = posts.filter(p => p.type === 'buy' && !p.deleted_at);
        const pending = buyPosts.filter(p => !p.approved_at && !p.extension_requested_at && (p.ad_type ?? 'main') === cur);
        const nowMs = Date.now();
        const approved = buyPosts.filter(p => p.approved_at && (p.ad_type ?? 'main') === cur);
        // 노출 중(미만료) / 만료됨(기간 종료) 분리 — 만료 광고는 광고칸에서 내려가고 여기서 재게시 가능
        const live = approved.filter(p => !p.expires_at || new Date(p.expires_at).getTime() > nowMs);
        const expired = approved.filter(p => p.expires_at && new Date(p.expires_at).getTime() <= nowMs);
        // 작성자가 연장을 신청한 글 (승인 대기 목록과 분리)
        const extReq = buyPosts.filter(p => p.extension_requested_at && (p.ad_type ?? 'main') === cur);
        return (
          <div className="space-y-4">
            <div className="card p-3 text-[12px] text-gray-600">
              <b className="text-gray-900">{label}</b> — 회원이 삽니다 글 작성 시 종류를 고르고, 여기서 게시 기간을 넣어 승인하면 홈 {label}칸에 노출됩니다.
              {cur === 'national' && <span className="text-accent font-bold"> 전국광고는 추천업체칸에도 함께 노출됩니다.</span>}
            </div>

            {/* 승인 대기 */}
            <div className="card p-4 border border-amber-200 bg-amber-50/40">
              <h3 className="text-[13px] font-bold text-amber-800 mb-3">🕒 {label} 승인 대기 ({pending.length})</h3>
              {pending.length === 0 ? (
                <p className="text-[12px] text-amber-700/70">대기 중인 신청이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {pending.map(p => (
                    <div key={p.id} className="flex flex-wrap items-center gap-2 bg-white border border-amber-200 px-3 py-2">
                      <span className="text-[12px] font-medium flex-1 min-w-[140px] truncate">
                        {p.title} <span className="text-zinc-400 font-normal">/ {p.author?.name || '비회원'} / {getCategoryName(p.category)}{p.percentage != null ? ` / 매입 ${p.percentage}%` : ''}</span>
                      </span>
                      {[20, 25, 30].map(d => (
                        <button key={d} type="button" onClick={() => approveBuyPost(p.id, d)}
                          className="h-8 px-2.5 text-[12px] font-bold border border-amber-300 hover:bg-amber-100">{d}일</button>
                      ))}
                      <input type="number" min={1} placeholder="직접(일)" value={approveDaysMap[p.id] ?? ''}
                        onChange={e => setApproveDaysMap(m => ({ ...m, [p.id]: e.target.value }))} className="input h-8 w-20" />
                      <button type="button" onClick={() => approveBuyPost(p.id, Number(approveDaysMap[p.id]))}
                        className="h-8 px-3 text-[12px] font-bold bg-accent text-white hover:bg-blue-700">승인</button>
                      <button type="button" onClick={() => deletePost(p.id)} className="h-8 px-1.5 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 연장 신청 */}
            {extReq.length > 0 && (
              <div className="card p-4 border border-blue-200 bg-blue-50/40">
                <h3 className="text-[13px] font-bold text-blue-800 mb-3">🔁 {label} 연장 신청 ({extReq.length})</h3>
                <div className="space-y-2">
                  {extReq.map(p => {
                    const exp = p.expires_at ? new Date(p.expires_at) : null;
                    const expired = exp ? exp.getTime() < Date.now() : false;
                    return (
                      <div key={p.id} className="flex flex-wrap items-center gap-2 bg-white border border-blue-200 px-3 py-2">
                        <span className="text-[12px] font-medium flex-1 min-w-[140px] truncate">
                          {p.title} <span className="text-zinc-400 font-normal">/ {p.author?.name || '비회원'}{exp ? ` / ${expired ? '만료됨' : '만료 ' + exp.toLocaleDateString('ko-KR')}` : ''}</span>
                        </span>
                        {[20, 25, 30].map(d => (
                          <button key={d} type="button" onClick={() => approveExtension(p.id, d)}
                            className="h-8 px-2.5 text-[12px] font-bold border border-blue-300 hover:bg-blue-100">{d}일</button>
                        ))}
                        <input type="number" min={1} placeholder="직접(일)" value={approveDaysMap[p.id] ?? ''}
                          onChange={e => setApproveDaysMap(m => ({ ...m, [p.id]: e.target.value }))} className="input h-8 w-20" />
                        <button type="button" onClick={() => approveExtension(p.id, Number(approveDaysMap[p.id]))}
                          className="h-8 px-3 text-[12px] font-bold bg-accent text-white hover:bg-blue-700">연장 승인</button>
                        <button type="button" onClick={() => rejectExtension(p.id)}
                          className="h-8 px-2.5 text-[12px] border border-zinc-300 text-zinc-600 hover:bg-zinc-100">거절</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 노출 중 */}
            <div className="card overflow-hidden">
              <div className="px-4 py-2.5 border-b border-zinc-200 bg-zinc-50 text-[13px] font-bold text-gray-800">
                ✅ {label} 노출 중 ({live.length})
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-[13px] nowrap-cells">
                  <thead><tr className="bg-zinc-50 border-b border-zinc-200">
                    <th className="table-header text-left py-2.5 px-4">제목</th>
                    <th className="table-header text-left py-2.5 px-4">업체</th>
                    <th className="table-header text-center py-2.5 px-4">매입률</th>
                    <th className="table-header text-left py-2.5 px-4">지역</th>
                    <th className="table-header text-center py-2.5 px-4">게시 만료</th>
                    <th className="table-header text-center py-2.5 px-4">연장</th>
                    <th className="table-header text-center py-2.5 px-4">종류 변경</th>
                    <th className="table-header text-center py-2.5 px-4">관리</th>
                  </tr></thead>
                  <tbody>
                    {live.map(p => {
                      const exp = p.expires_at ? new Date(p.expires_at) : null;
                      const expired = exp ? exp.getTime() < Date.now() : false;
                      return (
                        <tr key={p.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                          <td className="py-2.5 px-4 font-medium truncate max-w-[220px]">{p.title}</td>
                          <td className="py-2.5 px-4 text-zinc-500">{p.author?.name || '비회원'}</td>
                          <td className="py-2.5 px-4 text-center text-accent font-bold">{p.percentage != null ? `${p.percentage}%` : '-'}</td>
                          <td className="py-2.5 px-4 text-zinc-500">{p.region || '전국'}</td>
                          <td className={`py-2.5 px-4 text-center text-[11px] ${expired ? 'text-red-500 font-bold' : 'text-zinc-400'}`}>
                            {exp ? `${exp.toLocaleDateString('ko-KR')}${expired ? ' (만료)' : ''}` : '-'}
                          </td>
                          <td className="py-2.5 px-4 text-center whitespace-nowrap">
                            <input type="number" min={1} placeholder="일" value={approveDaysMap[p.id] ?? ''}
                              onChange={e => setApproveDaysMap(m => ({ ...m, [p.id]: e.target.value }))}
                              className="input h-7 w-14 text-[12px] mr-1" />
                            <button type="button" onClick={() => approveExtension(p.id, Number(approveDaysMap[p.id]))}
                              className="h-7 px-2 text-[11px] font-bold bg-accent text-white hover:bg-blue-700">연장</button>
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <select value={p.ad_type ?? 'main'} onChange={(e) => changeAdType(p.id, e.target.value)}
                              className="h-8 px-2 border border-gray-300 text-[12px] focus:border-accent focus:outline-none">
                              {AD_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                            </select>
                          </td>
                          <td className="py-2.5 px-4 text-center whitespace-nowrap">
                            <button onClick={() => unapproveAd(p.id)} className="h-7 px-2 text-[11px] border border-zinc-300 text-zinc-600 hover:bg-zinc-100 mr-1">노출중단</button>
                            <button onClick={() => deletePost(p.id)} className="text-red-400 hover:text-red-600 align-middle"><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      );
                    })}
                    {live.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-zinc-400">노출 중인 {label}가 없습니다.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 만료됨 — 기간이 끝나 광고칸·목록에서 내려간 광고. 기간(일)을 넣어 재게시(오늘부터 다시 노출) */}
            {expired.length > 0 && (
              <div className="card p-4 border border-rose-200 bg-rose-50/40">
                <h3 className="text-[13px] font-bold text-rose-800 mb-1">⛔ {label} 만료됨 ({expired.length})</h3>
                <p className="text-[11px] text-rose-700/70 mb-3">기간이 끝나 광고칸·매입찾기 목록에서 내려간 광고입니다. 기간(일)을 넣어 재게시하면 오늘부터 다시 노출됩니다.</p>
                <div className="space-y-2">
                  {expired.map(p => {
                    const exp = p.expires_at ? new Date(p.expires_at) : null;
                    return (
                      <div key={p.id} className="flex flex-wrap items-center gap-2 bg-white border border-rose-200 px-3 py-2">
                        <span className="text-[12px] font-medium flex-1 min-w-[140px] truncate">
                          {p.title} <span className="text-zinc-400 font-normal">/ {p.author?.name || '비회원'} / {getCategoryName(p.category)}{exp ? ` / ${exp.toLocaleDateString('ko-KR')} 만료` : ''}</span>
                        </span>
                        {[20, 25, 30].map(d => (
                          <button key={d} type="button" onClick={() => approveExtension(p.id, d)}
                            className="h-8 px-2.5 text-[12px] font-bold border border-rose-300 hover:bg-rose-100">{d}일</button>
                        ))}
                        <input type="number" min={1} placeholder="직접(일)" value={approveDaysMap[p.id] ?? ''}
                          onChange={e => setApproveDaysMap(m => ({ ...m, [p.id]: e.target.value }))} className="input h-8 w-20" />
                        <button type="button" onClick={() => approveExtension(p.id, Number(approveDaysMap[p.id]))}
                          className="h-8 px-3 text-[12px] font-bold bg-accent text-white hover:bg-blue-700">재게시</button>
                        <button type="button" onClick={() => deletePost(p.id)} className="h-8 px-1.5 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ─── 글 직접 등록 (폰 인증 없이) ─── */}
      {!loading && tab === 'writepost' && (
        <div className="max-w-3xl space-y-4">
          <div className="card p-3 text-[12px] text-gray-600">
            <b className="text-gray-900">글 직접 등록</b> — 휴대폰 인증 없이 번호를 직접 입력해 팝니다/삽니다 글을 바로 게시합니다. (관리자 전용, 즉시 노출)
          </div>
          <div className="card p-4 space-y-3">
            <div className="flex gap-2">
              {(['sell', 'buy'] as const).map(t => (
                <button key={t} type="button" onClick={() => setDirectForm(f => ({ ...f, type: t }))}
                  className={`flex-1 h-10 text-[13px] font-bold rounded-md border transition-colors ${directForm.type === t ? 'border-accent bg-accent/5 text-accent' : 'border-gray-200 text-gray-600 hover:border-accent'}`}>
                  {t === 'sell' ? '팝니다 (판매글)' : '삽니다 (매입광고)'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[12px] text-gray-500">상품권 종류 *</span>
                <select value={directForm.category} onChange={e => setDirectForm(f => ({ ...f, category: e.target.value }))} className="input mt-1">
                  <option value="">선택</option>
                  {categories.filter(c => c.id !== 'all' || directForm.type === 'buy').map(c => (
                    <option key={c.id} value={c.id}>{c.id === 'all' ? '모든 상품권' : c.name}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[12px] text-gray-500">지역 *</span>
                <select value={directForm.region} onChange={e => setDirectForm(f => ({ ...f, region: e.target.value }))} className="input mt-1">
                  <option value="">선택</option>
                  {['전국', '서울', '경기', '인천', '대전', '대구', '부산', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-[12px] text-gray-500">{directForm.type === 'buy' ? '상단문구 *' : '제목 *'}</span>
              <input value={directForm.title} onChange={e => setDirectForm(f => ({ ...f, title: e.target.value }))} className="input mt-1"
                placeholder={directForm.type === 'buy' ? '예: 모든 상품권 최고가 매입' : '예: 신세계 50만원 팝니다'} />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[12px] text-gray-500">{directForm.type === 'sell' ? '판매율(%) *' : '매입률(%) *'}</span>
                <input type="number" value={directForm.percentage} onChange={e => setDirectForm(f => ({ ...f, percentage: e.target.value }))} className="input mt-1" placeholder="예: 90" />
              </label>
              {directForm.type === 'buy' ? (
                <label className="block">
                  <span className="text-[12px] text-gray-500">매입 가능 시간</span>
                  <input value={directForm.delivery} onChange={e => setDirectForm(f => ({ ...f, delivery: e.target.value }))} className="input mt-1" placeholder="예: 24시간" />
                </label>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <label className="block"><span className="text-[12px] text-gray-500">발송 월</span>
                    <input type="number" min={1} max={12} value={directForm.sendMonth} onChange={e => setDirectForm(f => ({ ...f, sendMonth: e.target.value }))} className="input mt-1" placeholder="월" /></label>
                  <label className="block"><span className="text-[12px] text-gray-500">발송 일</span>
                    <input type="number" min={1} max={31} value={directForm.sendDay} onChange={e => setDirectForm(f => ({ ...f, sendDay: e.target.value }))} className="input mt-1" placeholder="일" /></label>
                </div>
              )}
            </div>

            <label className="block">
              <span className="text-[12px] text-gray-500">{directForm.type === 'sell' ? '상품권 금액(원)' : '구입한도(원)'} <span className="text-gray-400">(선택)</span></span>
              <input type="number" min={0} value={directForm.faceValue} onChange={e => setDirectForm(f => ({ ...f, faceValue: e.target.value }))} className="input mt-1"
                placeholder={directForm.type === 'sell' ? '예: 500000' : '예: 10000000 (1천만원)'} />
              {Number(directForm.faceValue) > 0 && <p className="text-[11px] text-accent mt-1 font-medium">{Number(directForm.faceValue).toLocaleString()}원</p>}
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[12px] text-gray-500">{directForm.type === 'sell' ? '판매자명 *' : '업체명 *'}</span>
                <input value={directForm.guestName} onChange={e => setDirectForm(f => ({ ...f, guestName: e.target.value }))} className="input mt-1" />
              </label>
              <label className="block">
                <span className="text-[12px] text-gray-500">전화번호 * <span className="text-accent font-bold">(인증 없이 직접 입력)</span></span>
                <input value={directForm.guestPhone} onChange={e => setDirectForm(f => ({ ...f, guestPhone: e.target.value }))} className="input mt-1" placeholder="010-0000-0000" />
              </label>
            </div>

            <label className="block">
              <span className="text-[12px] text-gray-500">수정·완료 비밀번호 *</span>
              <input value={directForm.password} onChange={e => setDirectForm(f => ({ ...f, password: e.target.value }))} className="input mt-1" placeholder="예: 1234" />
              <span className="text-[11px] text-gray-400 mt-1 block">등록 후 이 글을 <b>수정하거나 판매완료</b> 처리할 때 쓰는 비밀번호입니다. (기존 직접등록 글은 <b>1234</b>)</span>
            </label>

            <div>
              <span className="text-[12px] text-gray-500">{directForm.type === 'buy' ? '매입 방법' : '배송 방법'} *</span>
              <div className="flex gap-4 mt-1.5">
                {([['mobile', '모바일'], ['parcel', '택배'], ['direct', '직접만남']] as const).map(([k, label]) => (
                  <label key={k} className="flex items-center gap-1.5 text-[13px] cursor-pointer">
                    <input type="checkbox" checked={directForm[k]} onChange={e => setDirectForm(f => ({ ...f, [k]: e.target.checked }))} /> {label}
                  </label>
                ))}
              </div>
            </div>

            {directForm.type === 'buy' && (
              <>
                <div>
                  <span className="text-[12px] text-gray-500">광고박스 상단 이미지 <span className="text-gray-400">(선택)</span></span>
                  <div className="mt-1">
                    <ImageUploader value={directForm.imageUrl} onChange={(url) => setDirectForm(f => ({ ...f, imageUrl: url }))} folder="ads"
                      hint="가로형 이미지 권장(예: 640×400). 광고박스 상단에 표시되고 그 위에 중앙문구가 흰 글씨로 겹칩니다. 안 올리면 어두운 배경." />
                  </div>
                </div>
                <div>
                  <span className="text-[12px] text-gray-500">중앙문구 <span className="text-gray-400">(최대 2줄, 선택)</span></span>
                  <input type="text" maxLength={16} value={directForm.centerLine1} onChange={e => setDirectForm(f => ({ ...f, centerLine1: e.target.value }))} className="input mt-1 mb-2" placeholder="1줄 (예: 24시간 신속 매입)" />
                  <input type="text" maxLength={16} value={directForm.centerLine2} onChange={e => setDirectForm(f => ({ ...f, centerLine2: e.target.value }))} className="input" placeholder="2줄 (선택)" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-[12px] text-gray-500">광고 종류 *</span>
                    <select value={directForm.adType} onChange={e => setDirectForm(f => ({ ...f, adType: e.target.value as 'national' | 'main' | 'recommend' }))} className="input mt-1">
                      {AD_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-[12px] text-gray-500">게시 기간(일) *</span>
                    <input type="number" min={1} value={directForm.days} onChange={e => setDirectForm(f => ({ ...f, days: e.target.value }))} className="input mt-1" />
                  </label>
                </div>
              </>
            )}

            <label className="block">
              <span className="text-[12px] text-gray-500">상세 설명</span>
              <textarea value={directForm.description} onChange={e => setDirectForm(f => ({ ...f, description: e.target.value }))} className="input mt-1 h-24" />
            </label>

            <button type="button" onClick={submitDirectPost} disabled={directBusy}
              className="w-full h-11 bg-accent text-white font-bold rounded-md hover:bg-blue-700 disabled:opacity-50">
              {directBusy ? '등록 중...' : (directForm.type === 'sell' ? '판매글 즉시 등록' : '매입광고 즉시 등록')}
            </button>
            {directForm.type === 'sell' && <p className="text-[11px] text-gray-400 text-center">※ 판매글은 작성 60일 후 자동 삭제됩니다.</p>}
          </div>
        </div>
      )}

      {/* ─── 만료 광고 (전 종류 통합) ─── */}
      {!loading && tab === 'expired' && (
        <div className="space-y-4">
          <div className="card p-3 text-[12px] text-gray-600">
            <b className="text-gray-900">만료 광고</b> — 게시기간이 끝나 광고칸·매입찾기 목록에서 내려간 광고를 종류 구분 없이 한곳에 모아 봅니다. 기간(일)을 넣어 <b>재게시</b>하면 오늘부터 다시 노출됩니다. (글은 삭제되지 않습니다)
          </div>
          <div className="card overflow-hidden">
            <div className="px-4 py-2.5 border-b border-zinc-200 bg-rose-50 text-[13px] font-bold text-rose-800">
              ⛔ 만료된 광고 ({expiredAds.length})
            </div>
            {expiredAds.length === 0 ? (
              <p className="py-10 text-center text-zinc-400 text-[13px]">만료된 광고가 없습니다.</p>
            ) : (
              <div className="divide-y divide-zinc-100">
                {expiredAds.map(p => {
                  const exp = p.expires_at ? new Date(p.expires_at) : null;
                  const adLabel = AD_TYPES.find(a => a.value === (p.ad_type ?? 'main'))?.label ?? '메인광고';
                  return (
                    <div key={p.id} className="flex flex-wrap items-center gap-2 px-4 py-2.5">
                      <span className="text-[12px] font-medium flex-1 min-w-40 truncate">
                        {p.title}
                        <span className="text-zinc-400 font-normal"> / {p.author?.name || '비회원'} / {adLabel}{exp ? ` / ${exp.toLocaleDateString('ko-KR')} 만료` : ''}</span>
                      </span>
                      {[20, 25, 30].map(d => (
                        <button key={d} type="button" onClick={() => approveExtension(p.id, d)}
                          className="h-8 px-2.5 text-[12px] font-bold border border-rose-300 hover:bg-rose-100">{d}일</button>
                      ))}
                      <input type="number" min={1} placeholder="직접(일)" value={approveDaysMap[p.id] ?? ''}
                        onChange={e => setApproveDaysMap(m => ({ ...m, [p.id]: e.target.value }))} className="input h-8 w-20" />
                      <button type="button" onClick={() => approveExtension(p.id, Number(approveDaysMap[p.id]))}
                        className="h-8 px-3 text-[12px] font-bold bg-accent text-white hover:bg-blue-700">재게시</button>
                      <button type="button" onClick={() => deletePost(p.id)} className="h-8 px-1.5 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Posts ─── */}
      {!loading && tab === 'posts' && (
        <div className="space-y-4">
        {posts.some(p => p.type === 'buy' && !p.approved_at && !p.deleted_at) && (
          <div className="card p-4 border border-amber-200 bg-amber-50/40">
            <h3 className="text-[13px] font-bold text-amber-800 mb-3">🕒 삽니다 승인 대기 ({posts.filter(p => p.type === 'buy' && !p.approved_at && !p.deleted_at).length})</h3>
            <div className="space-y-2">
              {posts.filter(p => p.type === 'buy' && !p.approved_at && !p.deleted_at).map(p => (
                <div key={p.id} className="flex flex-wrap items-center gap-2 bg-white border border-amber-200 rounded-md px-3 py-2">
                  <span className="text-[12px] font-medium flex-1 min-w-[140px] truncate">{p.title} <span className="text-zinc-400 font-normal">/ {p.author?.name || '비회원'} / {getCategoryName(p.category)}{p.percentage != null ? ` / 매입 ${p.percentage}%` : ''}</span></span>
                  {[20, 25, 30].map(d => (
                    <button key={d} type="button" onClick={() => approveBuyPost(p.id, d)}
                      className="h-8 px-2.5 text-[12px] font-bold border border-amber-300 rounded hover:bg-amber-100">{d}일</button>
                  ))}
                  <input type="number" min={1} placeholder="직접(일)" value={approveDaysMap[p.id] ?? ''}
                    onChange={e => setApproveDaysMap(m => ({ ...m, [p.id]: e.target.value }))} className="input h-8 w-20" />
                  <button type="button" onClick={() => approveBuyPost(p.id, Number(approveDaysMap[p.id]))}
                    className="h-8 px-3 text-[12px] font-bold bg-accent text-white rounded hover:bg-blue-700">승인</button>
                  <button type="button" onClick={() => deletePost(p.id)} className="h-8 px-1.5 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-[13px] nowrap-cells">
            <thead><tr className="bg-zinc-50 border-b border-zinc-200">
              <th className="table-header text-left py-2.5 px-4">유형</th>
              <th className="table-header text-left py-2.5 px-4">제목</th>
              <th className="table-header text-left py-2.5 px-4">카테고리</th>
              <th className="table-header text-right py-2.5 px-4">가격</th>
              <th className="table-header text-left py-2.5 px-4">작성자</th>
              <th className="table-header text-center py-2.5 px-4">조회</th>
              <th className="table-header text-left py-2.5 px-4">등록일</th>
              <th className="table-header text-center py-2.5 px-4">관리</th>
            </tr></thead>
            <tbody>
              {posts.map(p => (
                <tr key={p.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="py-2.5 px-4"><span className={`badge ${p.type === 'sell' ? 'bg-blue-50 text-blue-600' : 'bg-zinc-100 text-zinc-500'}`}>{p.type === 'sell' ? '판매' : '구매'}</span>{p.type === 'buy' && !p.approved_at && <span className="ml-1 badge bg-amber-50 text-amber-600">승인대기</span>}</td>
                  <td className="py-2.5 px-4 font-medium">{p.title}</td>
                  <td className="py-2.5 px-4 text-zinc-500">{getCategoryName(p.category)}</td>
                  <td className="py-2.5 px-4 text-right font-medium">{p.percentage != null ? `${p.percentage}%` : `${(p.price ?? 0).toLocaleString()}원`}</td>
                  <td className="py-2.5 px-4 text-zinc-500">{p.author?.name || '-'}</td>
                  <td className="py-2.5 px-4 text-center text-zinc-400">{p.views}</td>
                  <td className="py-2.5 px-4 text-zinc-400 text-[11px]">{new Date(p.created_at).toLocaleDateString('ko-KR')}</td>
                  <td className="py-2.5 px-4 text-center"><button onClick={() => deletePost(p.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button></td>
                </tr>
              ))}
              {posts.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-zinc-400">게시글이 없습니다.</td></tr>}
            </tbody>
          </table>
          </div>
        </div>
        </div>
      )}

      {/* ─── Community ─── */}

      {/* ─── Notices ─── */}
      {!loading && tab === 'notices' && (
        <div className="space-y-4">
          <form onSubmit={addNotice} className="card p-4 space-y-3">
            <div>
              <label className="block text-[12px] font-medium text-zinc-600 mb-1">제목 *</label>
              <input
                value={noticeTitle}
                onChange={(e) => setNoticeTitle(e.target.value)}
                placeholder="공지 제목을 입력하세요"
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-zinc-600 mb-1">내용 (선택)</label>
              <textarea
                value={noticeContent}
                onChange={(e) => setNoticeContent(e.target.value)}
                placeholder="상세 내용을 입력하세요. 비워두면 제목만 노출됩니다."
                rows={5}
                className="input resize-y"
                style={{ height: 'auto', minHeight: '110px', padding: '10px 12px' }}
              />
            </div>
            <div>
              <ImageUploader
                value={noticeImage}
                onChange={setNoticeImage}
                folder="notices"
                label="배경 이미지 (선택)"
                hint="공지에 첨부할 이미지를 업로드하세요. Supabase Storage(altteul-giftcard 버킷)에 자동 저장됩니다."
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-[12px] text-zinc-600 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={noticePinned}
                  onChange={(e) => setNoticePinned(e.target.checked)}
                  className="w-3.5 h-3.5"
                />
                상단 고정
              </label>
              <button type="submit" className="btn-primary h-10 px-6">등록</button>
            </div>
          </form>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead><tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="table-header text-center py-2.5 px-4 w-16">고정</th>
                <th className="table-header text-left py-2.5 px-4 w-[26%]">제목</th>
                <th className="table-header text-left py-2.5 px-4">내용</th>
                <th className="table-header text-left py-2.5 px-4 w-28">등록일</th>
                <th className="table-header text-center py-2.5 px-4 w-16">관리</th>
              </tr></thead>
              <tbody>
                {notices.map(n => (
                  <tr key={n.id} className="border-b border-zinc-100 hover:bg-zinc-50 align-top">
                    <td className="py-2.5 px-4 text-center">{n.is_pinned ? <span className="badge bg-zinc-900 text-white">고정</span> : '-'}</td>
                    <td className="py-2.5 px-4 font-medium">{n.title}</td>
                    <td className="py-2.5 px-4 text-zinc-500 text-[12px] whitespace-pre-wrap break-words">
                      {n.content ? (n.content.length > 160 ? n.content.slice(0, 160) + '…' : n.content) : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-zinc-400 text-[11px] whitespace-nowrap">{new Date(n.created_at).toLocaleDateString('ko-KR')}</td>
                    <td className="py-2.5 px-4 text-center"><button onClick={() => deleteNotice(n.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button></td>
                  </tr>
                ))}
                {notices.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-zinc-400">공지가 없습니다.</td></tr>}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}


      {/* ─── Premium Buyers ─── */}
      {!loading && tab === 'premium' && (
        <div className="space-y-4">
          {showPremiumForm && (
            <form onSubmit={savePremium} className="card p-5 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-[14px] font-semibold">{editingPremium ? '프리미엄 업체 수정' : '프리미엄 업체 등록'}</h3>
                <button type="button" onClick={resetPremiumForm} className="text-zinc-400 hover:text-zinc-700 text-[12px]">취소</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">업체명 *</label>
                  <input value={premiumForm.name} onChange={e => setPremiumForm(p => ({ ...p, name: e.target.value }))} className="input h-9" required />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">연락처</label>
                  <input value={premiumForm.phone} onChange={e => setPremiumForm(p => ({ ...p, phone: e.target.value }))} className="input h-9" placeholder="010-0000-0000" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1">메인 배너 문구 (선택)</label>
                <input
                  value={premiumForm.headline}
                  onChange={e => setPremiumForm(p => ({ ...p, headline: e.target.value }))}
                  className="input h-9"
                  maxLength={20}
                  placeholder="예: 간편한 비대면 매입"
                />
                <p className="text-[10px] text-zinc-400 mt-1">홈 상단 카드 상단 어두운 배너에 크게 표시됩니다. (최대 20자, 비워두면 업체 소개 첫 줄 사용)</p>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1">업체 소개 (2~3줄)</label>
                <textarea value={premiumForm.description} onChange={e => setPremiumForm(p => ({ ...p, description: e.target.value }))}
                  className="input" rows={2} placeholder="예: 간편한 비대면 상품권 매입 / 당일 입금 OK"
                  style={{ height: 'auto', minHeight: '60px', padding: '8px 12px' }} />
                <p className="text-[10px] text-zinc-400 mt-1">카드 본문에 표시됩니다. 핵심 혜택만 짧게 작성하세요.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">지역</label>
                  <input value={premiumForm.region} onChange={e => setPremiumForm(p => ({ ...p, region: e.target.value }))} className="input h-9" placeholder="서울 강남구" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">취급 브랜드 (쉼표 구분)</label>
                  <input value={premiumForm.brands} onChange={e => setPremiumForm(p => ({ ...p, brands: e.target.value }))} className="input h-9" placeholder="신세계, 롯데" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1">카드 매입률 (%) — 예: 92 → &quot;예판상품권 92% 매입&quot;</label>
                <input type="number" step="0.1" min={0} max={200} value={premiumForm.buy_rate} onChange={e => setPremiumForm(p => ({ ...p, buy_rate: e.target.value }))} className="input h-9" placeholder="92 (비우면 카드에 표시 안 함)" />
              </div>
              <div>
                <ImageUpload label="업체 이미지" folder="buyers" value={premiumForm.image_url} onChange={(url) => setPremiumForm(p => ({ ...p, image_url: url }))} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">연결 회원 (선택)</label>
                  <select value={premiumForm.user_id} onChange={e => setPremiumForm(p => ({ ...p, user_id: e.target.value }))} className="input h-9">
                    <option value="">미연결</option>
                    {users.filter(u => u.type === 'business').map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.phone ? formatPhone(u.phone) : '번호없음'})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">광고 등급</label>
                  <select value={premiumForm.tier} onChange={e => setPremiumForm(p => ({ ...p, tier: e.target.value as 'premium' | 'standard' | 'basic' }))} className="input h-9">
                    <option value="premium">프리미엄</option>
                    <option value="standard">스탠다드</option>
                    <option value="basic">베이직</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1">우선순위</label>
                  <input type="number" value={premiumForm.priority} onChange={e => setPremiumForm(p => ({ ...p, priority: Number(e.target.value) }))} className="input h-9" />
                </div>
                <div className="flex items-end pb-0.5 gap-3">
                  <label className="flex items-center gap-1.5 text-[12px] text-zinc-600">
                    <input type="checkbox" checked={premiumForm.is_active} onChange={e => setPremiumForm(p => ({ ...p, is_active: e.target.checked }))} className="w-3.5 h-3.5" /> 활성화
                  </label>
                  <label className="flex items-center gap-1.5 text-[12px] text-amber-700 font-bold">
                    <input type="checkbox" checked={premiumForm.is_best} onChange={e => setPremiumForm(p => ({ ...p, is_best: e.target.checked }))} className="w-3.5 h-3.5" /> 이달의 BEST
                  </label>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={resetPremiumForm} className="btn-secondary flex-1 h-9 text-[12px]">취소</button>
                <button type="submit" className="btn-primary flex-1 h-9 text-[12px]">{editingPremium ? '수정' : '등록'}</button>
              </div>
            </form>
          )}

          {!showPremiumForm && (
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-zinc-500">{premiumBuyers.filter(b => b.is_active).length}개 활성</span>
              <button onClick={() => setShowPremiumForm(true)} className="btn-primary h-9"><Plus size={14} /> 새 업체</button>
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead><tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="table-header text-left py-2.5 px-4">업체명</th>
                <th className="table-header text-left py-2.5 px-4">소개</th>
                <th className="table-header text-left py-2.5 px-4">브랜드</th>
                <th className="table-header text-left py-2.5 px-4">연락처</th>
                <th className="table-header text-left py-2.5 px-4">지역</th>
                <th className="table-header text-center py-2.5 px-4">등급</th>
                <th className="table-header text-center py-2.5 px-4">순위</th>
                <th className="table-header text-center py-2.5 px-4">상태</th>
                <th className="table-header text-center py-2.5 px-4">관리</th>
              </tr></thead>
              <tbody>
                {premiumBuyers.map(b => (
                  <tr key={b.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="py-2.5 px-4 font-medium">{b.name}</td>
                    <td className="py-2.5 px-4 text-zinc-500 max-w-[200px] truncate">{b.description || '-'}</td>
                    <td className="py-2.5 px-4">{b.brands?.map(br => <span key={br} className="badge bg-zinc-100 text-zinc-600 mr-1">{br}</span>)}</td>
                    <td className="py-2.5 px-4 text-zinc-500 whitespace-nowrap tabular-nums">{b.phone || '-'}</td>
                    <td className="py-2.5 px-4 text-zinc-500 whitespace-nowrap">{b.region || '-'}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`badge ${b.tier === 'premium' ? 'bg-yellow-50 text-yellow-600' : b.tier === 'basic' ? 'bg-zinc-100 text-zinc-400' : 'bg-blue-50 text-blue-600'}`}>
                        {b.tier === 'premium' ? '프리미엄' : b.tier === 'basic' ? '베이직' : '스탠다드'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">{b.priority}</td>
                    <td className="py-2.5 px-4 text-center">
                      <button onClick={() => togglePremiumActive(b)} className={`badge cursor-pointer ${b.is_active ? 'bg-green-50 text-green-600' : 'bg-zinc-100 text-zinc-400'}`}>
                        {b.is_active ? '활성' : '비활성'}
                      </button>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => startEditPremium(b)} className="text-zinc-400 hover:text-zinc-600"><Pencil size={13} /></button>
                        <button onClick={() => deletePremium(b.id)} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {premiumBuyers.length === 0 && <tr><td colSpan={9} className="py-8 text-center text-zinc-400">프리미엄 업체가 없습니다.</td></tr>}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── Ads ─── */}
      {!loading && tab === 'ads' && (
        <div className="space-y-4">
          {/* Ad Form */}
          {showAdForm && (
            <form onSubmit={saveAd} className="card p-5 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[15px] font-semibold">{editingAd ? '광고 수정' : '새 광고 등록'}</h3>
                <button type="button" onClick={resetAdForm} className="text-zinc-400 hover:text-zinc-700 text-[12px]">취소</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-zinc-600 mb-1">슬롯 위치 *</label>
                  <select value={adForm.slot} onChange={e => setAdForm(p => ({ ...p, slot: e.target.value as AdSlot }))} className="input">
                    {ALL_SLOTS.map(s => (
                      <option key={s} value={s}>{AD_SLOT_LABELS[s]} ({AD_SLOT_SIZES[s]})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-zinc-600 mb-1">광고주</label>
                  <input value={adForm.advertiser} onChange={e => setAdForm(p => ({ ...p, advertiser: e.target.value }))} className="input" placeholder="광고주명" />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-zinc-600 mb-1">광고 제목 *</label>
                <input value={adForm.title} onChange={e => setAdForm(p => ({ ...p, title: e.target.value }))} className="input" required placeholder="배너에 표시될 제목" />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-zinc-600 mb-1">설명</label>
                <input value={adForm.description} onChange={e => setAdForm(p => ({ ...p, description: e.target.value }))} className="input" placeholder="짧은 설명" />
              </div>
              <div>
                <ImageUpload label="광고 이미지" folder="ads" value={adForm.image_url} onChange={(url) => setAdForm(p => ({ ...p, image_url: url }))} />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-zinc-600 mb-1">클릭 시 이동 URL</label>
                  <input value={adForm.link_url} onChange={e => setAdForm(p => ({ ...p, link_url: e.target.value }))} className="input" placeholder="https://..." />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-zinc-600 mb-1">시작일</label>
                  <input type="date" value={adForm.start_date} onChange={e => setAdForm(p => ({ ...p, start_date: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-zinc-600 mb-1">종료일</label>
                  <input type="date" value={adForm.end_date} onChange={e => setAdForm(p => ({ ...p, end_date: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-zinc-600 mb-1">우선순위</label>
                  <input type="number" value={adForm.priority} onChange={e => setAdForm(p => ({ ...p, priority: Number(e.target.value) }))} className="input" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 text-[12px] text-zinc-600">
                  <input type="checkbox" checked={adForm.is_active} onChange={e => setAdForm(p => ({ ...p, is_active: e.target.checked }))} className="w-3.5 h-3.5" /> 활성화
                </label>
                <div className="ml-auto flex gap-2">
                  <button type="button" onClick={resetAdForm} className="btn-secondary h-9">취소</button>
                  <button type="submit" className="btn-primary h-9">{editingAd ? '수정' : '등록'}</button>
                </div>
              </div>
            </form>
          )}

          {/* Slot overview */}
          {!showAdForm && (
            <div className="flex items-center justify-between">
              <div className="text-[13px] text-zinc-500">
                {ALL_SLOTS.length}개 슬롯 / {ads.filter(a => a.is_active).length}개 활성 광고
              </div>
              <button onClick={() => setShowAdForm(true)} className="btn-primary h-9">
                <Plus size={14} /> 새 광고
              </button>
            </div>
          )}

          {/* Grouped by slot */}
          {!showAdForm && ALL_SLOTS.map(slot => {
            const slotAds = ads.filter(a => a.slot === slot);
            if (slotAds.length === 0) return (
              <div key={slot} className="card p-3 flex items-center justify-between">
                <div>
                  <span className="text-[13px] font-medium text-zinc-700">{AD_SLOT_LABELS[slot]}</span>
                  <span className="text-[11px] text-zinc-400 ml-2">{AD_SLOT_SIZES[slot]}</span>
                </div>
                <span className="text-[11px] text-zinc-400">비어있음</span>
              </div>
            );
            return (
              <div key={slot} className="card overflow-hidden">
                <div className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
                  <div>
                    <span className="text-[13px] font-medium text-zinc-700">{AD_SLOT_LABELS[slot]}</span>
                    <span className="text-[11px] text-zinc-400 ml-2">{AD_SLOT_SIZES[slot]}</span>
                  </div>
                  <span className="text-[11px] text-zinc-500">{slotAds.length}개</span>
                </div>
                {slotAds.map(a => (
                  <div key={a.id} className="px-4 py-3 border-b border-zinc-100 last:border-b-0 flex items-center gap-3 hover:bg-zinc-50">
                    {a.image_url ? (
                      <div className="w-16 h-10 rounded bg-zinc-100 overflow-hidden shrink-0">
                        <img src={a.image_url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-10 rounded bg-zinc-100 flex items-center justify-center text-[9px] text-zinc-400 shrink-0">미리보기</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-zinc-800 truncate">{a.title || '(제목 없음)'}</p>
                      <p className="text-[11px] text-zinc-400">{a.advertiser || '광고주 미지정'} / {a.start_date.slice(0, 10)} ~ {a.end_date.slice(0, 10)}</p>
                    </div>
                    <span className={`badge ${a.is_active ? 'bg-green-50 text-green-600' : 'bg-zinc-100 text-zinc-400'}`}>
                      {a.is_active ? '활성' : '비활성'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => toggleAdActive(a)} className="text-zinc-400 hover:text-zinc-600" title={a.is_active ? '비활성화' : '활성화'}>
                        {a.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button onClick={() => startEditAd(a)} className="text-zinc-400 hover:text-zinc-600"><Pencil size={14} /></button>
                      <button onClick={() => deleteAd(a.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* 업체 소개 편집 모달 */}
      {introEdit && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 p-4" onClick={() => setIntroEdit(null)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-lg p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-gray-900">{introEdit.name} — 업체 소개 편집</h3>
              <button onClick={() => setIntroEdit(null)} className="text-[13px] text-gray-400 hover:text-gray-700">닫기</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-gray-600 mb-1">업체 소개 이미지</label>
                <ImageUploader value={introEdit.imageUrl} onChange={(url) => setIntroEdit((p) => p && { ...p, imageUrl: url })} folder="intro" />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-600 mb-1">주력 카테고리 (최대 2개)</label>
                <div className="flex flex-wrap gap-2">
                  {categories.filter((c) => c.id !== 'all').map((cat) => {
                    const on = introEdit.categories.includes(cat.id);
                    return (
                      <button key={cat.id} type="button"
                        onClick={() => setIntroEdit((p) => {
                          if (!p) return p;
                          if (on) return { ...p, categories: p.categories.filter((c) => c !== cat.id) };
                          if (p.categories.length >= 2) return p;
                          return { ...p, categories: [...p.categories, cat.id] };
                        })}
                        className={`badge cursor-pointer ${on ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}>
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-600 mb-1">업체 소개</label>
                <textarea value={introEdit.intro} onChange={(e) => setIntroEdit((p) => p && { ...p, intro: e.target.value })}
                  rows={4} placeholder="업체 소개 (상세페이지에 노출)" className="input h-auto py-3 resize-none" />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-600 mb-1">운영 시간</label>
                <input type="text" value={introEdit.hours} onChange={(e) => setIntroEdit((p) => p && { ...p, hours: e.target.value })}
                  placeholder="예: 연중무휴 24시간" className="input" />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={saveIntroEdit} disabled={introSaving} className="btn-primary h-10 px-5 text-[13px] disabled:opacity-60">
                  {introSaving ? '저장 중...' : '저장'}
                </button>
                <button onClick={() => setIntroEdit(null)} className="btn-secondary h-10 px-5 text-[13px]">취소</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
