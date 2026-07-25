'use client';

import React, { useState } from 'react';
import { SubscriptionItem } from '@/types';
import { Calculator, CheckCircle2, TrendingDown, DollarSign, Sparkles } from 'lucide-react';

interface WhatIfSimulatorProps {
  subscriptions: SubscriptionItem[];
  totalMonthlySpend: number;
}

export function WhatIfSimulator({ subscriptions, totalMonthlySpend }: WhatIfSimulatorProps) {
  const [selectedToCancel, setSelectedToCancel] = useState<string[]>(() =>
    subscriptions
      .filter((s) => s.leakScore.totalScore >= 60 || s.isDormant)
      .map((s) => s.id)
  );

  const toggleSelect = (id: string) => {
    setSelectedToCancel((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const monthlySavings = subscriptions
    .filter((s) => selectedToCancel.includes(s.id))
    .reduce((sum, s) => sum + s.currentAmount, 0);

  const annualSavings = monthlySavings * 12;
  const newMonthlySpend = Math.max(0, totalMonthlySpend - monthlySavings);
  const reductionPercentage =
    totalMonthlySpend > 0 ? Math.round((monthlySavings / totalMonthlySpend) * 100) : 0;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 backdrop-blur-xl shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Calculator className="h-5 w-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">What-If Savings Simulator</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Select subscriptions to simulate cancellation and see instant projected monthly/annual savings.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() =>
              setSelectedToCancel(
                subscriptions
                  .filter((s) => s.leakScore.totalScore >= 50 || s.isDormant)
                  .map((s) => s.id)
              )
            }
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-all border border-slate-700"
          >
            Select High-Leak Subs
          </button>
          <button
            onClick={() => setSelectedToCancel([])}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:bg-slate-700 transition-all border border-slate-700"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Dynamic Savings Impact Metric Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Projected Monthly Savings
          </span>
          <div className="mt-1 text-2xl font-extrabold font-mono text-emerald-300">
            ₹{monthlySavings.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1">
            <TrendingDown className="h-3.5 w-3.5" />
            <span>{reductionPercentage}% total spend reduction</span>
          </p>
        </div>

        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            Projected Annual Savings
          </span>
          <div className="mt-1 text-2xl font-extrabold font-mono text-cyan-300">
            ₹{annualSavings.toLocaleString()}
          </div>
          <p className="text-[11px] text-cyan-400/80 mt-1">Directly added back to cash balance</p>
        </div>

        <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
            New Monthly Spend Target
          </span>
          <div className="mt-1 text-2xl font-extrabold font-mono text-purple-300">
            ₹{newMonthlySpend.toLocaleString()}
          </div>
          <p className="text-[11px] text-purple-400/80 mt-1">
            {selectedToCancel.length} subscription(s) marked for cancellation
          </p>
        </div>
      </div>

      {/* Progress Bar visual */}
      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
          <span>Spend Reduction Progress</span>
          <span className="text-emerald-400 font-bold">{reductionPercentage}% Cut</span>
        </div>
        <div className="h-3 w-full rounded-full bg-slate-950 overflow-hidden p-0.5 border border-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500 transition-all duration-300"
            style={{ width: `${Math.min(100, reductionPercentage)}%` }}
          />
        </div>
      </div>

      {/* Multi-select Subscription Checkbox Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {subscriptions.map((sub) => {
          const isSelected = selectedToCancel.includes(sub.id);
          return (
            <div
              key={sub.id}
              onClick={() => toggleSelect(sub.id)}
              className={`cursor-pointer rounded-xl border p-3 flex items-center justify-between transition-all ${
                isSelected
                  ? 'border-emerald-500/60 bg-emerald-500/10 shadow-lg shadow-emerald-500/5'
                  : 'border-slate-800 bg-slate-950 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded border transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500 text-slate-950'
                      : 'border-slate-700 bg-slate-900'
                  }`}
                >
                  {isSelected && <CheckCircle2 className="h-4 w-4" />}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white">{sub.merchantName}</h4>
                  <p className="text-[10px] text-slate-400">{sub.category}</p>
                </div>
              </div>

              <div className="text-right font-mono text-xs font-bold text-white">
                ₹{sub.currentAmount}
                <span className="text-[9px] font-normal text-slate-500">/mo</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
