'use client';

import React from 'react';
import { Zap, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  totalJobs: number;
  pendingCount: number;
}

export function Header({ onRefresh, isRefreshing, totalJobs, pendingCount }: HeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Zap className="w-5 h-5 text-slate-950 font-black fill-current" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-white">Catalyst</span>
            <span className="text-xs px-2 py-0.5 ml-2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              Next.js Web
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {pendingCount > 0 && (
            <div className="hidden sm:flex items-center space-x-1.5 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-300 px-3 py-1.5 rounded-full font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <span>{pendingCount} Awaiting Review</span>
            </div>
          )}

          <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Agent Engine Live</span>
          </div>

          <button
            onClick={onRefresh}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-md flex items-center space-x-1.5 transition active:scale-95"
            title="Refresh jobs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </header>
  );
}

