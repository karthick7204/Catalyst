'use client';

import React from 'react';
import { Check, RefreshCw, History, GitPullRequest, Settings, Terminal } from 'lucide-react';

interface EmptyStateProps {
  repoName: string;
  onSync: () => void;
  isSyncing: boolean;
}

export function EmptyState({ repoName, onSync, isSyncing }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col justify-between p-6 bg-warm-bg select-none">
      {/* Top Workspace & Status Header */}
      <div className="flex items-center justify-between text-xs text-warm-muted border-b border-warm-border pb-3">
        <div className="flex items-center space-x-2 font-mono">
          <span className="text-warm-subtle">workspace:</span>
          <span className="font-semibold text-warm-text">production</span>
          <span className="text-warm-subtle">/</span>
          <span className="text-warm-subtle">branch:</span>
          <span className="font-semibold text-warm-text">main</span>
        </div>
        <div className="flex items-center space-x-1.5 text-[11px] text-warm-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Sentry & Linear API: Healthy</span>
        </div>
      </div>

      {/* Center White Card */}
      <div className="my-auto max-w-xl w-full mx-auto bg-warm-surface border border-warm-border rounded-2xl p-8 shadow-sm text-center">
        {/* Rounded Brown Badge */}
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#614e3e] text-amber-100 flex items-center justify-center relative shadow-sm mb-4">
          <Check className="w-7 h-7 stroke-[3]" />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#1f1b18] text-amber-400 flex items-center justify-center border-2 border-warm-surface">
            <GitPullRequest className="w-3 h-3" />
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-xl font-bold text-warm-text tracking-tight mb-2">
          All Caught Up! Zero Bugs in Queue
        </h2>

        {/* Subtitle */}
        <p className="text-xs text-warm-muted leading-relaxed max-w-md mx-auto mb-6">
          Great job! Every automated patch for{' '}
          <span className="font-mono px-1.5 py-0.5 bg-warm-panel border border-warm-border rounded text-warm-text font-semibold">
            {repoName}
          </span>{' '}
          has been reviewed and pushed to GitHub. PatchCraft is actively listening for new Linear bug tickets and Sentry exceptions.
        </p>

        {/* 3 Metrics Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3 bg-warm-panel/70 border border-warm-border rounded-lg text-center">
            <div className="text-lg font-extrabold text-warm-text font-mono">14</div>
            <div className="text-[10px] text-warm-muted uppercase tracking-wider font-medium mt-0.5">
              Patches Reviewed
            </div>
          </div>
          <div className="p-3 bg-warm-panel/70 border border-warm-border rounded-lg text-center">
            <div className="text-lg font-extrabold text-warm-text font-mono">99.4% ~</div>
            <div className="text-[10px] text-warm-muted uppercase tracking-wider font-medium mt-0.5">
              CI Pass Rate
            </div>
          </div>
          <div className="p-3 bg-warm-panel/70 border border-warm-border rounded-lg text-center">
            <div className="text-lg font-extrabold text-warm-text font-mono">4.2m</div>
            <div className="text-[10px] text-warm-muted uppercase tracking-wider font-medium mt-0.5">
              Avg Triage Time
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-3 mb-4">
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="px-4 py-2 bg-[#1f1b18] hover:bg-[#2f2723] text-stone-100 rounded text-xs font-bold transition flex items-center space-x-2 shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync Linear Tickets Now</span>
          </button>

          <button className="px-4 py-2 bg-warm-panel hover:bg-warm-border/60 text-warm-text border border-warm-border rounded text-xs font-semibold transition flex items-center space-x-2">
            <History className="w-3.5 h-3.5 text-warm-muted" />
            <span>Browse Merged PR History</span>
          </button>
        </div>

        {/* Webhooks configuration link */}
        <button className="text-[11px] text-warm-subtle hover:text-warm-text font-mono transition flex items-center justify-center space-x-1 mx-auto">
          <span>&lt;/&gt; Configure Repository Webhooks & Rules</span>
        </button>
      </div>

      {/* Bottom Keyboard Shortcut Prompt */}
      <div className="mt-auto pt-3 border-t border-warm-border flex items-center justify-center text-[11px] text-warm-muted">
        <div className="flex items-center space-x-1 bg-warm-panel/60 border border-warm-border px-3 py-1 rounded">
          <Terminal className="w-3 h-3 text-warm-subtle mr-1" />
          <span>Keyboard shortcut: Press</span>
          <kbd className="px-1 bg-warm-surface border border-warm-border rounded font-mono font-bold text-warm-text text-[10px]">
            ⌘R
          </kbd>
          <span>to refresh queue or</span>
          <kbd className="px-1 bg-warm-surface border border-warm-border rounded font-mono font-bold text-warm-text text-[10px]">
            ⌘K
          </kbd>
          <span>to jump to repository</span>
        </div>
      </div>
    </div>
  );
}
