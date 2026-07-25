'use client';

import React from 'react';
import { DashboardSummary, SubscriptionItem } from '@/types';
import { SpendOverview } from './SpendOverview';
import { SubscriptionList } from './SubscriptionList';
import { WhatIfSimulator } from './WhatIfSimulator';
import { Wallet, ShieldCheck, TrendingDown, Layers, Activity } from 'lucide-react';

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
      {/* Active Dataset Banner */}
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

        <div className="flex items-center space-x-2 text-xs font-mono font-bold text-black">
          <span className="border-2 border-black bg-safe px-3 py-1 shadow-brutal-sm uppercase">
            {subscriptions.length} Subscriptions Detected
          </span>
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

      {/* Visual Spend Overview Charts */}
      <SpendOverview summary={summary} />

      {/* What-If Simulator */}
      <WhatIfSimulator subscriptions={subscriptions} totalMonthlySpend={summary.totalMonthlySpend} />

      {/* Subscription Detailed List */}
      <SubscriptionList subscriptions={subscriptions} onToggleDormancy={onToggleDormancy} />
    </div>
  );
}
