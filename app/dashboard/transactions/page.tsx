'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

const mockTransactions = [
  { id: 1, date: '2026.03.25', partner: '김철수', product: '롯데 7만원권', amount: 50000, status: '진행중', type: '매입' },
  { id: 2, date: '2026.03.25', partner: '김철수', product: '롯데 7만원권', amount: 50000, status: '진행중', type: '매입' },
  { id: 3, date: '2026.03.25', partner: '김철수', product: '롯데 7만원권', amount: 50000, status: '진행중', type: '매입' },
];

export default function TransactionsPage() {
  const [filter, setFilter] = useState('전체');

  return (
    <DashboardLayout>
      <div className="card overflow-hidden animate-fade-in">
        <div className="p-5 border-b border-zinc-100">
          <h3 className="section-title mb-4">거래 내역</h3>
          <div className="flex border-b border-zinc-200">
            {['전체', '진행중', '완료', '취소', '지연'].map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`tab-underline ${filter === tab ? 'active' : ''}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <table className="w-full text-[13px]">
          <thead className="table-header">
            <tr>
              <th className="text-left py-3 px-5">날짜</th>
              <th className="text-left py-3 px-5">상대방</th>
              <th className="text-left py-3 px-5">상품</th>
              <th className="text-right py-3 px-5">금액</th>
              <th className="text-center py-3 px-5">유형</th>
              <th className="text-center py-3 px-5">상태</th>
            </tr>
          </thead>
          <tbody>
            {mockTransactions.map((tx) => (
              <tr key={tx.id} className="border-b border-zinc-100 hover:bg-zinc-50 cursor-pointer transition-colors">
                <td className="py-3 px-5 text-zinc-600">{tx.date}</td>
                <td className="py-3 px-5 text-zinc-700 font-medium">{tx.partner}</td>
                <td className="py-3 px-5 text-zinc-700">{tx.product}</td>
                <td className="py-3 px-5 text-right font-medium text-zinc-900">{tx.amount.toLocaleString()}원</td>
                <td className="py-3 px-5 text-center">
                  <span className="badge bg-zinc-100 text-zinc-500">{tx.type}</span>
                </td>
                <td className="py-3 px-5 text-center">
                  <span className={`badge ${
                    tx.status === '완료' ? 'bg-zinc-100 text-zinc-900' :
                    tx.status === '진행중' ? 'bg-blue-50 text-blue-600' :
                    tx.status === '취소' ? 'bg-red-50 text-red-600' :
                    tx.status === '지연' ? 'bg-yellow-50 text-yellow-600' :
                    'bg-zinc-100 text-zinc-500'
                  }`}>{tx.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {mockTransactions.length === 0 && (
          <div className="py-20 text-center text-zinc-400 text-[13px]">
            거래 내역이 없습니다.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
