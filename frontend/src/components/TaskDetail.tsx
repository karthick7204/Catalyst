'use client';

import React, { useState } from 'react';
import { TaskJob } from '../types/job';
import { DiffViewer } from './DiffViewer';
import {
  ExternalLink,
  GitBranch,
  Github,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Sparkles,
  GitPullRequest,
  Terminal,
  Loader2
} from 'lucide-react';

interface TaskDetailProps {
  job: TaskJob;
  onApprovalDone: () => void;
}

export function TaskDetail({ job, onApprovalDone }: TaskDetailProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isAwaiting = job.status === 'AWAITING_APPROVAL';
  const isPR = (job.status === 'PR_CREATED' || job.status === 'APPROVED') && job.prUrl;

  const gitCheckoutCmd = `git fetch origin ${job.fixBranch} && git checkout ${job.fixBranch}`;

  const copyCommand = () => {
    navigator.clipboard.writeText(gitCheckoutCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDecision = async (action: 'approve' | 'reject') => {
    if (!confirm(`Are you sure you want to ${action.toUpperCase()} this proposed fix?`)) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/approvals/${job.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          token: job.approvalToken
        })
      });

      const data = await res.json();
      if (data.success) {
        setFeedback(data.message || `Successfully executed ${action}`);
        onApprovalDone();
      } else {
        alert('Action failed: ' + data.message);
      }
    } catch (err: any) {
      alert('Error submitting decision: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 flex flex-col space-y-6 shadow-xl">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5 mb-1.5 flex-wrap gap-y-1">
            <span className="font-mono text-sm font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {job.linearIssueIdentifier}
            </span>

            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-slate-800 border border-slate-700 text-slate-300">
              {job.status}
            </span>

            <a
              href={job.linearIssueUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1 underline decoration-slate-700 ml-2"
            >
              <span>View Linear Ticket</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <h1 className="text-xl font-bold text-white tracking-tight">{job.linearIssueTitle}</h1>

          <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1.5 flex-wrap">
            <span className="flex items-center space-x-1">
              <Github className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-300 font-medium">{job.githubRepo}</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <GitBranch className="w-3.5 h-3.5 text-amber-400" />
              <code className="text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded text-[11px]">
                {job.fixBranch}
              </code>
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3 shrink-0">
          {isAwaiting && (
            <>
              <button
                disabled={isSubmitting}
                onClick={() => handleDecision('reject')}
                className="px-4 py-2 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 rounded-lg text-sm font-semibold transition border border-slate-700 hover:border-rose-500/40 disabled:opacity-50 flex items-center space-x-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>

              <button
                disabled={isSubmitting}
                onClick={() => handleDecision('approve')}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-sm transition shadow-lg shadow-emerald-600/30 flex items-center space-x-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Approve & Push PR</span>
              </button>
            </>
          )}

          {isPR && (
            <a
              href={job.prUrl!}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm transition shadow-lg shadow-blue-600/30 flex items-center space-x-2"
            >
              <GitPullRequest className="w-4 h-4" />
              <span>View GitHub Pull Request</span>
            </a>
          )}
        </div>
      </div>

      {feedback && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 p-3 rounded-lg text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Local Testing Command Helper */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2 font-mono text-slate-300 truncate">
          <Terminal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate">{gitCheckoutCmd}</span>
        </div>
        <button
          onClick={copyCommand}
          className="text-slate-400 hover:text-white px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded transition shrink-0 ml-3 flex items-center space-x-1"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* AI Root Cause & Fix Summary */}
      <div className="bg-slate-950/40 border border-slate-800 rounded-lg p-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>AI Root Cause & Verification Report</span>
        </h3>
        <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
          {job.fixSummary || 'Analysis in progress...'}
        </div>
      </div>

      {/* Code Diff Viewer */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <GitPullRequest className="w-3.5 h-3.5 text-sky-400" />
            <span>Proposed Code Diff</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {job.diffContent ? `${job.diffContent.split('\n').length} lines` : '0 lines'}
          </span>
        </div>

        <DiffViewer diffText={job.diffContent} />
      </div>
    </div>
  );
}

