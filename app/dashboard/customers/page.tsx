'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';

const mockCustomers = [
  { id: 1, name: '김철수', trades: 3, totalAmount: 150000, completed: 0, ongoing: 3, delayed: 0 },
  { id: 2, name: '박영희', trades: 1, totalAmount: 50000, completed: 1, ongoing: 0, delayed: 0 },
  { id: 3, name: '이지현', trades: 2, totalAmount: 100000, completed: 1, ongoing: 1, delayed: 0 },
];

export default function CustomersPage() {
  return (
    <DashboardLayout>
      <div className="card overflow-hidden animate-fade-in">
        <div className="p-5 border-b border-zinc-100">
          <h3 className="section-title mb-0">고객별 집계</h3>
        </div>

        <table className="w-full text-[13px]">
          <thead className="table-header">
            <tr>
              <th className="text-left py-3 px-5">고객명</th>
              <th className="text-center py-3 px-5">총 거래건수</th>
              <th className="text-right py-3 px-5">총 거래금액</th>
              <th className="text-center py-3 px-5">완료</th>
              <th className="text-center py-3 px-5">진행중</th>
              <th className="text-center py-3 px-5">지연</th>
            </tr>
          </thead>
          <tbody>
            {mockCustomers.map((c) => (
              <tr key={c.id} className="border-b border-zinc-100 hover:bg-zinc-50 cursor-pointer transition-colors">
                <td className="py-3 px-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-zinc-200 rounded-full flex items-center justify-center text-[11px] text-zinc-600 font-medium">
                      {c.name.charAt(0)}
                    </div>
                    <span className="font-medium text-zinc-900">{c.name}</span>
                  </div>
                </td>
                <td className="py-3 px-5 text-center text-zinc-700">{c.trades}건</td>
                <td className="py-3 px-5 text-right font-medium text-zinc-900">{c.totalAmount.toLocaleString()}원</td>
                <td className="py-3 px-5 text-center">
                  <span className="badge bg-zinc-100 text-zinc-900">{c.completed}건</span>
                </td>
                <td className="py-3 px-5 text-center">
                  <span className="badge bg-blue-50 text-blue-600">{c.ongoing}건</span>
                </td>
                <td className="py-3 px-5 text-center">
                  <span className="badge bg-red-50 text-red-600">{c.delayed}건</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
