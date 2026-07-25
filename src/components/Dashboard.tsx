'use client';

import React from 'react';
import { DashboardSummary, SubscriptionItem } from '@/types';
import { SpendOverview } from './SpendOverview';
import { SubscriptionList } from './SubscriptionList';
import { WhatIfSimulator } from './WhatIfSimulator';
import { LeakForecastChart } from './LeakForecastChart';
import { ChatAssistant } from './ChatAssistant';
import { Wallet, ShieldCheck, TrendingDown, Layers, Activity, Printer } from 'lucide-react';

interface DashboardProps {
  summary: DashboardSummary;
  subscriptions: SubscriptionItem[];
  datasetName: string;
  onToggleDormancy: (subId: string) => void;
}

export function Dashboard({
  summary,
  subscriptions,
  datasetName,
  onToggleDormancy,
}: DashboardProps) {
  const highRiskCount = subscriptions.filter((s) => s.leakScore.totalScore >= 60).length;

  return (
    <div className="w-full space-y-8">
      {/* Printable Report Header (Visible only when exporting PDF) */}
      <div className="hidden print-only border-4 border-black p-6 mb-6">
        <h1 className="text-3xl font-black uppercase text-black">SubSense Executive Subscription Leak Report</h1>
        <p className="text-xs font-mono font-bold uppercase mt-1">Generated: {new Date().toLocaleDateString()} | Feed: {datasetName}</p>
        <div className="grid grid-cols-3 gap-4 mt-4 text-xs font-mono font-bold border-t-2 border-black pt-4">
          <div>Total Monthly Spend: ₹{summary.totalMonthlySpend.toLocaleString()}</div>
          <div>Potential Annual Savings: ₹{summary.potentialAnnualSavings.toLocaleString()}</div>
          <div>Total Subscriptions: {summary.totalSubscriptions}</div>
        </div>
      </div>

      {/* Active Dataset & Export Report Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-4 border-black bg-white p-4 shadow-brutal-lg">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center border-2 border-black bg-warning shadow-brutal-sm text-black">
            <Activity className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase text-black">
              Active Feed: {datasetName}
            </h2>
            <p className="text-xs font-mono font-bold text-black uppercase">
              Parsed via Two-Tier Pipeline (Regex Tier 1 + Gemini Tier 2 Fallback).
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="hidden md:inline-block border-2 border-black bg-safe px-3 py-1.5 text-xs font-mono font-bold text-black shadow-brutal-sm uppercase">
            {subscriptions.length} Subscriptions Detected
          </span>

          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 border-2 border-black bg-critical px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-white shadow-brutal active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            <Printer className="h-4 w-4 stroke-[2.5]" />
            <span>Export PDF Report</span>
          </button>
        </div>
      </div>

      {/* Top Key Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Metric 1: Monthly Spend */}
        <div className="border-4 border-black bg-white p-5 shadow-brutal-lg">
          <div className="flex items-center justify-between text-black">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">
              Total Monthly Spend
            </span>
            <Wallet className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div className="mt-2 text-3xl font-black font-mono text-black">
            ₹{summary.totalMonthlySpend.toLocaleString()}
          </div>
          <p className="mt-1 text-xs font-mono font-bold text-black uppercase">
            ₹{summary.totalAnnualSpend.toLocaleString()}/yr Projected
          </p>
        </div>

        {/* Metric 2: Potential Annual Savings */}
        <div className="border-4 border-black bg-safe p-5 shadow-brutal-lg">
          <div className="flex items-center justify-between text-black">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">
              Potential Savings
            </span>
            <TrendingDown className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div className="mt-2 text-3xl font-black font-mono text-black">
            ₹{summary.potentialAnnualSavings.toLocaleString()}
          </div>
          <p className="mt-1 text-xs font-mono font-bold text-black uppercase">
            From High Leak & Dormant Subs
          </p>
        </div>

        {/* Metric 3: Subscriptions Count */}
        <div className="border-4 border-black bg-warning p-5 shadow-brutal-lg">
          <div className="flex items-center justify-between text-black">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">
              Active Subscriptions
            </span>
            <Layers className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div className="mt-2 text-3xl font-black font-mono text-black">
            {summary.totalSubscriptions}
          </div>
          <p className="mt-1 text-xs font-mono font-bold text-black uppercase">
            {highRiskCount} High Risk Subscriptions
          </p>
        </div>

        {/* Metric 4: Privacy Status */}
        <div className="border-4 border-black bg-white p-5 shadow-brutal-lg">
          <div className="flex items-center justify-between text-black">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">
              Security Protocol
            </span>
            <ShieldCheck className="h-5 w-5 text-black stroke-[2.5]" />
          </div>
          <div className="mt-2 text-xl font-black uppercase text-black">Stateless Session</div>
          <p className="mt-1 text-xs font-mono font-bold text-black uppercase">
            Zero DB Persistence
          </p>
        </div>
      </div>

      {/* Feature 1: Grounded Gemini AI Assistant */}
      <ChatAssistant subscriptions={subscriptions} summary={summary} />

      {/* Visual Spend Overview Charts & Feature 2: 12-Month Leak Forecast */}
      <SpendOverview summary={summary} />
      <LeakForecastChart subscriptions={subscriptions} />

      {/* What-If Simulator */}
      <WhatIfSimulator subscriptions={subscriptions} totalMonthlySpend={summary.totalMonthlySpend} />

      {/* Subscription Detailed List & Feature 3: Category Price Benchmarking */}
      <SubscriptionList subscriptions={subscriptions} onToggleDormancy={onToggleDormancy} />
    </div>
  );
}
