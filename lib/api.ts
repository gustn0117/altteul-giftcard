import { supabase } from './supabase';
import type { DBPost, DBUser, DBChat, DBMessage, DBNotice, DBPremiumBuyer } from './types';

// ─── Posts ───

export async function getPosts(type?: 'sell' | 'buy', opts?: { limit?: number; withAuthor?: boolean }) {
  const limit = opts?.limit ?? 100;
  const withAuthor = opts?.withAuthor ?? true;
  const selectCols = withAuthor
    ? 'id, type, title, category, face_value, price, discount, delivery, delivery_method, tags, views, is_active, author_id, guest_name, created_at, author:users!author_id(id, name, type)'
    : 'id, type, title, category, face_value, price, discount, delivery, delivery_method, tags, views, is_active, author_id, guest_name, created_at';
  let q = supabase.from('posts').select(selectCols).order('created_at', { ascending: false }).limit(limit);
  if (type) q = q.eq('type', type);
  const { data, error } = await q;
  if (error) throw error;
  return (data as unknown) as (DBPost & { author: DBUser })[];
}

export async function getPost(id: string) {
  // 조회수 증가는 비동기로 background 실행 (await 안함)
  supabase.rpc('increment_views', { post_id: id }).then(() => {}, () => {});
  const { data, error } = await supabase
    .from('posts')
    .select('*, author:users!author_id(id, name, type, phone)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as DBPost & { author: DBUser };
}

export async function createPost(post: Record<string, unknown>) {
  const { data, error } = await supabase.from('posts').insert(post).select().single();
  if (error) throw error;
  return data as DBPost;
}

export async function updatePost(id: string, updates: Partial<DBPost>) {
  const { data, error } = await supabase.from('posts').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  return data as DBPost;
}

export async function deletePost(id: string) {
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) throw error;
}

// ─── Users ───

export async function getUser(id: string) {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
  if (error) throw error;
  return data as DBUser;
}

export async function getUserByEmail(email: string) {
  const { data, error } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
  if (error) throw error;
  return data as DBUser | null;
}

export async function createUser(user: Omit<DBUser, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase.from('users').insert(user).select().single();
  if (error) throw error;
  return data as DBUser;
}

export async function loginUser(email: string, password: string) {
  // Simple email-based lookup (no real password check for demo)
  const user = await getUserByEmail(email);
  return user;
}

// ─── Chats ───

export async function getChats(userId: string) {
  // 무거운 join 제거: post/buyer/seller는 client에서 별도 조회하거나 lookup
  const { data, error } = await supabase
    .from('chats')
    .select('id, post_id, buyer_id, seller_id, status, current_step, trade_type, escrow_status, created_at, updated_at')
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('updated_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data as DBChat[];
}

export async function getChat(id: string) {
  const { data, error } = await supabase
    .from('chats')
    .select('*, post:posts(*), buyer:users!buyer_id(id, name, type), seller:users!seller_id(id, name, type)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as DBChat;
}

export async function createChat(chat: { post_id: string; buyer_id: string; seller_id: string; trade_type?: 'direct' | 'escrow' }) {
  const { data, error } = await supabase.from('chats').insert(chat).select().single();
  if (error) throw error;
  return data as DBChat;
}

export async function updateChatStep(id: string, step: number, status?: string) {
  const updates: Record<string, unknown> = { current_step: step, updated_at: new Date().toISOString() };
  if (status) updates.status = status;
  const { error } = await supabase.from('chats').update(updates).eq('id', id);
  if (error) throw error;
}

// ─── Messages ───

export async function getMessages(chatId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })
    .limit(200);
  if (error) throw error;
  return data as DBMessage[];
}

export async function sendMessage(msg: Omit<DBMessage, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('messages').insert(msg).select().single();
  if (error) throw error;
  // update chat updated_at - background
  if (msg.chat_id) {
    supabase.from('chats').update({ updated_at: new Date().toISOString() }).eq('id', msg.chat_id).then(() => {}, () => {});
  }
  return data as DBMessage;
}

// ─── Premium Buyers ───

export async function getPremiumBuyers(activeOnly = true) {
  let q = supabase.from('premium_buyers').select('*').order('priority', { ascending: false }).order('created_at', { ascending: false }).limit(100);
  if (activeOnly) q = q.eq('is_active', true);
  const { data, error } = await q;
  if (error) throw error;
  return data as DBPremiumBuyer[];
}

export async function createPremiumBuyer(buyer: Record<string, unknown>) {
  const { data, error } = await supabase.from('premium_buyers').insert(buyer).select().single();
  if (error) throw error;
  return data as DBPremiumBuyer;
}

export async function updatePremiumBuyer(id: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase.from('premium_buyers').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  return data as DBPremiumBuyer;
}

export async function deletePremiumBuyer(id: string) {
  const { error } = await supabase.from('premium_buyers').delete().eq('id', id);
  if (error) throw error;
}

// ─── Chats (additional) ───

export async function deleteChat(id: string) {
  // Delete messages first, then chat
  await supabase.from('messages').delete().eq('chat_id', id);
  const { error } = await supabase.from('chats').delete().eq('id', id);
  if (error) throw error;
}

export async function updateChat(id: string, updates: Partial<DBChat>) {
  const { error } = await supabase.from('chats').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

// ─── Notices ───

export async function getNotices() {
  const { data, error } = await supabase
    .from('notices')
    .select('id, title, content, is_pinned, created_at')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  return data as DBNotice[];
}

export async function getNotice(id: string) {
  const { data, error } = await supabase.from('notices').select('*').eq('id', id).single();
  if (error) throw error;
  return data as DBNotice;
}

export async function createNotice(notice: { title: string; content?: string; is_pinned?: boolean }) {
  const { data, error } = await supabase.from('notices').insert(notice).select().single();
  if (error) throw error;
  return data as DBNotice;
}

export async function updateNotice(id: string, updates: Partial<DBNotice>) {
  const { data, error } = await supabase.from('notices').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as DBNotice;
}

export async function deleteNotice(id: string) {
  const { error } = await supabase.from('notices').delete().eq('id', id);
  if (error) throw error;
}

// ─── Users (additional) ───

export async function getUsers() {
  const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false }).limit(500);
  if (error) throw error;
  return data as DBUser[];
}

export async function updateUser(id: string, updates: Partial<DBUser>) {
  const { data, error } = await supabase.from('users').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  return data as DBUser;
}

export async function deleteUser(id: string) {
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) throw error;
}
