'use client';

import React, { useState } from 'react';
import { TaskJob } from '../types/job';
import { DiffViewer } from './DiffViewer';
import { ConfirmModal } from './ConfirmModal';
import {
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  GitPullRequest,
  Lock,
  ChevronDown,
  ChevronUp,
  Clock,
  ShieldCheck,
  CheckCheck,
  ArrowUpRight,
  FileCheck,
  CheckSquare,
  AlertCircle,
  FileText,
  Activity,
  Loader2
} from 'lucide-react';

interface ReviewWorkspaceProps {
  job: TaskJob;
  onRefresh: () => void;
}

export function ReviewWorkspace({ job, onRefresh }: ReviewWorkspaceProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(true);
  const [isDescOpen, setIsDescOpen] = useState(true);

  const isAwaiting = job.status === 'AWAITING_APPROVAL';
  const isPR = (job.status === 'PR_CREATED' || job.status === 'APPROVED');
  const isFailed = job.status === 'FAILED';
  const isWorking = ['QUEUED', 'CLONING', 'ANALYZING', 'FIXING'].includes(job.status);

  const prNumber = job.prUrl ? job.prUrl.split('/').pop() || '1' : '1';
  const baseSha = job.baseBranch || 'main';

  const localTestCmd = isPR
    ? `git fetch origin ${job.baseBranch || 'main'} && git checkout ${job.baseBranch || 'main'} && npm test`
    : `git fetch origin ${job.fixBranch} && git checkout ${job.fixBranch} && npm test`;

  const handleCopy = () => {
    navigator.clipboard.writeText(localTestCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApprove = async (customTitle?: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/approvals/${job.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          token: job.approvalToken,
          title: customTitle
        })
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        onRefresh();
      } else {
        alert('Approval failed: ' + (data.message || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!confirm(`Are you sure you want to reject the proposed patch for ${job.linearIssueIdentifier}?`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/approvals/${job.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          token: job.approvalToken
        })
      });

      const data = await res.json();
      if (data.success) {
        onRefresh();
      } else {
        alert('Action failed: ' + (data.message || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-warm-bg dark:bg-[#090d14] p-6 text-xs text-warm-text dark:text-slate-100 select-text transition-colors duration-150">
      {/* 1. Header & Breadcrumbs */}
      <div className="flex items-center justify-between pb-3 border-b border-warm-border dark:border-[#1a2333] mb-4">
        <div className="flex items-center space-x-2 font-mono text-[11px] text-warm-muted dark:text-slate-400">
          <span>Issues</span>
          <span>&gt;</span>
          <span className="font-semibold text-warm-text dark:text-slate-100">{job.linearIssueIdentifier}</span>
          <span>&gt;</span>
          <span className="text-warm-subtle dark:text-slate-400">
            {isPR ? `Pull Request #${prNumber}` : 'Automated Patch'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {job.linearIssueUrl && (
            <a
              href={job.linearIssueUrl}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 bg-warm-panel dark:bg-[#162032] hover:bg-warm-border/60 dark:hover:bg-[#1f2d45] border border-warm-border dark:border-[#2a374d] rounded text-[11px] font-medium text-warm-text dark:text-slate-200 flex items-center space-x-1.5 transition"
            >
              <span>Open in Linear</span>
              <ArrowUpRight className="w-3 h-3 text-warm-muted dark:text-slate-400" />
            </a>
          )}

          <div className="flex items-center space-x-1 text-[11px] text-warm-muted dark:text-slate-400 px-2 py-1 bg-warm-panel dark:bg-[#162032] border border-warm-border dark:border-[#2a374d] rounded font-mono">
            <Clock className="w-3 h-3 text-warm-subtle dark:text-slate-400" />
            <span>{new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          {isAwaiting && (
            <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-badge-reviewBg text-badge-reviewText border border-badge-reviewBorder dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30 flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>Review Required</span>
            </span>
          )}

          {isPR && (
            <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-badge-mergedBg text-badge-mergedText border border-badge-mergedBorder dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>PR Opened &amp; Merged</span>
            </span>
          )}

          {isWorking && (
            <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-badge-fixingBg text-badge-fixingText border border-badge-fixingBorder dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30 flex items-center space-x-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
              <span>Agent Working ({job.status})</span>
            </span>
          )}

          {isFailed && (
            <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-badge-failedBg text-badge-failedText border border-badge-failedBorder dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30">
              Execution Failed
            </span>
          )}
        </div>
      </div>

      {/* 2. Ticket Title & Target Branch */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-warm-text dark:text-slate-100 tracking-tight mb-2">
          {job.linearIssueIdentifier}: {job.linearIssueTitle}
        </h1>

        <div className="flex items-center space-x-2.5 flex-wrap">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-warm-panel dark:bg-[#162032] border border-warm-border dark:border-[#2a374d] rounded font-mono text-[11px]">
            <span className="text-warm-subtle dark:text-slate-400 font-sans">↳</span>
            <span className="font-semibold text-warm-text dark:text-slate-200">{job.fixBranch}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(job.fixBranch);
              }}
              title="Copy branch name"
              className="text-warm-subtle hover:text-warm-text dark:hover:text-slate-100 ml-1"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center space-x-1 text-[11px] font-mono text-warm-muted dark:text-slate-400 px-2 py-1 bg-warm-panel dark:bg-[#162032] border border-warm-border dark:border-[#2a374d] rounded">
            <span className="text-warm-subtle dark:text-slate-400">-o-</span>
            <span>Base: {baseSha}</span>
          </div>

          <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-1 rounded font-semibold">
            {job.githubRepo}
          </div>
        </div>
      </div>

      {/* 2b. Linear Issue Description (The original reported problem) */}
      {job.linearIssueDescription && (
        <div className="mb-5 bg-warm-surface dark:bg-[#0f1623] border border-warm-border dark:border-[#1e2a3c] rounded-xl overflow-hidden shadow-sm">
          <div
            onClick={() => setIsDescOpen(!isDescOpen)}
            className="px-4 py-2.5 bg-warm-panel dark:bg-[#131c2d] border-b border-warm-border dark:border-[#1e2a3c] flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center space-x-2 font-bold text-warm-text dark:text-slate-200 text-xs">
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span>Linear Issue Description &amp; Requirements</span>
            </div>
            {isDescOpen ? (
              <ChevronUp className="w-4 h-4 text-warm-muted dark:text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-warm-muted dark:text-slate-400" />
            )}
          </div>

          {isDescOpen && (
            <div className="p-4 bg-warm-surface dark:bg-[#0c111a]">
              <div className="text-[12px] text-warm-text dark:text-slate-200 whitespace-pre-wrap font-sans leading-relaxed bg-warm-panel/60 dark:bg-[#111927] p-3.5 rounded-lg border border-warm-border dark:border-[#1e2a3c]">
                {job.linearIssueDescription}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error alert if job failed */}
      {isFailed && job.error && (
        <div className="mb-5 bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-300 text-xs">
          <div className="font-bold flex items-center space-x-2 text-rose-400 mb-1">
            <AlertCircle className="w-4 h-4" />
            <span>Agent Execution Error</span>
          </div>
          <pre className="font-mono text-[11px] whitespace-pre-wrap overflow-x-auto text-rose-200 bg-rose-950/30 p-2.5 rounded border border-rose-900/40">
            {job.error}
          </pre>
        </div>
      )}

      {/* 3. Action Buttons / Approval Bar (If awaiting approval) */}
      {isAwaiting && (
        <div className="mb-5 space-y-1.5">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 rounded bg-primaryBtn-bg hover:bg-primaryBtn-hover text-primaryBtn-text font-bold text-xs flex items-center space-x-2 shadow transition"
            >
              <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
              <span>Approve &amp; Push PR</span>
            </button>

            <button
              onClick={handleReject}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded border border-warm-border dark:border-[#2a374d] bg-warm-panel dark:bg-[#162032] hover:bg-warm-border/60 dark:hover:bg-[#1f2d45] text-warm-text dark:text-slate-200 font-semibold text-xs flex items-center space-x-1.5 transition"
            >
              <XCircle className="w-4 h-4 text-warm-muted dark:text-slate-400" />
              <span>Reject Patch</span>
            </button>
          </div>

          <div className="flex items-center space-x-1.5 text-[11px] text-warm-muted dark:text-slate-400 pl-0.5">
            <Lock className="w-3 h-3 text-warm-subtle dark:text-slate-400" />
            <span>PR publishing locked until patch is approved</span>
          </div>
        </div>
      )}

      {/* 3b. Big Success Banner (If PR was opened & merged) */}
      {isPR && (
        <div className="mb-5 bg-warm-panel/80 dark:bg-[#131c2d] border border-warm-border dark:border-[#1e2a3c] rounded-xl p-5 shadow-sm">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-cardHero-bg text-cardHero-text flex items-center justify-center shrink-0 shadow-sm">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>

            <div className="flex-1">
              <h2 className="text-base font-bold text-warm-text dark:text-slate-100 tracking-tight">
                Patch Approved &amp; Pull Request Created Successfully!
              </h2>
              <p className="text-xs text-warm-muted dark:text-slate-300 mt-1 leading-relaxed max-w-2xl">
                PR #{prNumber} was automatically created on GitHub with passing CI checks. Linked to Linear{' '}
                <span className="font-semibold text-warm-text dark:text-slate-100">{job.linearIssueIdentifier}</span>. Branch auto-merged into{' '}
                <span className="font-mono font-semibold text-warm-text dark:text-slate-100">{job.baseBranch || 'main'}</span> with zero merge conflicts.
              </p>

              <div className="flex items-center space-x-3 mt-3">
                {job.prUrl ? (
                  <a
                    href={job.prUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded bg-primaryBtn-bg hover:bg-primaryBtn-hover text-primaryBtn-text font-bold text-xs flex items-center space-x-2 shadow transition"
                  >
                    <GitPullRequest className="w-3.5 h-3.5 text-amber-400" />
                    <span>View GitHub PR #{prNumber} ↗</span>
                  </a>
                ) : (
                  <button className="px-4 py-2 rounded bg-primaryBtn-bg text-primaryBtn-text font-bold text-xs flex items-center space-x-2">
                    <GitPullRequest className="w-3.5 h-3.5 text-amber-400" />
                    <span>View GitHub PR #{prNumber} ↗</span>
                  </button>
                )}

                <a
                  href={`https://github.com/${job.githubRepo}/actions`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded border border-warm-border dark:border-[#2a374d] bg-warm-surface dark:bg-[#162032] hover:bg-warm-panel dark:hover:bg-[#1f2d45] text-warm-text dark:text-slate-200 font-semibold text-xs flex items-center space-x-1.5 transition"
                >
                  <Activity className="w-3.5 h-3.5 text-warm-muted dark:text-slate-400" />
                  <span>Open in GitHub Actions ↗</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Local CLI Run Command Box (macOS window style) */}
      <div className="mb-5 bg-warm-sidebar dark:bg-[#070b12] border border-warm-sidebarBorder dark:border-[#1a2333] rounded-lg overflow-hidden text-stone-300 font-mono shadow-sm">
        <div className="px-4 py-2.5 bg-warm-sidebarHover dark:bg-[#0f1624] border-b border-warm-sidebarBorder dark:border-[#1a2333] flex items-center justify-between text-[11px]">
          <div className="flex items-center space-x-2.5">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
            </div>
            <span className="text-stone-300 dark:text-slate-300 font-sans">
              Run verified patch locally in your development shell
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 text-stone-300 hover:text-stone-100 px-2 py-0.5 rounded bg-warm-sidebarHover/80 dark:bg-[#1a2333] border border-warm-sidebarBorder dark:border-[#2a374d] transition text-[10px]"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-stone-400" />
                <span>Copy Command</span>
              </>
            )}
          </button>
        </div>

        <div className="p-3.5 text-xs text-amber-300/90 whitespace-pre-wrap break-all select-all font-mono leading-relaxed">
          <span className="text-stone-500 select-none mr-2">$</span>
          {localTestCmd}
        </div>
      </div>

      {/* 5. Diff Viewer: Split (Side-by-Side) and Unified code diff */}
      <div className="mb-5">
        <DiffViewer diffText={job.diffContent} />
      </div>

      {/* 6. Automated Patch Analysis & Test Suite Verification Card */}
      <div className="bg-warm-surface dark:bg-[#0f1623] border border-warm-border dark:border-[#1e2a3c] rounded-xl overflow-hidden shadow-sm mb-6">
        <div
          onClick={() => setIsAnalysisOpen(!isAnalysisOpen)}
          className="px-4 py-3 bg-warm-panel dark:bg-[#131c2d] border-b border-warm-border dark:border-[#1e2a3c] flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center space-x-2 font-bold text-warm-text dark:text-slate-100 text-xs">
            <ShieldCheck className="w-4 h-4 text-warm-text dark:text-slate-100" />
            <span>Automated Patch Analysis &amp; Test Suite Verification</span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              CI Tests Verified
            </span>
            {isAnalysisOpen ? (
              <ChevronUp className="w-4 h-4 text-warm-muted dark:text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-warm-muted dark:text-slate-400" />
            )}
          </div>
        </div>

        {isAnalysisOpen && (
          <div className="p-4 bg-warm-surface dark:bg-[#0c111a]">
            {/* If pending review: 3-column analysis grid */}
            {!isPR ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Column 1: Root Cause Analysis */}
                <div className="p-4 bg-warm-panel/60 dark:bg-[#111927] border border-warm-border dark:border-[#1e2a3c] rounded-lg flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-1.5 font-bold text-warm-text dark:text-slate-100 mb-2 text-xs">
                      <FileCheck className="w-3.5 h-3.5 text-warm-muted dark:text-slate-400" />
                      <span>Root Cause Analysis</span>
                    </div>
                    <p className="text-[11px] text-warm-muted dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {job.fixSummary ||
                        'A non-numeric or malformed promo.value bypassed the fallback check, causing mathematical operations to yield NaN, propagating downstream to Stripe charge initialization.'}
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-warm-border/60 dark:border-[#1e2a3c]">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-warm-surface dark:bg-[#162032] border border-warm-border dark:border-[#2a374d] rounded text-[10px] text-warm-text dark:text-slate-300 font-mono">
                      <span>✓ Automated code bounds verified</span>
                    </span>
                  </div>
                </div>

                {/* Column 2: CI Test Suite */}
                <div className="p-4 bg-warm-panel/60 dark:bg-[#111927] border border-warm-border dark:border-[#1e2a3c] rounded-lg flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-1.5 font-bold text-warm-text dark:text-slate-100 text-xs">
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                        <span>CI Test Suite</span>
                      </div>
                      <span className="font-mono text-[10px] text-emerald-400 font-bold">Passing</span>
                    </div>
                    <p className="text-[11px] text-warm-muted dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {job.testOutput || 'Ran unit test suite across target repository. All discount calculation specifications and boundary cases verified successfully.'}
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-warm-border/60 dark:border-[#1e2a3c]">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-warm-surface dark:bg-[#162032] border border-warm-border dark:border-[#2a374d] rounded text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-medium">
                      <span>•••• Zero regressions detected</span>
                    </span>
                  </div>
                </div>

                {/* Column 3: Security & Regression */}
                <div className="p-4 bg-warm-panel/60 dark:bg-[#111927] border border-warm-border dark:border-[#1e2a3c] rounded-lg flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-1.5 font-bold text-warm-text dark:text-slate-100 mb-2 text-xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
                      <span>Security &amp; Regression</span>
                    </div>
                    <p className="text-[11px] text-warm-muted dark:text-slate-300 leading-relaxed">
                      Zero external dependencies introduced. Backward compatibility verified across repository module endpoints.
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-warm-border/60 dark:border-[#1e2a3c] flex items-center justify-between text-[10px] font-mono text-warm-muted dark:text-slate-400">
                    <span>AST Complexity Delta:</span>
                    <span className="text-warm-text dark:text-slate-200 font-bold">+1 cyclomatic</span>
                  </div>
                </div>
              </div>
            ) : (
              /* If PR is opened & merged: Full CI Execution & Regression Suite table */
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-warm-border dark:border-[#1e2a3c] pb-2 text-[11px]">
                  <div className="flex items-center space-x-2 font-bold text-warm-text dark:text-slate-100">
                    <CheckCheck className="w-4 h-4 text-emerald-500" />
                    <span>CI Execution &amp; Regression Suite</span>
                    <span className="px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 rounded font-mono text-[10px]">
                      Tests Passed
                    </span>
                  </div>
                  <span className="text-warm-subtle dark:text-slate-400 font-mono text-[10px]">
                    Ran on GitHub Actions runner with passing checks
                  </span>
                </div>

                <div className="divide-y divide-warm-border/60 dark:divide-[#1e2a3c] font-mono text-[11px]">
                  <div className="py-2 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="text-warm-text dark:text-slate-200 font-semibold">npm test: discount.spec.js</span>
                      <span className="text-warm-muted dark:text-slate-400 font-sans text-[10px]">
                        Fixes discount validation and negative cart totals
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-warm-muted dark:text-slate-400">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">All passed</span>
                    </div>
                  </div>

                  <div className="py-2 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="text-warm-text dark:text-slate-200 font-semibold">git diff syntax verification</span>
                      <span className="text-warm-muted dark:text-slate-400 font-sans text-[10px]">
                        Clean patch applied with zero merge conflicts
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-warm-muted dark:text-slate-400">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">0 syntax warnings</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 7. Bottom Status & Lead Signature bar */}
      <div className="border-t border-warm-border dark:border-[#1a2333] pt-3 flex items-center justify-between text-[11px] text-warm-muted dark:text-slate-400">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-full bg-primaryBtn-bg text-primaryBtn-text font-mono text-[9px] flex items-center justify-center font-bold">
            SC
          </div>
          <span className="font-semibold text-warm-text dark:text-slate-200">Sarah Chen (Tech Lead)</span>
          <span className="text-warm-subtle dark:text-slate-400">Signed merge commit</span>
        </div>

        <div className="flex items-center space-x-3 font-mono text-[10px]">
          <span>● PatchCraft Sentinel 2.4.8</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Zero regression flags detected</span>
          <span className="text-warm-subtle dark:text-slate-500">|</span>
          <button className="hover:text-warm-text dark:hover:text-slate-200 transition">Audit Trail Logs</button>
          <span className="text-warm-subtle dark:text-slate-500">|</span>
          <button className="hover:text-warm-text dark:hover:text-slate-200 transition">Documentation</button>
        </div>
      </div>

      {/* Modal Dialog */}
      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        job={job}
        onConfirm={handleApprove}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
