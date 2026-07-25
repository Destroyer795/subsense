'use client';

import React from 'react';
import { ShieldCheck, Code, Award } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-800 bg-slate-950 py-8 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-cyan-400" />
            <span className="text-sm font-medium text-slate-300">
              SubSense — InnovaHack Chapter-1 Submission (FinTech Track)
            </span>
          </div>

          <div className="flex items-center space-x-6 text-xs">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Zero Database Persistence</span>
            </span>
            <span className="flex items-center space-x-1">
              <Code className="h-4 w-4 text-cyan-400" />
              <span>Powered by Gemini API</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
