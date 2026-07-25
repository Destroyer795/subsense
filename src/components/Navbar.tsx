'use client';

import React from 'react';
import { ShieldAlert, ShieldCheck, Activity } from 'lucide-react';

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b-4 border-black bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center border-2 border-black bg-critical text-white shadow-brutal-sm">
            <ShieldAlert className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-black uppercase tracking-tight text-black">
                SubSense
              </span>
              <span className="border-2 border-black bg-warning px-2 py-0.5 text-xs font-mono font-bold shadow-brutal-sm text-black uppercase">
                InnovaHack
              </span>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-black">
              Recurring Payment Leak Detector
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden items-center space-x-2 border-2 border-black bg-safe px-3 py-1.5 text-xs font-mono font-bold text-black shadow-brutal-sm sm:flex uppercase">
            <ShieldCheck className="h-4 w-4 stroke-[2.5]" />
            <span>100% Stateless Privacy</span>
          </div>

          <div className="flex items-center space-x-1.5 border-2 border-black bg-white px-3 py-1.5 text-xs font-mono font-bold text-black shadow-brutal-sm uppercase">
            <Activity className="h-4 w-4 stroke-[2.5] text-critical" />
            <span>Gemini Engine</span>
          </div>
        </div>
      </div>
    </header>
  );
}
