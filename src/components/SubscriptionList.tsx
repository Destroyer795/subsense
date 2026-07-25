'use client';

import React, { useState } from 'react';
import {
  SubscriptionItem,
  GeminiRecommendation,
  EmailDraft,
} from '@/types';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Mail,
  RefreshCw,
  Info,
  Calendar,
  Layers,
  ArrowUpRight,
  UserX,
  UserCheck,
} from 'lucide-react';
import { EmailModal } from './EmailModal';

interface SubscriptionListProps {
  subscriptions: SubscriptionItem[];
  onToggleDormancy: (subId: string) => void;
}

export function SubscriptionList({ subscriptions, onToggleDormancy }: SubscriptionListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingAiId, setLoadingAiId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Record<string, GeminiRecommendation>>({});
  const [emailModalState, setEmailModalState] = useState<{
    isOpen: boolean;
    draft: EmailDraft | null;
    merchantName: string;
  }>({ isOpen: false, draft: null, merchantName: '' });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleGenerateEmail = async (sub: SubscriptionItem, actionType: 'cancel' | 'downgrade' = 'cancel') => {
    setLoadingAiId(sub.id);
    try {
      const res = await fetch('/api/email-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub, actionType }),
      });
      const data = await res.json();
      if (data.emailDraft) {
        setEmailModalState({
          isOpen: true,
          draft: data.emailDraft,
          merchantName: sub.merchantName,
        });
      }
    } catch (err) {
      console.error('Error generating email draft:', err);
    } finally {
      setLoadingAiId(null);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="h-5 w-5 text-cyan-400" />
            <span>Detected Recurring Subscriptions ({subscriptions.length})</span>
          </h3>
          <p className="text-xs text-slate-400">
            Sorted by Composite Leak Score. Expand any subscription to view formula breakdown and AI action draft.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {subscriptions.map((sub) => {
          const isExpanded = expandedId === sub.id;
          const score = sub.leakScore.totalScore;

          // Color coded score badge
          let scoreBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
          if (score >= 60) scoreBg = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
          else if (score >= 35) scoreBg = 'bg-amber-500/10 text-amber-400 border-amber-500/20';

          const extractionMethod = sub.transactions[0]?.extractionMethod || 'regex';
          const confidence = sub.transactions[0]?.confidenceScore || 0.9;

          return (
            <div
              key={sub.id}
              className={`rounded-2xl border transition-all duration-200 ${
                isExpanded
                  ? 'border-cyan-500/50 bg-slate-900 shadow-xl'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              {/* Summary Row Header */}
              <div
                onClick={() => toggleExpand(sub.id)}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 cursor-pointer gap-4"
              >
                <div className="flex items-center space-x-4">
                  {/* Leak Score Badge */}
                  <div className={`flex flex-col items-center justify-center rounded-xl border px-3 py-2 ${scoreBg}`}>
                    <span className="text-xs uppercase font-semibold text-slate-400">Leak Score</span>
                    <span className="text-xl font-extrabold font-mono">{score}</span>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-base font-bold text-white">{sub.merchantName}</h4>

                      {/* Badges */}
                      {sub.priceDrift.isHikeDetected && (
                        <span className="flex items-center space-x-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/20">
                          <AlertTriangle className="h-3 w-3" />
                          <span>+{sub.priceDrift.percentageChange}% Hike</span>
                        </span>
                      )}

                      {sub.isDormant && (
                        <span className="flex items-center space-x-1 rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-400 border border-purple-500/20">
                          <UserX className="h-3 w-3" />
                          <span>Dormant</span>
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex items-center space-x-3 text-xs text-slate-400">
                      <span className="text-slate-300 font-medium">{sub.category}</span>
                      <span>•</span>
                      <span className="capitalize">{sub.billingInterval} billing</span>
                      <span>•</span>
                      <span className="font-mono text-slate-400">{sub.transactionCount} charges detected</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-6">
                  <div className="text-right">
                    <div className="text-base font-extrabold font-mono text-white">
                      ₹{sub.currentAmount.toLocaleString()}
                      <span className="text-xs font-normal text-slate-400">/mo</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      ₹{(sub.currentAmount * 12).toLocaleString()}/yr
                    </div>
                  </div>

                  {/* Dormancy Toggle Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleDormancy(sub.id);
                    }}
                    title="Toggle active vs dormant status"
                    className={`flex items-center space-x-1 rounded-lg px-2.5 py-1.5 text-xs font-medium border transition-all ${
                      sub.isDormant
                        ? 'border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20'
                        : 'border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {sub.isDormant ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                    <span className="hidden md:inline">{sub.isDormant ? 'Mark Active' : 'Mark Dormant'}</span>
                  </button>

                  <div className="text-slate-400">
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-cyan-400" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </div>
              </div>

              {/* Expandable Details Drawer */}
              {isExpanded && (
                <div className="border-t border-slate-800/80 bg-slate-950/60 p-6 space-y-6">
                  {/* Formula Breakdown & Extraction Evidence */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Sub-score breakdown */}
                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                          <Info className="h-4 w-4 text-cyan-400" />
                          <span>Leak Score Breakdown (Formula)</span>
                        </h5>
                        <span className="text-xs font-mono font-bold text-cyan-400">{score}/100</span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Dormancy Score (40% weight):</span>
                          <span className="font-mono text-purple-400 font-bold">{sub.leakScore.dormancyScore}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Price Drift Score (30% weight):</span>
                          <span className="font-mono text-rose-400 font-bold">{sub.leakScore.priceDriftScore}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Category Redundancy (20% weight):</span>
                          <span className="font-mono text-amber-400 font-bold">{sub.leakScore.redundancyScore}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Spend Share Score (10% weight):</span>
                          <span className="font-mono text-sky-400 font-bold">{sub.leakScore.costShareScore}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800 space-y-1">
                        {sub.leakScore.explanation.map((exp, idx) => (
                          <div key={idx} className="flex items-center space-x-1.5 text-[11px] text-slate-400">
                            <span className="text-cyan-400">•</span>
                            <span>{exp}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Extraction Evidence */}
                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          Extraction Evidence & History
                        </h5>
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300 border border-slate-700">
                          Method: <strong className="text-cyan-400 uppercase">{extractionMethod}</strong> (
                          {Math.round(confidence * 100)}% conf)
                        </span>
                      </div>

                      <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                        {sub.transactions.map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between rounded bg-slate-950 px-2.5 py-1.5 text-xs border border-slate-800/50"
                          >
                            <span className="font-mono text-slate-400">{t.date}</span>
                            <span className="truncate max-w-[150px] text-slate-300">{t.merchant}</span>
                            <span className="font-mono font-semibold text-white">₹{t.amount}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Gemini AI Action Box */}
                  <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Sparkles className="h-4 w-4 text-cyan-400" />
                        <h5 className="text-sm font-bold text-white">
                          Gemini Recommended Action
                        </h5>
                      </div>
                      <p className="text-xs text-cyan-200/80 mt-1">
                        {sub.isDormant
                          ? `Flagged as dormant. Cancel to immediately save ₹${(sub.currentAmount * 12).toLocaleString()}/yr.`
                          : sub.priceDrift.isHikeDetected
                          ? `Price increased by +${sub.priceDrift.percentageChange}%. Consider requesting a tier downgrade.`
                          : `Active subscription billing ₹${sub.currentAmount}/mo cleanly.`}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleGenerateEmail(sub, sub.priceDrift.isHikeDetected ? 'downgrade' : 'cancel')}
                        disabled={loadingAiId === sub.id}
                        className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 transition-all disabled:opacity-50"
                      >
                        {loadingAiId === sub.id ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            <span>Drafting Email via Gemini...</span>
                          </>
                        ) : (
                          <>
                            <Mail className="h-3.5 w-3.5" />
                            <span>
                              Generate {sub.priceDrift.isHikeDetected ? 'Downgrade' : 'Cancellation'} Email Draft
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Email Draft Modal */}
      <EmailModal
        isOpen={emailModalState.isOpen}
        draft={emailModalState.draft}
        merchantName={emailModalState.merchantName}
        onClose={() => setEmailModalState({ isOpen: false, draft: null, merchantName: '' })}
      />
    </div>
  );
}
