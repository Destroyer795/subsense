'use client';

import React, { useState } from 'react';
import { Activity, FileText, CheckSquare, Play, RefreshCw, Layers } from 'lucide-react';
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
    <div className="w-full border-4 border-black bg-white p-6 shadow-brutal-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-4 border-black">
        <div>
          <h2 className="text-xl font-black uppercase text-black flex items-center gap-2">
            <Activity className="h-6 w-6 text-critical stroke-[2.5]" />
            <span>Select Transaction Data Feed</span>
          </h2>
          <p className="text-xs font-bold text-black mt-1 uppercase tracking-wide">
            Select a realistic synthetic bank dataset or paste raw SMS notifications (HDFC, SBI, ICICI, Axis).
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('samples')}
            className={`flex items-center space-x-2 border-2 border-black px-4 py-2 text-xs font-mono font-bold uppercase transition-all duration-75 ${
              activeTab === 'samples'
                ? 'bg-black text-white shadow-brutal-sm'
                : 'bg-white text-black hover:bg-canvas'
            }`}
          >
            <Layers className="h-4 w-4 stroke-[2.5]" />
            <span>Sample Datasets</span>
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`flex items-center space-x-2 border-2 border-black px-4 py-2 text-xs font-mono font-bold uppercase transition-all duration-75 ${
              activeTab === 'paste'
                ? 'bg-black text-white shadow-brutal-sm'
                : 'bg-white text-black hover:bg-canvas'
            }`}
          >
            <FileText className="h-4 w-4 stroke-[2.5]" />
            <span>Paste Raw SMS</span>
          </button>
        </div>
      </div>

      {activeTab === 'samples' ? (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sample 1: Standard */}
            <div
              onClick={() => setSelectedSample('standard')}
              className={`cursor-pointer border-2 border-black p-4 transition-all duration-75 ${
                selectedSample === 'standard'
                  ? 'bg-warning shadow-brutal'
                  : 'bg-white shadow-brutal-sm hover:bg-canvas'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="border border-black bg-black px-2 py-0.5 text-[10px] font-mono font-bold uppercase text-white">
                  Primary Demo
                </span>
                {selectedSample === 'standard' && (
                  <CheckSquare className="h-5 w-5 text-black stroke-[2.5]" />
                )}
              </div>
              <h3 className="mt-3 text-base font-black uppercase text-black">Standard Bank SMS</h3>
              <p className="mt-2 text-xs font-bold text-black leading-snug">
                14 recurring subscriptions, 3 price hikes, 3 dormant apps, distractor noise across HDFC, SBI, ICICI, Axis.
              </p>
              <div className="mt-4 flex items-center text-[10px] font-mono font-bold uppercase text-black space-x-2 pt-2 border-t-2 border-black">
                <span>90 Transactions</span>
                <span>•</span>
                <span>6 Months History</span>
              </div>
            </div>

            {/* Sample 2: Tech Heavy */}
            <div
              onClick={() => setSelectedSample('saas')}
              className={`cursor-pointer border-2 border-black p-4 transition-all duration-75 ${
                selectedSample === 'saas'
                  ? 'bg-warning shadow-brutal'
                  : 'bg-white shadow-brutal-sm hover:bg-canvas'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="border border-black bg-accent px-2 py-0.5 text-[10px] font-mono font-bold uppercase text-white">
                  Developer & SaaS
                </span>
                {selectedSample === 'saas' && (
                  <CheckSquare className="h-5 w-5 text-black stroke-[2.5]" />
                )}
              </div>
              <h3 className="mt-3 text-base font-black uppercase text-black">Tech & SaaS Heavy</h3>
              <p className="mt-2 text-xs font-bold text-black leading-snug">
                GitHub Copilot, ChatGPT Plus, Notion, Adobe CC, Google Cloud, AWS recurring charges.
              </p>
              <div className="mt-4 flex items-center text-[10px] font-mono font-bold uppercase text-black space-x-2 pt-2 border-t-2 border-black">
                <span>118 Transactions</span>
                <span>•</span>
                <span>8 Months History</span>
              </div>
            </div>

            {/* Sample 3: Lifestyle */}
            <div
              onClick={() => setSelectedSample('lifestyle')}
              className={`cursor-pointer border-2 border-black p-4 transition-all duration-75 ${
                selectedSample === 'lifestyle'
                  ? 'bg-warning shadow-brutal'
                  : 'bg-white shadow-brutal-sm hover:bg-canvas'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="border border-black bg-safe px-2 py-0.5 text-[10px] font-mono font-bold uppercase text-black">
                  Media & Lifestyle
                </span>
                {selectedSample === 'lifestyle' && (
                  <CheckSquare className="h-5 w-5 text-black stroke-[2.5]" />
                )}
              </div>
              <h3 className="mt-3 text-base font-black uppercase text-black">Lifestyle & Media</h3>
              <p className="mt-2 text-xs font-bold text-black leading-snug">
                Netflix, Spotify, Cult.fit, Swiggy One, Zomato Gold, PlayStation Plus membership leaks.
              </p>
              <div className="mt-4 flex items-center text-[10px] font-mono font-bold uppercase text-black space-x-2 pt-2 border-t-2 border-black">
                <span>76 Transactions</span>
                <span>•</span>
                <span>5 Months History</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSampleAnalyze}
              disabled={isLoading}
              className="flex items-center space-x-2 border-2 border-black bg-critical px-6 py-3 text-sm font-black uppercase tracking-wider text-white shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-75 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin stroke-[2.5]" />
                  <span>Processing Detection Pipeline...</span>
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 fill-current stroke-[2.5]" />
                  <span>Run Detection Pipeline</span>
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
            placeholder={`PASTE RAW BANK SMS LINES HERE (ONE PER LINE):\nRs.649.00 debited from A/C **4921 on 12-01-2026 to VPA NETFLIX.COM Ref 123456789.\nTxn of Rs.119.00 done on SBI Debit Card **1082 on 12-01-2026 at Spotify India.`}
            className="w-full border-2 border-black bg-white p-4 text-xs font-mono font-bold text-black placeholder-slate-400 shadow-brutal-sm focus:outline-none"
          />

          <div className="flex justify-end">
            <button
              onClick={handlePastedTextAnalyze}
              disabled={isLoading || !pastedText.trim()}
              className="flex items-center space-x-2 border-2 border-black bg-critical px-6 py-3 text-sm font-black uppercase tracking-wider text-white shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-75 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin stroke-[2.5]" />
                  <span>Analyzing Raw Input...</span>
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 fill-current stroke-[2.5]" />
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
