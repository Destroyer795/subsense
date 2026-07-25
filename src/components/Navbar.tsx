'use client';

import React from 'react';
import { ShieldCheck, Zap, Sparkles } from 'lucide-react';

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-indigo-500 shadow-lg shadow-cyan-500/20">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-white">SubSense</span>
              <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-400 border border-cyan-500/20">
                InnovaHack
              </span>
            </div>
            <p className="text-xs text-slate-400">Hidden Subscription & Recurring Leak Detector</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden items-center space-x-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400 sm:flex">
            <ShieldCheck className="h-4 w-4" />
            <span>100% Stateless & In-Memory Privacy</span>
          </div>

          <div className="flex items-center space-x-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 border border-slate-700">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>Gemini 2.5 Engine</span>
          </div>
        </div>
      </div>
    </header>
  );
}
