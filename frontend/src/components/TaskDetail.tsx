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
  GitPullRequest,
  Terminal,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface TaskDetailProps {
  job: TaskJob;
  onApprovalDone: () => void;
}

export function TaskDetail({ job, onApprovalDone }: TaskDetailProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(true);

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
    <div className="flex flex-col space-y-4">
      {/* Top Review Bar */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5 mb-2 flex-wrap">
            <span className="font-mono text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              {job.linearIssueIdentifier}
            </span>

            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
              isAwaiting
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : isPR
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              {isAwaiting ? 'Review Required' : job.status}
            </span>

            <a
              href={job.linearIssueUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1 underline decoration-slate-700 ml-1"
            >
              <span>Linear Issue</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <h1 className="text-lg font-bold text-white tracking-tight">{job.linearIssueTitle}</h1>

          <div className="flex items-center space-x-3 text-xs text-slate-400 mt-2 flex-wrap">
            <span className="flex items-center space-x-1">
              <Github className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-300 font-mono">{job.githubRepo}</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <GitBranch className="w-3.5 h-3.5 text-slate-400" />
              <code className="text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded text-[11px] font-mono">
                {job.fixBranch}
              </code>
            </span>
          </div>
        </div>

        {/* Approval Controls */}
        <div className="flex items-center space-x-2.5 shrink-0">
          {isAwaiting && (
            <>
              <button
                disabled={isSubmitting}
                onClick={() => handleDecision('reject')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-sm font-semibold transition border border-slate-700 disabled:opacity-50 flex items-center space-x-1.5"
              >
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Reject</span>
              </button>

              <button
                disabled={isSubmitting}
                onClick={() => handleDecision('approve')}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded text-sm transition flex items-center space-x-2 disabled:opacity-50 shadow-sm"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
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
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-sm transition flex items-center space-x-2"
            >
              <GitPullRequest className="w-4 h-4" />
              <span>View GitHub Pull Request ↗</span>
            </a>
          )}
        </div>
      </div>

      {feedback && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 p-3 rounded-lg text-sm flex items-center space-x-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Main Diff Comparison (Split: Old Code vs Fixed Code) */}
      <div className="flex flex-col space-y-2">
        <DiffViewer diffText={job.diffContent} />
      </div>

      {/* Local IDE Test Command */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-3 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2 font-mono text-slate-300 truncate">
          <Terminal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-slate-500 select-none">Test locally:</span>
          <span className="truncate text-slate-200">{gitCheckoutCmd}</span>
        </div>
        <button
          onClick={copyCommand}
          className="text-slate-300 hover:text-white px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition shrink-0 ml-3 flex items-center space-x-1"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy Command'}</span>
        </button>
      </div>

      {/* Collapsible Root Cause & Verification Details */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowNotes(!showNotes)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-300 hover:bg-slate-800/50 transition border-b border-slate-800"
        >
          <span>Root Cause Analysis & Verification Report</span>
          {showNotes ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showNotes && (
          <div className="p-4 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans bg-[#0b0f17]">
            {job.fixSummary || 'Analysis in progress...'}
          </div>
        )}
      </div>
    </div>
  );
}
