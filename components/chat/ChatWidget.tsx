'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, ArrowLeft, Send, ChevronDown, FileText, CreditCard, Truck, CheckCircle2, Info, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getChats, getChat, getMessages, sendMessage as apiSendMessage, updateChatStep } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import QuoteForm, { QuoteData } from '@/components/chat/QuoteForm';
import type { DBChat, DBMessage } from '@/lib/types';

const stepLabels = ['', '견적', '기본정보', '계약서', '입금', '배송', '완료'];

const stepToStatus = (step: number, status?: string): string => {
  if (status && status !== 'active') return status;
  if (step >= 6 && status === '거래완료') return '거래완료';
  if (step >= 2) return '거래중';
  return '견적대기';
};

export default function ChatWidget() {
  const { user, isLoggedIn } = useAuth();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'list' | 'room'>('list');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // List state
  const [chats, setChats] = useState<DBChat[]>([]);
  const [listLoading, setListLoading] = useState(false);

  // Room state
  const [chat, setChat] = useState<DBChat | null>(null);
  const [messages, setMessages] = useState<DBMessage[]>([]);
  const [roomLoading, setRoomLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Listen for open-chat-widget event
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.chatId) {
        setOpen(true);
        openRoom(detail.chatId);
      } else {
        setOpen(true);
      }
    };
    window.addEventListener('open-chat-widget', handler);
    return () => window.removeEventListener('open-chat-widget', handler);
  }, []);

  // Fetch chat list
  useEffect(() => {
    if (!open || !user) return;
    setListLoading(true);
    getChats(user.id).then(setChats).catch(() => {}).finally(() => setListLoading(false));
  }, [open, user]);

  // Open a chat room
  const openRoom = (chatId: string) => {
    setActiveChatId(chatId);
    setView('room');
    setRoomLoading(true);
    setMessages([]);
    Promise.all([getChat(chatId), getMessages(chatId)])
      .then(([c, m]) => { setChat(c); setCurrentStep(c.current_step || 1); setMessages(m); })
      .catch(() => {})
      .finally(() => setRoomLoading(false));
  };

  // Realtime
  useEffect(() => {
    if (!activeChatId || view !== 'room') return;
    const channel = supabase
      .channel(`widget-${activeChatId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'altteul_giftcard', table: 'messages', filter: `chat_id=eq.${activeChatId}` },
        (payload: { new: DBMessage }) => {
          setMessages(prev => prev.some(m => m.id === payload.new.id) ? prev : [...prev, payload.new]);
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'altteul_giftcard', table: 'chats', filter: `id=eq.${activeChatId}` },
        (payload: { new: { current_step: number } }) => { setCurrentStep(payload.new.current_step); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeChatId, view]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const addSystemMessage = async (content: string, type = 'system-action', data?: Record<string, unknown>) => {
    if (!user || !activeChatId) return;
    try {
      const msg = await apiSendMessage({ chat_id: activeChatId, sender_id: null, type, content, data: data || null });
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
    } catch {}
  };

  const handleSend = async () => {
    if (!inputText.trim() || !user || !activeChatId || sending) return;
    const text = inputText;
    setInputText('');
    setSending(true);
    try {
      const msg = await apiSendMessage({ chat_id: activeChatId, sender_id: user.id, type: 'message', content: text, data: null });
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
    } catch { setInputText(text); }
    setSending(false);
    inputRef.current?.focus();
  };

  const advanceStep = async (step: number, status?: string) => {
    if (!activeChatId) return;
    try { await updateChatStep(activeChatId, step, status); setCurrentStep(step); } catch {}
  };

  const handleQuoteSubmit = async (data: QuoteData) => {
    await addSystemMessage('견적을 제안했습니다.', 'quote', data as unknown as Record<string, unknown>);
    setShowQuoteForm(false);
    await addSystemMessage('견적을 제안했습니다. 상대방의 응답을 기다려주세요.', 'system-action');
  };

  const isEscrow = chat?.trade_type === 'escrow';
  const completedStep = isEscrow ? 8 : 6;

  // 직접거래 단계: 견적 -> 기본정보 -> 계약서 -> 입금 -> 배송 -> 완료
  const directActions: Record<number, { primary?: { label: string; action: () => void; icon?: React.ReactNode }; secondary?: { label: string; action: () => void; icon?: React.ReactNode }[] }> = {
    1: { primary: { label: '견적 제안', action: () => setShowQuoteForm(true), icon: <FileText size={12} /> } },
    2: { primary: { label: '기본정보 확인', action: async () => { await addSystemMessage('기본정보를 확인했습니다.'); await advanceStep(3); } }, secondary: [{ label: '기본정보 제출', action: async () => { await addSystemMessage('기본정보를 제출했습니다.'); } }] },
    3: { primary: { label: '계약서 작성', action: async () => { await addSystemMessage('계약서가 작성되었습니다.'); await advanceStep(4); }, icon: <FileText size={12} /> } },
    4: { primary: { label: '입금 확인', action: async () => { await addSystemMessage('입금이 확인되었습니다.'); await advanceStep(5); } }, secondary: [{ label: '입금 요청', action: async () => { await addSystemMessage('입금 확인을 요청했습니다.'); }, icon: <CreditCard size={12} /> }] },
    5: { primary: { label: '거래 완료', action: async () => { await addSystemMessage('거래가 완료되었습니다.'); await advanceStep(6, '거래완료'); }, icon: <CheckCircle2 size={12} /> }, secondary: [{ label: '배송 요청', action: async () => { await addSystemMessage('배송정보를 요청했습니다.'); }, icon: <Truck size={12} /> }, { label: '배송 입력', action: async () => { await addSystemMessage('배송정보가 입력되었습니다.'); } }] },
  };

  // 중개거래 단계: 견적 -> 기본정보 -> 중개계약서 -> 구매자->중개 송금 -> 중개->판매자 송금 -> 판매자 상품권->중개 -> 중개->구매자 전달 -> 완료
  const escrowActions: Record<number, { primary?: { label: string; action: () => void; icon?: React.ReactNode }; secondary?: { label: string; action: () => void; icon?: React.ReactNode }[] }> = {
    1: { primary: { label: '견적 제안', action: () => setShowQuoteForm(true), icon: <FileText size={12} /> } },
    2: { primary: { label: '기본정보 확인', action: async () => { await addSystemMessage('기본정보를 확인했습니다.'); await advanceStep(3); } }, secondary: [{ label: '기본정보 제출', action: async () => { await addSystemMessage('기본정보를 제출했습니다.'); } }] },
    3: { primary: { label: '중개 계약서 작성', action: async () => { await addSystemMessage('[중개] 중개 계약서가 작성되었습니다. 구매자는 중개업체 계좌로 송금해주세요.'); await advanceStep(4); }, icon: <FileText size={12} /> } },
    4: { primary: { label: '구매자 송금 확인', action: async () => { await addSystemMessage('[중개] 구매자가 중개업체로 송금을 완료했습니다. 중개업체가 판매자에게 송금합니다.'); await advanceStep(5); } }, secondary: [{ label: '송금 요청', action: async () => { await addSystemMessage('[중개] 구매자에게 중개업체 계좌로 송금을 요청했습니다.'); }, icon: <CreditCard size={12} /> }] },
    5: { primary: { label: '판매자 송금 완료', action: async () => { await addSystemMessage('[중개] 중개업체가 판매자에게 송금을 완료했습니다. 판매자는 상품권을 중개업체로 전달해주세요.'); await advanceStep(6); } } },
    6: { primary: { label: '상품권 수령 확인', action: async () => { await addSystemMessage('[중개] 중개업체가 판매자로부터 상품권을 수령했습니다. 구매자에게 전달합니다.'); await advanceStep(7); } }, secondary: [{ label: '상품권 전달 요청', action: async () => { await addSystemMessage('[중개] 판매자에게 상품권 전달을 요청했습니다.'); }, icon: <Truck size={12} /> }] },
    7: { primary: { label: '거래 완료', action: async () => { await addSystemMessage('[중개] 중개업체가 구매자에게 상품권을 전달했습니다. 거래가 완료되었습니다.'); await advanceStep(8, '거래완료'); }, icon: <CheckCircle2 size={12} /> } },
  };

  const actions = isEscrow ? escrowActions : directActions;

  const formatTime = (d: string) => { const t = new Date(d); return `${t.getHours() < 12 ? '오전' : '오후'} ${t.getHours() % 12 || 12}:${String(t.getMinutes()).padStart(2, '0')}`; };
  const formatRelative = (d: string) => { const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000); if (m < 1) return '방금'; if (m < 60) return `${m}분 전`; const h = Math.floor(m / 60); if (h < 24) return `${h}시간 전`; return `${Math.floor(h / 24)}일 전`; };

  if (!isLoggedIn) return null;

  const currentActs = actions[currentStep];
  const isBuyer = chat?.buyer_id === user?.id;
  const partner = chat ? (isBuyer ? chat.seller : chat.buyer) : null;

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button onClick={() => setOpen(true)}
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 w-12 h-12 bg-zinc-900 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-zinc-800 transition-all z-40 hover:scale-105">
          <MessageCircle size={20} />
          {chats.some(c => c.current_step < 6 && c.status === 'active') && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
          )}
        </button>
      )}

      {/* Widget Panel */}
      {open && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 w-[360px] h-[520px] bg-white rounded-xl border border-zinc-200 shadow-2xl flex flex-col overflow-hidden z-50">

          {/* === LIST VIEW === */}
          {view === 'list' && (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
                <span className="text-[14px] font-semibold">채팅</span>
                <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-600"><X size={18} /></button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {listLoading ? (
                  <div className="py-16 text-center text-zinc-400 text-[12px]">불러오는 중...</div>
                ) : chats.length === 0 ? (
                  <div className="py-16 text-center text-zinc-400 text-[12px]">채팅 내역이 없습니다.</div>
                ) : chats.map(c => {
                  const ib = c.buyer_id === user!.id;
                  const p = ib ? c.seller : c.buyer;
                  const st = stepToStatus(c.current_step, c.status);
                  return (
                    <button key={c.id} onClick={() => openRoom(c.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors text-left border-b border-zinc-50 last:border-b-0">
                      <div className="w-9 h-9 bg-zinc-900 rounded-full flex items-center justify-center text-white text-[11px] font-semibold shrink-0">
                        {p?.name?.charAt(0) ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-medium text-zinc-900 truncate">{p?.name ?? '알 수 없음'}</span>
                          <span className={`text-[9px] px-1 py-px rounded ${ib ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>{ib ? '판매' : '구매'}</span>
                          {c.trade_type === 'escrow' && <span className="text-[9px] px-1 py-px rounded bg-blue-50 text-blue-500">중개</span>}
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate">{c.post?.title ?? '삭제된 게시글'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${st === '거래완료' ? 'bg-zinc-100 text-zinc-500' : st === '거래중' ? 'bg-blue-50 text-blue-500' : 'bg-yellow-50 text-yellow-600'}`}>{st}</span>
                        <p className="text-[9px] text-zinc-400 mt-1">{formatRelative(c.updated_at)}</p>
                      </div>
                      <ChevronRight size={12} className="text-zinc-300 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* === ROOM VIEW === */}
          {view === 'room' && (
            <>
              {/* Room Header */}
              <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-zinc-100 shrink-0">
                <button onClick={() => { setView('list'); setActiveChatId(null); setChat(null); }} className="text-zinc-400 hover:text-zinc-600"><ArrowLeft size={16} /></button>
                <div className="w-7 h-7 bg-zinc-900 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0">
                  {partner?.name?.charAt(0) ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-medium text-zinc-900 truncate block">{partner?.name ?? '...'}</span>
                  <span className="text-[10px] text-zinc-400">{chat?.post?.title ?? ''}</span>
                </div>
                {isEscrow && <span className="text-[9px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">중개</span>}
                {currentStep < completedStep && <span className="text-[9px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded shrink-0">{currentStep}/{completedStep}</span>}
                <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-600"><X size={16} /></button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 bg-[#F5F5F5]">
                {roomLoading ? (
                  <div className="py-12 text-center text-zinc-400 text-[12px]">불러오는 중...</div>
                ) : messages.map(msg => (
                  <div key={msg.id}>
                    {msg.type === 'notice' && (
                      <div className="bg-white border border-zinc-200 rounded-lg px-3 py-2 mb-1">
                        <div className="flex gap-2"><Info size={12} className="text-zinc-400 shrink-0 mt-0.5" /><p className="text-[10px] text-zinc-500 leading-[1.6]">{msg.content}</p></div>
                      </div>
                    )}
                    {msg.type === 'system-action' && (
                      <div className="text-center py-0.5"><span className="text-[10px] text-zinc-400">{msg.content}</span></div>
                    )}
                    {msg.type === 'quote' && (
                      <div className="flex justify-center py-1">
                        <div className="bg-white border border-zinc-200 rounded-lg p-3 w-full">
                          <p className="text-[11px] font-semibold text-zinc-900 mb-2 flex items-center gap-1"><FileText size={11} className="text-zinc-400" /> 견적 제안</p>
                          {msg.data && (
                            <div className="space-y-0.5 text-[10px] mb-2">
                              <div className="flex justify-between"><span className="text-zinc-400">수량</span><span>{String(msg.data.quantity)}건</span></div>
                              <div className="flex justify-between"><span className="text-zinc-400">구매금액</span><span>{Number(msg.data.pricePerUnit).toLocaleString()}원</span></div>
                              <div className="flex justify-between"><span className="text-zinc-400">할인율</span><span className="text-red-500 font-medium">{String(msg.data.discount)}%</span></div>
                            </div>
                          )}
                          {currentStep === 1 && (
                            <div className="flex gap-1.5">
                              <button onClick={async () => { await addSystemMessage('견적이 수락되었습니다.'); await advanceStep(2); }} className="btn-primary flex-1 h-7 text-[10px]">수락</button>
                              <button className="btn-secondary flex-1 h-7 text-[10px]">거절</button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {msg.type === 'message' && (() => {
                      const isMe = msg.sender_id === user?.id;
                      return (
                        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-px`}>
                          <div className={`flex items-end gap-1 max-w-[75%] ${isMe ? 'flex-row-reverse' : ''}`}>
                            <div className={`px-3 py-1.5 text-[12px] leading-[1.6] ${
                              isMe ? 'bg-zinc-900 text-white rounded-[16px] rounded-br-[3px]'
                                    : 'bg-white text-zinc-800 rounded-[16px] rounded-bl-[3px] border border-zinc-200'
                            }`}>{msg.content}</div>
                            <span className="text-[8px] text-zinc-400 shrink-0 pb-0.5">{formatTime(msg.created_at)}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Quote Modal */}
              {showQuoteForm && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 p-3">
                  <QuoteForm onSubmit={handleQuoteSubmit} onClose={() => setShowQuoteForm(false)} />
                </div>
              )}

              {/* Step Actions */}
              {currentStep < completedStep && currentActs && (
                <div className="border-t border-zinc-100 bg-white shrink-0">
                  <button onClick={() => setShowActions(!showActions)}
                    className="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] text-zinc-400 hover:text-zinc-600">
                    거래 관리 <ChevronDown size={10} className={`transition-transform ${showActions ? 'rotate-180' : ''}`} />
                  </button>
                  {showActions && (
                    <div className="px-3 pb-2 flex gap-1.5">
                      {currentActs.secondary?.map((a, i) => (
                        <button key={i} onClick={a.action} className="btn-secondary flex-1 h-7 text-[10px] px-2">{a.icon}{a.label}</button>
                      ))}
                      {currentActs.primary && (
                        <button onClick={currentActs.primary.action} className="btn-primary flex-1 h-7 text-[10px] px-2">{currentActs.primary.icon}{currentActs.primary.label}</button>
                      )}
                    </div>
                  )}
                </div>
              )}
              {currentStep >= completedStep && (
                <div className="border-t border-zinc-100 bg-zinc-50 px-3 py-2 text-center shrink-0">
                  <span className="text-[10px] text-zinc-500 flex items-center justify-center gap-1"><CheckCircle2 size={11} /> 거래 완료</span>
                </div>
              )}

              {/* Input */}
              <div className="border-t border-zinc-200 bg-white px-2.5 py-2 shrink-0">
                <div className="flex items-center gap-1.5">
                  <input ref={inputRef} type="text" value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSend()}
                    placeholder="메시지 입력"
                    className="flex-1 h-8 px-3 bg-zinc-100 rounded-full text-[12px] focus:outline-none focus:ring-1 focus:ring-zinc-300 placeholder:text-zinc-400" />
                  <button onClick={handleSend} disabled={!inputText.trim() || sending}
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${inputText.trim() ? 'bg-zinc-900 text-white' : 'bg-zinc-200 text-zinc-400'}`}>
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
