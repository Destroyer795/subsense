'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Send, Mail, Sparkles } from 'lucide-react';
import { EmailDraft } from '@/types';

interface EmailModalProps {
  draft: EmailDraft | null;
  isOpen: boolean;
  onClose: () => void;
  merchantName: string;
}

export function EmailModal({ draft, isOpen, onClose, merchantName }: EmailModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !draft) return null;

  const handleCopy = () => {
    const fullText = `Subject: ${draft.subject}\nTo: ${draft.recipientHint}\n\n${draft.body}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mailtoUrl = `mailto:${draft.recipientHint}?subject=${encodeURIComponent(
    draft.subject
  )}&body=${encodeURIComponent(draft.body)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">
              Gemini AI-Drafted Cancellation Email for {merchantName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Recipient Email Hint
            </label>
            <div className="mt-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-cyan-300">
              {draft.recipientHint}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Subject Line
            </label>
            <div className="mt-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-medium text-white">
              {draft.subject}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Email Body
            </label>
            <div className="mt-1 whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950 p-4 text-xs font-mono text-slate-300 leading-relaxed">
              {draft.body}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-800 bg-slate-950 px-6 py-4 gap-3">
          <span className="text-xs text-slate-500">
            Copy text or launch directly in your default email client.
          </span>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-all"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Email'}</span>
            </button>

            <a
              href={mailtoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 transition-all"
            >
              <Send className="h-4 w-4" />
              <span>Open in Email App</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
