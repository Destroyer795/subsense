'use client';

import React, { useState } from 'react';
import { MessageSquare, Send, Bot, User, RefreshCw, Zap, AlertTriangle } from 'lucide-react';
import { SubscriptionItem, DashboardSummary } from '@/types';

interface ChatAssistantProps {
  subscriptions: SubscriptionItem[];
  summary: DashboardSummary;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  source?: 'gemini' | 'fallback';
  errorDetails?: string;
}

export function ChatAssistant({ subscriptions, summary }: ChatAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'bot',
      text: `SubSense AI Assistant active. Ask me any question about your ${subscriptions.length} detected subscriptions, leak scores, or projected savings.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputQuery('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToSend, subscriptions, summary }),
      });

      const data = await res.json();
      const botAnswer = data.answer || 'SubSense Assistant was unable to process your request.';

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: botAnswer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: data.source,
        errorDetails: data.errorDetails,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Error sending chat message:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          text: 'Assistant query failed. Displaying grounded local summary instead.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: 'fallback',
          errorDetails: String(err),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    'Why is Netflix flagged as high leak?',
    'Which subscription should I cancel first?',
    'How much do I save if I cancel all high leak subs?',
  ];

  return (
    <div className="border-4 border-black bg-white p-6 shadow-brutal-lg space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b-4 border-black pb-4">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-6 w-6 text-black stroke-[2.5]" />
          <h3 className="text-xl font-black uppercase text-black">
            Grounded Gemini AI Assistant
          </h3>
        </div>
        <span className="border-2 border-black bg-warning px-2.5 py-0.5 text-xs font-mono font-bold uppercase text-black shadow-brutal-sm">
          Tool-Calling Engine
        </span>
      </div>

      {/* Messages List Container */}
      <div className="h-64 overflow-y-auto border-2 border-black bg-canvas p-4 space-y-3 shadow-brutal-sm">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] border-2 border-black p-3 text-xs font-mono font-bold leading-relaxed shadow-brutal-sm ${
                msg.sender === 'user' ? 'bg-warning text-black' : 'bg-white text-black'
              }`}
            >
              <div className="flex items-center justify-between space-x-2 mb-1.5 text-[10px] uppercase text-black border-b border-black/20 pb-1">
                <div className="flex items-center space-x-1.5">
                  {msg.sender === 'user' ? (
                    <>
                      <User className="h-3 w-3 stroke-[2.5]" />
                      <span>You</span>
                    </>
                  ) : (
                    <>
                      <Bot className="h-3 w-3 stroke-[2.5] text-critical" />
                      <span>SubSense AI</span>
                    </>
                  )}
                </div>

                {msg.sender === 'bot' && msg.source && (
                  <div className="flex items-center space-x-1 font-mono text-[9px]">
                    {msg.source === 'gemini' ? (
                      <span className="border border-black bg-safe px-1.5 py-0.5 text-black font-black uppercase flex items-center gap-1">
                        <Zap className="h-2.5 w-2.5 fill-black" />
                        LIVE GEMINI AI
                      </span>
                    ) : (
                      <span
                        title={msg.errorDetails || 'Offline Fallback Engine'}
                        className="border border-black bg-warning px-1.5 py-0.5 text-black font-bold uppercase flex items-center gap-1 cursor-help"
                      >
                        <AlertTriangle className="h-2.5 w-2.5 stroke-[2.5]" />
                        OFFLINE FALLBACK
                      </span>
                    )}
                  </div>
                )}

                <span className="font-mono text-[9px]">{msg.timestamp}</span>
              </div>
              <p className="whitespace-pre-wrap">{msg.text}</p>
              {msg.errorDetails && (
                <div className="mt-2 text-[9px] font-mono text-red-600 border-t border-black/10 pt-1 font-normal italic">
                  Reason: {msg.errorDetails}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="border-2 border-black bg-white p-3 text-xs font-mono font-bold text-black shadow-brutal-sm flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin stroke-[2.5] text-critical" />
              <span>Querying Dataset Tools & Synthesizing Grounded Answer...</span>
            </div>
          </div>
        )}
      </div>

      {/* Prompt Suggestions */}
      <div className="flex flex-wrap gap-2 pt-1">
        {samplePrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={isLoading}
            className="border-2 border-black bg-white px-2.5 py-1 text-[11px] font-mono font-bold uppercase text-black shadow-brutal-sm hover:bg-warning active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 pt-2"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask any question about your recurring subscriptions..."
          className="flex-1 border-2 border-black bg-white px-3 py-2 text-xs font-mono font-bold text-black placeholder-slate-400 shadow-brutal-sm focus:outline-none"
        />

        <button
          type="submit"
          disabled={isLoading || !inputQuery.trim()}
          className="flex items-center space-x-2 border-2 border-black bg-critical px-5 py-2 text-xs font-mono font-bold uppercase tracking-wider text-white shadow-brutal active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50"
        >
          <Send className="h-4 w-4 stroke-[2.5]" />
          <span>Ask AI</span>
        </button>
      </form>
    </div>
  );
}
