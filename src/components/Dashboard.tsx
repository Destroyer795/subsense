'use client';

import React from 'react';
import { DashboardSummary, SubscriptionItem } from '@/types';
import { SpendOverview } from './SpendOverview';
import { SubscriptionList } from './SubscriptionList';
import { WhatIfSimulator } from './WhatIfSimulator';
import { Wallet, AlertTriangle, ShieldCheck, TrendingDown, Layers, Sparkles } from 'lucide-react';

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
    <div className="w-full space-y-8 animate-fadeIn">
      {/* Active Dataset Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4 backdrop-blur-xl">
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Active Data Source: {datasetName}</h2>
            <p className="text-xs text-cyan-300/80">
              Parsed cleanly with Two-Tier Pipeline (Regex + Gemini Structured Fallback).
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400">
          <span className="rounded-md bg-cyan-500/10 px-2.5 py-1 border border-cyan-500/20">
            {subscriptions.length} Subscriptions Detected
          </span>
        </div>
      </div>

      {/* Top Key Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Metric 1: Monthly Spend */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Monthly Spend</span>
            <Wallet className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold font-mono text-white">
            ₹{summary.totalMonthlySpend.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 font-mono">
            ₹{summary.totalAnnualSpend.toLocaleString()}/year projected
          </p>
        </div>

        {/* Metric 2: Potential Annual Savings */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-bold uppercase tracking-wider">Potential Savings</span>
            <TrendingDown className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-extrabold font-mono text-emerald-300">
            ₹{summary.potentialAnnualSavings.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-emerald-400/80">
            From canceling high leak & dormant subs
          </p>
        </div>

        {/* Metric 3: Subscriptions Count */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Subscriptions</span>
            <Layers className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold font-mono text-white">
            {summary.totalSubscriptions}
          </div>
          <p className="mt-1 text-[11px] text-purple-400">
            {highRiskCount} subscriptions with high leak score
          </p>
        </div>

        {/* Metric 4: Privacy Status */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Privacy & Security</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-lg font-bold text-slate-200">Stateless Session</div>
          <p className="mt-1 text-[11px] text-slate-500">
            Zero persistence of bank data
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
