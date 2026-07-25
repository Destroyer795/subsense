'use client';

import React, { useState } from 'react';
import { Upload, FileText, Sparkles, CheckCircle2, Play, RefreshCw } from 'lucide-react';
import sampleStandard from '../../data/samples/sample-standard.json';
import sampleSaas from '../../data/samples/sample-tech-heavy-saas.json';
import sampleLifestyle from '../../data/samples/sample-lifestyle-ott.json';
import { RawTransaction } from '@/types';

interface FileUploadProps {
  onAnalyze: (transactions: RawTransaction[], datasetName: string) => void;
  isLoading: boolean;
}

export function FileUpload({ onAnalyze, isLoading }: FileUploadProps) {
  const [selectedSample, setSelectedSample] = useState<'standard' | 'saas' | 'lifestyle'>('standard');
  const [pastedText, setPastedText] = useState('');
  const [activeTab, setActiveTab] = useState<'samples' | 'paste'>('samples');

  const handleSampleAnalyze = () => {
    let data = sampleStandard;
    let name = 'Standard Indian Bank SMS Dataset';
    if (selectedSample === 'saas') {
      data = sampleSaas;
      name = 'Tech & SaaS Heavy Dataset';
    } else if (selectedSample === 'lifestyle') {
      data = sampleLifestyle;
      name = 'Lifestyle & Entertainment Dataset';
    }

    const txns: RawTransaction[] = data.transactions.map((t) => ({
      id: t.id,
      rawText: t.rawText,
      bankHint: t.bankHint as RawTransaction['bankHint'],
    }));

    onAnalyze(txns, name);
  };

  const handlePastedTextAnalyze = () => {
    if (!pastedText.trim()) return;

    const lines = pastedText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 5);

    const txns: RawTransaction[] = lines.map((line, idx) => ({
      id: `CUSTOM_${idx + 1}`,
      rawText: line,
    }));

    onAnalyze(txns, 'Pasted SMS / Statement Data');
  };

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-cyan-400" />
            <span>Select Financial Transaction Source</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Choose a realistic synthetic bank dataset or paste raw HDFC/SBI/ICICI/Axis SMS notifications.
          </p>
        </div>

        <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800">
          <button
            onClick={() => setActiveTab('samples')}
            className={`flex items-center space-x-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'samples'
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Sample Datasets</span>
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`flex items-center space-x-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'paste'
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Paste Raw SMS</span>
          </button>
        </div>
      </div>

      {activeTab === 'samples' ? (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sample 1: Standard */}
            <div
              onClick={() => setSelectedSample('standard')}
              className={`cursor-pointer rounded-xl border p-4 transition-all ${
                selectedSample === 'standard'
                  ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500'
                  : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Recommended Demo
                </span>
                {selectedSample === 'standard' && (
                  <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                )}
              </div>
              <h3 className="mt-2 text-sm font-semibold text-white">Standard Indian Bank SMS</h3>
              <p className="mt-1 text-xs text-slate-400">
                14 recurring subscriptions, 3 price hikes, 3 dormant apps, distractor noise across HDFC, SBI, ICICI, Axis.
              </p>
              <div className="mt-3 flex items-center text-[10px] text-slate-500 space-x-2">
                <span>90 transactions</span>
                <span>•</span>
                <span>6 months history</span>
              </div>
            </div>

            {/* Sample 2: Tech Heavy */}
            <div
              onClick={() => setSelectedSample('saas')}
              className={`cursor-pointer rounded-xl border p-4 transition-all ${
                selectedSample === 'saas'
                  ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500'
                  : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                  SaaS & Dev Tools
                </span>
                {selectedSample === 'saas' && <CheckCircle2 className="h-4 w-4 text-cyan-400" />}
              </div>
              <h3 className="mt-2 text-sm font-semibold text-white">Tech & SaaS Heavy</h3>
              <p className="mt-1 text-xs text-slate-400">
                GitHub Copilot, ChatGPT Plus, Notion, Adobe CC, Google Cloud, AWS recurring payments.
              </p>
              <div className="mt-3 flex items-center text-[10px] text-slate-500 space-x-2">
                <span>118 transactions</span>
                <span>•</span>
                <span>8 months history</span>
              </div>
            </div>

            {/* Sample 3: Lifestyle */}
            <div
              onClick={() => setSelectedSample('lifestyle')}
              className={`cursor-pointer rounded-xl border p-4 transition-all ${
                selectedSample === 'lifestyle'
                  ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500'
                  : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Media & Lifestyle
                </span>
                {selectedSample === 'lifestyle' && (
                  <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                )}
              </div>
              <h3 className="mt-2 text-sm font-semibold text-white">Lifestyle & Entertainment</h3>
              <p className="mt-1 text-xs text-slate-400">
                Netflix, Spotify, Cult.fit, Swiggy One, Zomato Gold, PlayStation Plus membership leaks.
              </p>
              <div className="mt-3 flex items-center text-[10px] text-slate-500 space-x-2">
                <span>76 transactions</span>
                <span>•</span>
                <span>5 months history</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSampleAnalyze}
              disabled={isLoading}
              className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-50 transition-all"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Parsing & Scoring Pipeline Running...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>Run SubSense Detection Engine</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            rows={5}
            placeholder={`Paste raw bank SMS lines here (one per line). Example:\nRs.649.00 debited from A/C **4921 on 12-01-2026 to VPA NETFLIX.COM Ref 12345.\nTxn of Rs.119.00 done on SBI Debit Card **1082 on 12-01-2026 at Spotify India.`}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs font-mono text-slate-200 placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
          />

          <div className="flex justify-end">
            <button
              onClick={handlePastedTextAnalyze}
              disabled={isLoading || !pastedText.trim()}
              className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-50 transition-all"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Analyzing Raw Text...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>Analyze Custom Input</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
