'use client';

import React, { useState } from 'react';
import { TaskJob } from '../types/job';
import { GitPullRequest, GitBranch, X, Check, Loader2, ShieldCheck } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: TaskJob;
  onConfirm: (customTitle?: string) => Promise<void>;
  isSubmitting: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  job,
  onConfirm,
  isSubmitting,
}: ConfirmModalProps) {
  const [prTitle, setPrTitle] = useState(
    `fix(checkout): sanitize promo code discount calculation (fixes ${job.linearIssueIdentifier})`
  );
  const [runE2E, setRunE2E] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(prTitle);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-warm-surface border border-warm-border rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-xs">
        {/* Modal Header */}
        <div className="p-4 flex items-start justify-between border-b border-warm-border bg-warm-panel/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#1f1b18] text-warm-bg flex items-center justify-center">
              <GitPullRequest className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-warm-text">
                Confirm Pull Request Creation
              </h3>
              <p className="text-[11px] text-warm-muted mt-0.5">
                You are about to approve patch for Linear issue{' '}
                <span className="font-mono font-semibold px-1.5 py-0.5 bg-warm-panel border border-warm-border rounded text-warm-text">
                  {job.linearIssueIdentifier}
                </span>{' '}
                and open a Pull Request on GitHub.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-warm-subtle hover:text-warm-text p-1 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Metadata */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-warm-panel/60 border border-warm-border rounded-lg p-3.5 space-y-3">
            {/* Repository */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-warm-muted">Repository</span>
              <span className="font-mono font-semibold text-warm-text">
                {job.githubRepo}
              </span>
            </div>

            {/* Target Branch */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-warm-muted">Target Branch</span>
              <div className="flex items-center space-x-1.5 font-mono">
                <span className="px-1.5 py-0.5 bg-warm-surface border border-warm-border rounded text-warm-text font-bold">
                  {job.baseBranch || 'main'}
                </span>
                <span className="text-warm-subtle">←</span>
                <span className="px-1.5 py-0.5 bg-warm-surface border border-warm-border rounded text-warm-muted truncate max-w-[160px]">
                  {job.fixBranch}
                </span>
              </div>
            </div>

            {/* PR Title Input */}
            <div className="space-y-1.5 pt-1 border-t border-warm-border/60">
              <label className="text-[11px] font-semibold text-warm-text block">
                PR Title
              </label>
              <input
                type="text"
                value={prTitle}
                onChange={(e) => setPrTitle(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-warm-surface border border-warm-border rounded font-mono text-[11px] text-warm-text focus:outline-none focus:border-warm-text"
              />
              <p className="text-[10px] text-warm-muted italic flex items-center space-x-1">
                <span>↳</span>
                <span>
                  Will automatically mark {job.linearIssueIdentifier} as &quot;In Review&quot; on Linear
                </span>
              </p>
            </div>

            {/* Reviewers */}
            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-warm-muted">Reviewers</span>
              <div className="flex items-center space-x-1 font-mono text-[10px]">
                <span className="px-1.5 py-0.5 bg-warm-surface border border-warm-border rounded text-warm-text">
                  @sarah-chen
                </span>
                <span className="px-1.5 py-0.5 bg-warm-surface border border-warm-border rounded text-warm-text">
                  @alex-dev
                </span>
              </div>
            </div>
          </div>

          {/* Test Option Checkbox */}
          <label className="flex items-center space-x-2 text-[11px] text-warm-text cursor-pointer select-none">
            <input
              type="checkbox"
              checked={runE2E}
              onChange={(e) => setRunE2E(e.target.checked)}
              className="rounded border-warm-border text-[#1f1b18] focus:ring-0"
            />
            <span className="font-medium">
              Run full end-to-end integration tests upon PR opening
            </span>
          </label>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-warm-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 rounded border border-warm-border bg-warm-surface text-warm-muted hover:text-warm-text font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded bg-[#1f1b18] hover:bg-[#2f2723] text-stone-100 font-bold flex items-center space-x-1.5 shadow transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              ) : (
                <GitPullRequest className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>
                {isSubmitting ? 'Pushing PR...' : 'Confirm & Open PR'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
