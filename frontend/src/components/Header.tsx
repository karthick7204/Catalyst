'use client';

import React from 'react';
import { GitPullRequest, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  totalJobs: number;
  pendingCount: number;
}

export function Header({ onRefresh, isRefreshing, pendingCount }: HeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-[#0d131f] sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-md bg-emerald-500 flex items-center justify-center text-slate-950 font-bold text-sm">
            C
          </div>
          <div className="flex items-center space-x-2 text-sm font-semibold text-white">
            <span>Catalyst</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-300 font-normal">Code Review & Approvals</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {pendingCount > 0 && (
            <span className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full font-medium flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>{pendingCount} Pending Review</span>
            </span>
          )}

          <button
            onClick={onRefresh}
            className="text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded border border-slate-700 flex items-center space-x-1.5 transition active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>
    </header>
  );
}
