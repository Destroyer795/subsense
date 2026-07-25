'use client';

import React from 'react';
import { ShieldCheck, Code, Award } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-16 border-t-4 border-black bg-white py-8 text-black">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center space-x-2">
            <Award className="h-5 w-5 stroke-[2.5]" />
            <span className="text-sm font-bold uppercase tracking-wide">
              SubSense — InnovaHack Chapter-1 Submission (FinTech Track)
            </span>
          </div>

          <div className="flex items-center space-x-6 text-xs font-mono font-bold uppercase">
            <span className="flex items-center space-x-1.5 border-2 border-black bg-canvas px-2.5 py-1 shadow-brutal-sm">
              <ShieldCheck className="h-4 w-4 stroke-[2.5]" />
              <span>Zero Database Storage</span>
            </span>
            <span className="flex items-center space-x-1.5 border-2 border-black bg-warning px-2.5 py-1 shadow-brutal-sm">
              <Code className="h-4 w-4 stroke-[2.5]" />
              <span>Gemini 2.5 LLM Engine</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
