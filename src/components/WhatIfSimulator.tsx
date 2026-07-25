'use client';

import React, { useState } from 'react';
import { SubscriptionItem } from '@/types';
import { Calculator, CheckSquare, Square, TrendingDown, Sliders } from 'lucide-react';

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
    <div className="border-4 border-black bg-white p-6 shadow-brutal-lg space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-black pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Calculator className="h-6 w-6 text-black stroke-[2.5]" />
            <h3 className="text-xl font-black uppercase text-black">What-If Savings Simulator</h3>
          </div>
          <p className="text-xs font-bold uppercase text-black mt-1 tracking-wide">
            Multi-select subscriptions to simulate cancellation and project instant monthly/annual savings.
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
            className="border-2 border-black bg-warning px-3 py-1.5 text-xs font-mono font-bold uppercase text-black shadow-brutal-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            Select High-Leak
          </button>
          <button
            onClick={() => setSelectedToCancel([])}
            className="border-2 border-black bg-white px-3 py-1.5 text-xs font-mono font-bold uppercase text-black shadow-brutal-sm hover:bg-canvas active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Dynamic Savings Impact Metric Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border-2 border-black bg-safe p-4 shadow-brutal">
          <span className="text-xs font-mono font-bold uppercase text-black">
            Projected Monthly Savings
          </span>
          <div className="mt-1 text-3xl font-black font-mono text-black">
            ₹{monthlySavings.toLocaleString()}
          </div>
          <p className="text-xs font-mono font-bold text-black mt-1 flex items-center gap-1 uppercase">
            <TrendingDown className="h-4 w-4 stroke-[2.5]" />
            <span>{reductionPercentage}% Spend Reduction</span>
          </p>
        </div>

        <div className="border-2 border-black bg-warning p-4 shadow-brutal">
          <span className="text-xs font-mono font-bold uppercase text-black">
            Projected Annual Savings
          </span>
          <div className="mt-1 text-3xl font-black font-mono text-black">
            ₹{annualSavings.toLocaleString()}
          </div>
          <p className="text-xs font-mono font-bold text-black mt-1 uppercase">
            Recaptured Cash Balance
          </p>
        </div>

        <div className="border-2 border-black bg-canvas p-4 shadow-brutal">
          <span className="text-xs font-mono font-bold uppercase text-black">
            New Monthly Spend Target
          </span>
          <div className="mt-1 text-3xl font-black font-mono text-black">
            ₹{newMonthlySpend.toLocaleString()}
          </div>
          <p className="text-xs font-mono font-bold text-black mt-1 uppercase">
            {selectedToCancel.length} Subscriptions Marked
          </p>
        </div>
      </div>

      {/* Progress Bar visual */}
      <div>
        <div className="flex justify-between text-xs font-mono font-bold text-black mb-1.5 uppercase">
          <span>Spend Cut Progress</span>
          <span className="border border-black bg-safe px-2 py-0.5 shadow-brutal-sm">
            {reductionPercentage}% Cut
          </span>
        </div>
        <div className="h-4 w-full border-2 border-black bg-white p-0.5 shadow-brutal-sm">
          <div
            className="h-full bg-critical border-r-2 border-black transition-all duration-150"
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
              className={`cursor-pointer border-2 border-black p-3 flex items-center justify-between transition-all duration-75 ${
                isSelected
                  ? 'bg-warning shadow-brutal'
                  : 'bg-white shadow-brutal-sm hover:bg-canvas'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="text-black">
                  {isSelected ? (
                    <CheckSquare className="h-5 w-5 stroke-[2.5]" />
                  ) : (
                    <Square className="h-5 w-5 stroke-[2.5]" />
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-black uppercase text-black">{sub.merchantName}</h4>
                  <p className="text-[10px] font-mono font-bold text-black uppercase">{sub.category}</p>
                </div>
              </div>

              <div className="text-right font-mono text-xs font-black text-black">
                ₹{sub.currentAmount}
                <span className="text-[9px] font-normal text-black">/mo</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
