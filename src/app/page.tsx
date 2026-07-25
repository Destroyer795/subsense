'use client';

import React, { useState, useEffect } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { Dashboard } from '@/components/Dashboard';
import { RawTransaction, SubscriptionItem, DashboardSummary } from '@/types';
import sampleStandard from '../../data/samples/sample-standard.json';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [datasetName, setDatasetName] = useState('Standard Indian Bank SMS Dataset');
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  // Auto-run analysis on mount using default standard dataset for instant judge presentation
  useEffect(() => {
    const defaultTxns: RawTransaction[] = sampleStandard.transactions.map((t) => ({
      id: t.id,
      rawText: t.rawText,
      bankHint: t.bankHint as RawTransaction['bankHint'],
    }));

    handleAnalyze(defaultTxns, 'Standard Indian Bank SMS Dataset');
  }, []);

  const handleAnalyze = async (transactions: RawTransaction[], name: string) => {
    setIsLoading(true);
    setDatasetName(name);

    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions }),
      });

      const data = await res.json();
      if (data.success) {
        setSubscriptions(data.subscriptions);
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to parse transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleDormancy = (subId: string) => {
    setSubscriptions((prev) =>
      prev.map((sub) => {
        if (sub.id !== subId) return sub;
        const newDormant = !sub.isDormant;
        // Recalculate leak score with new dormancy
        const newDormancyScore = newDormant ? 100 : 0;
        const newTotalScore = Math.min(
          100,
          Math.max(
            0,
            Math.round(
              0.4 * newDormancyScore +
                0.3 * sub.leakScore.priceDriftScore +
                0.2 * sub.leakScore.redundancyScore +
                0.1 * sub.leakScore.costShareScore
            )
          )
        );

        return {
          ...sub,
          isDormant: newDormant,
          leakScore: {
            ...sub.leakScore,
            dormancyScore: newDormancyScore,
            totalScore: newTotalScore,
          },
        };
      })
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* File / Data Source Selection Component */}
      <FileUpload onAnalyze={handleAnalyze} isLoading={isLoading} />

      {/* Dashboard View */}
      {summary && (
        <Dashboard
          summary={summary}
          subscriptions={subscriptions}
          datasetName={datasetName}
          onToggleDormancy={handleToggleDormancy}
        />
      )}
    </div>
  );
}
