'use client';

import { useState } from 'react';
import { X, FileText } from 'lucide-react';
import { formatNumber, parseNumber } from '@/lib/format';

interface QuoteFormProps {
  onSubmit: (data: QuoteData) => void;
  onClose: () => void;
}

export interface QuoteData {
  quantity: number;
  pricePerUnit: number;
  faceValuePerUnit: number;
  discount: number;
  deliveryDate: string;
}

export default function QuoteForm({ onSubmit, onClose }: QuoteFormProps) {
  const [form, setForm] = useState({
    quantity: '1',
    pricePerUnit: '70000',
    faceValuePerUnit: '100000',
    deliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    instantDelivery: false,
  });

  const quantity = Number(form.quantity) || 0;
  const price = Number(form.pricePerUnit) || 0;
  const faceValue = Number(form.faceValuePerUnit) || 0;
  const discount = faceValue > 0 ? Math.round((1 - price / faceValue) * 100) : 0;
  const totalFaceValue = faceValue * quantity;
  const totalPrice = price * quantity;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ quantity, pricePerUnit: price, faceValuePerUnit: faceValue, discount, deliveryDate: form.instantDelivery ? '즉시발송' : form.deliveryDate });
  };

  return (
    <div className="bg-white rounded-lg border border-zinc-200 shadow-lg overflow-hidden max-w-md w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <FileText size={15} className="text-zinc-500" />
          <h3 className="text-[14px] font-semibold">견적 제안</h3>
        </div>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors"><X size={18} /></button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-zinc-500 mb-1">수량</label>
            <input type="number" value={form.quantity} onChange={(e) => setForm(p => ({ ...p, quantity: e.target.value }))} min="1" className="input h-9 text-[13px]" required />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-zinc-500 mb-1">구매금액 (원)</label>
            <input type="text" inputMode="numeric" value={formatNumber(form.pricePerUnit)} onChange={(e) => setForm(p => ({ ...p, pricePerUnit: parseNumber(e.target.value) }))} className="input h-9 text-[13px]" required />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-zinc-500 mb-1">상품권 금액 (원)</label>
            <input type="text" inputMode="numeric" value={formatNumber(form.faceValuePerUnit)} onChange={(e) => setForm(p => ({ ...p, faceValuePerUnit: parseNumber(e.target.value) }))} className="input h-9 text-[13px]" required />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-zinc-500 mb-1">발송일</label>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-[12px] text-zinc-600 cursor-pointer">
              <input type="checkbox" checked={form.instantDelivery} onChange={(e) => setForm(p => ({ ...p, instantDelivery: e.target.checked }))} className="w-3.5 h-3.5 rounded" />
              즉시발송
            </label>
            {!form.instantDelivery && (
              <input type="date" value={form.deliveryDate} onChange={(e) => setForm(p => ({ ...p, deliveryDate: e.target.value }))} className="input h-9 text-[13px] flex-1" />
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-zinc-50 border border-zinc-100 rounded-md p-3 text-[12px] space-y-1.5">
          <div className="flex justify-between"><span className="text-zinc-500">수량</span><span className="font-medium">{quantity}건</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">구매 총액</span><span className="font-medium">{totalPrice.toLocaleString()}원</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">상품권 총액</span><span className="font-medium">{totalFaceValue.toLocaleString()}원</span></div>
          <div className="flex justify-between border-t border-zinc-200 pt-1.5 mt-1.5">
            <span className="text-zinc-500">할인율</span>
            <span className="font-semibold text-red-500">{discount}%</span>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 h-9 text-[12px]">취소</button>
          <button type="submit" className="btn-primary flex-1 h-9 text-[12px]">견적 제안</button>
        </div>
      </form>
    </div>
  );
}
