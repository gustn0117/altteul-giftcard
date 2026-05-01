'use client';

import { Check } from 'lucide-react';
import { tradeSteps } from '@/data/mock';

interface TradeStepBarProps {
  currentStep: number;
}

export default function TradeStepBar({ currentStep }: TradeStepBarProps) {
  return (
    <div className="flex items-center px-5 py-3 gap-0">
      {tradeSteps.map((step, idx) => {
        const isCompleted = step.step < currentStep;
        const isCurrent = step.step === currentStep;
        return (
          <div key={step.step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center relative">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium transition-all ${
                isCompleted
                  ? 'bg-zinc-900 text-white'
                  : isCurrent
                  ? 'bg-zinc-900 text-white ring-[3px] ring-zinc-200'
                  : 'bg-zinc-200 text-zinc-400'
              }`}>
                {isCompleted ? <Check size={12} strokeWidth={3} /> : step.step}
              </div>
              <span className={`text-[10px] mt-1 whitespace-nowrap ${
                isCurrent ? 'text-zinc-900 font-medium' : isCompleted ? 'text-zinc-600' : 'text-zinc-400'
              }`}>
                {step.label}
              </span>
            </div>
            {idx < tradeSteps.length - 1 && (
              <div className={`flex-1 h-[2px] mx-1.5 rounded-full ${isCompleted ? 'bg-zinc-900' : 'bg-zinc-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
