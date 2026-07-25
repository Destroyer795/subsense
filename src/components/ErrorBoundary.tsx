'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by SubSense ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto my-12 max-w-xl border-4 border-black bg-warning p-6 shadow-brutal-lg text-black font-mono">
          <div className="flex items-center space-x-3 border-b-4 border-black pb-3">
            <ShieldAlert className="h-6 w-6 stroke-[2.5]" />
            <h2 className="text-lg font-black uppercase">UI Component Error Intercepted</h2>
          </div>
          <p className="mt-3 text-xs font-bold uppercase">
            A visual rendering anomaly occurred. SubSense recovered safely without crashing.
          </p>
          <div className="mt-2 border-2 border-black bg-white p-3 text-[11px] font-bold">
            {this.state.error?.message || 'Unexpected render state'}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 flex items-center space-x-2 border-2 border-black bg-critical px-4 py-2 text-xs font-bold text-white shadow-brutal active:translate-x-[1px] active:translate-y-[1px] active:shadow-none uppercase"
          >
            <RefreshCw className="h-4 w-4 stroke-[2.5]" />
            <span>Reset UI View</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
