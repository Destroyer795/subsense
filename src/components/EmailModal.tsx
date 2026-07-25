'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Send, Activity } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl border-4 border-black bg-white shadow-brutal-lg overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b-4 border-black bg-warning px-6 py-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-6 w-6 text-black stroke-[2.5]" />
            <h3 className="text-base font-black uppercase text-black">
              Gemini AI-Drafted Action Email: {merchantName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="border-2 border-black bg-white p-1 text-black shadow-brutal-sm hover:bg-canvas active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            <X className="h-5 w-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto bg-canvas">
          <div>
            <label className="text-xs font-mono font-bold text-black uppercase tracking-wider">
              Recipient Email Address
            </label>
            <div className="mt-1 border-2 border-black bg-white px-3 py-2 text-xs font-mono font-bold text-black shadow-brutal-sm">
              {draft.recipientHint}
            </div>
          </div>

          <div>
            <label className="text-xs font-mono font-bold text-black uppercase tracking-wider">
              Subject Line
            </label>
            <div className="mt-1 border-2 border-black bg-white px-3 py-2 text-xs font-mono font-bold text-black shadow-brutal-sm">
              {draft.subject}
            </div>
          </div>

          <div>
            <label className="text-xs font-mono font-bold text-black uppercase tracking-wider">
              Generated Email Body
            </label>
            <div className="mt-1 whitespace-pre-wrap border-2 border-black bg-white p-4 text-xs font-mono text-black leading-relaxed shadow-brutal-sm">
              {draft.body}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t-4 border-black bg-white px-6 py-4 gap-4">
          <span className="text-xs font-mono font-bold uppercase text-black">
            Copy text or launch default mail client.
          </span>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 border-2 border-black bg-white px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-black shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-75"
            >
              {copied ? (
                <Check className="h-4 w-4 text-safe stroke-[2.5]" />
              ) : (
                <Copy className="h-4 w-4 stroke-[2.5]" />
              )}
              <span>{copied ? 'Copied!' : 'Copy Email'}</span>
            </button>

            <a
              href={mailtoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 border-2 border-black bg-critical px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-white shadow-brutal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-75"
            >
              <Send className="h-4 w-4 stroke-[2.5]" />
              <span>Open in Email</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
