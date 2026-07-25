'use client';

import React, { useState } from 'react';
import {
  SubscriptionItem,
  GeminiRecommendation,
  EmailDraft,
} from '@/types';
import {
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Mail,
  RefreshCw,
  Info,
  Layers,
  UserX,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { EmailModal } from './EmailModal';

interface SubscriptionListProps {
  subscriptions: SubscriptionItem[];
  onToggleDormancy: (subId: string) => void;
}

export function SubscriptionList({ subscriptions, onToggleDormancy }: SubscriptionListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingAiId, setLoadingAiId] = useState<string | null>(null);
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
      <div className="flex items-center justify-between border-b-4 border-black pb-4">
        <div>
          <h3 className="text-xl font-black uppercase text-black flex items-center gap-2">
            <Layers className="h-6 w-6 text-black stroke-[2.5]" />
            <span>Detected Subscriptions ({subscriptions.length})</span>
          </h3>
          <p className="text-xs font-bold uppercase tracking-wide text-black mt-1">
            Sorted by Composite Leak Score. Click any subscription to expand formula breakdown and generate action draft.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {subscriptions.map((sub) => {
          const isExpanded = expandedId === sub.id;
          const score = sub.leakScore.totalScore;

          // Color coded score badge in Neobrutal style
          let scoreBg = 'bg-safe text-black';
          if (score >= 60) scoreBg = 'bg-critical text-white';
          else if (score >= 35) scoreBg = 'bg-warning text-black';

          const extractionMethod = sub.transactions[0]?.extractionMethod || 'regex';
          const confidence = sub.transactions[0]?.confidenceScore || 0.9;

          return (
            <div
              key={sub.id}
              className={`border-4 border-black bg-white transition-all duration-75 ${
                isExpanded ? 'shadow-brutal-lg' : 'shadow-brutal hover:bg-canvas'
              }`}
            >
              {/* Summary Row Header */}
              <div
                onClick={() => toggleExpand(sub.id)}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 cursor-pointer gap-4"
              >
                <div className="flex items-center space-x-4">
                  {/* Leak Score Badge */}
                  <div className={`flex flex-col items-center justify-center border-2 border-black px-3 py-1.5 shadow-brutal-sm ${scoreBg}`}>
                    <span className="text-[9px] uppercase font-mono font-bold tracking-wider">
                      Leak Score
                    </span>
                    <span className="text-2xl font-black font-mono">{score}</span>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-lg font-black uppercase text-black">{sub.merchantName}</h4>

                      {/* Badges */}
                      {sub.priceDrift.isHikeDetected && (
                        <span className="flex items-center space-x-1 border border-black bg-critical px-2 py-0.5 text-[10px] font-mono font-bold text-white shadow-brutal-sm uppercase">
                          <AlertCircle className="h-3 w-3 stroke-[2.5]" />
                          <span>+{sub.priceDrift.percentageChange}% Hike</span>
                        </span>
                      )}

                      {sub.isDormant && (
                        <span className="flex items-center space-x-1 border border-black bg-warning px-2 py-0.5 text-[10px] font-mono font-bold text-black shadow-brutal-sm uppercase">
                          <UserX className="h-3 w-3 stroke-[2.5]" />
                          <span>Dormant</span>
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex items-center space-x-3 text-xs font-mono font-bold text-black uppercase">
                      <span>{sub.category}</span>
                      <span>•</span>
                      <span>{sub.billingInterval} billing</span>
                      <span>•</span>
                      <span>{sub.transactionCount} Charges</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-6">
                  <div className="text-right font-mono">
                    <div className="text-lg font-black text-black">
                      ₹{sub.currentAmount.toLocaleString()}
                      <span className="text-xs font-normal text-black">/mo</span>
                    </div>
                    <div className="text-[10px] font-bold text-black uppercase">
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
                    className="flex items-center space-x-1 border-2 border-black bg-white px-3 py-1.5 text-xs font-mono font-bold text-black shadow-brutal-sm hover:bg-warning active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all uppercase"
                  >
                    {sub.isDormant ? <UserX className="h-3.5 w-3.5 stroke-[2.5]" /> : <UserCheck className="h-3.5 w-3.5 stroke-[2.5]" />}
                    <span className="hidden md:inline">{sub.isDormant ? 'Mark Active' : 'Mark Dormant'}</span>
                  </button>

                  <div className="border border-black bg-white p-1 shadow-brutal-sm text-black">
                    {isExpanded ? <ChevronUp className="h-5 w-5 stroke-[2.5]" /> : <ChevronDown className="h-5 w-5 stroke-[2.5]" />}
                  </div>
                </div>
              </div>

              {/* Expandable Details Drawer */}
              {isExpanded && (
                <div className="border-t-4 border-black bg-canvas p-6 space-y-6">
                  {/* Formula Breakdown & Extraction Evidence */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Sub-score breakdown */}
                    <div className="border-2 border-black bg-white p-4 space-y-3 shadow-brutal">
                      <div className="flex items-center justify-between border-b-2 border-black pb-2">
                        <h5 className="text-xs font-mono font-bold uppercase text-black flex items-center gap-1.5">
                          <Info className="h-4 w-4 stroke-[2.5]" />
                          <span>Leak Score Formula Breakdown</span>
                        </h5>
                        <span className="border border-black bg-black px-2 py-0.5 text-xs font-mono font-black text-white">
                          {score}/100
                        </span>
                      </div>

                      <div className="space-y-2 text-xs font-mono font-bold text-black">
                        <div className="flex justify-between items-center">
                          <span>Dormancy Score (40% weight):</span>
                          <span className="border border-black bg-warning px-1.5 py-0.5">{sub.leakScore.dormancyScore}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Price Drift Score (30% weight):</span>
                          <span className="border border-black bg-critical text-white px-1.5 py-0.5">{sub.leakScore.priceDriftScore}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Category Redundancy (20% weight):</span>
                          <span className="border border-black bg-warning px-1.5 py-0.5">{sub.leakScore.redundancyScore}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Spend Share Score (10% weight):</span>
                          <span className="border border-black bg-safe px-1.5 py-0.5">{sub.leakScore.costShareScore}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t-2 border-black space-y-1">
                        {sub.leakScore.explanation.map((exp, idx) => (
                          <div key={idx} className="flex items-center space-x-1.5 text-[11px] font-mono font-bold text-black">
                            <span>•</span>
                            <span>{exp}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Extraction Evidence */}
                    <div className="border-2 border-black bg-white p-4 space-y-3 shadow-brutal">
                      <div className="flex items-center justify-between border-b-2 border-black pb-2">
                        <h5 className="text-xs font-mono font-bold uppercase text-black">
                          Extraction Evidence & Logs
                        </h5>
                        <span className="border border-black bg-warning px-2 py-0.5 text-[10px] font-mono font-bold text-black uppercase">
                          Method: {extractionMethod} ({Math.round(confidence * 100)}% conf)
                        </span>
                      </div>

                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {sub.transactions.map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between border border-black bg-canvas px-2.5 py-1 text-xs font-mono font-bold text-black"
                          >
                            <span>{t.date}</span>
                            <span className="truncate max-w-[150px] uppercase">{t.merchant}</span>
                            <span>₹{t.amount}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Gemini AI Action Box */}
                  <div className="border-2 border-black bg-warning p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-brutal">
                    <div>
                      <div className="flex items-center space-x-2">
                        <ShieldAlert className="h-5 w-5 text-black stroke-[2.5]" />
                        <h5 className="text-sm font-black uppercase text-black">
                          Gemini Recommended Action
                        </h5>
                      </div>
                      <p className="text-xs font-bold text-black mt-1 uppercase">
                        {sub.isDormant
                          ? `Flagged as dormant. Cancel to immediately save ₹${(sub.currentAmount * 12).toLocaleString()}/yr.`
                          : sub.priceDrift.isHikeDetected
                          ? `Price increased by +${sub.priceDrift.percentageChange}%. Consider requesting a plan downgrade.`
                          : `Active subscription billing ₹${sub.currentAmount}/mo cleanly.`}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleGenerateEmail(sub, sub.priceDrift.isHikeDetected ? 'downgrade' : 'cancel')}
                        disabled={loadingAiId === sub.id}
                        className="flex items-center space-x-2 border-2 border-black bg-critical px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-white shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-75 disabled:opacity-50"
                      >
                        {loadingAiId === sub.id ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin stroke-[2.5]" />
                            <span>Drafting Email via Gemini...</span>
                          </>
                        ) : (
                          <>
                            <Mail className="h-4 w-4 stroke-[2.5]" />
                            <span>
                              Draft {sub.priceDrift.isHikeDetected ? 'Downgrade' : 'Cancellation'} Email
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
