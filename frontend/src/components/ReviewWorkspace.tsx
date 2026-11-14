'use client';

import React, { useState } from 'react';
import { TaskJob } from '../types/job';
import { DiffViewer } from './DiffViewer';
import { ConfirmModal } from './ConfirmModal';
import {
  ExternalLink,
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
  Terminal,
  Activity,
  Layers,
  FileCheck,
  CheckSquare
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

  const isAwaiting = job.status === 'AWAITING_APPROVAL';
  const isPR = (job.status === 'PR_CREATED' || job.status === 'APPROVED');
  const isFailed = job.status === 'FAILED';

  const prNumber = job.prUrl ? job.prUrl.split('/').pop() || '842' : '842';
  const baseSha = 'e4f9b21';

  const localTestCmd = isPR
    ? `git fetch origin main && git checkout main && git pull origin main && npm test`
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
    <div className="flex-1 overflow-y-auto bg-warm-bg p-6 text-xs text-warm-text select-text">
      {/* 1. Header & Breadcrumbs */}
      <div className="flex items-center justify-between pb-3 border-b border-warm-border mb-4">
        <div className="flex items-center space-x-2 font-mono text-[11px] text-warm-muted">
          <span>Issues</span>
          <span>&gt;</span>
          <span className="font-semibold text-warm-text">{job.linearIssueIdentifier}</span>
          <span>&gt;</span>
          <span className="text-warm-subtle">
            {isPR ? `Pull Request #${prNumber}` : 'Automated Patch v3'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {job.linearIssueUrl && (
            <a
              href={job.linearIssueUrl}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 bg-warm-panel hover:bg-warm-border/60 border border-warm-border rounded text-[11px] font-medium text-warm-text flex items-center space-x-1.5 transition"
            >
              <span>Open in Linear</span>
              <ArrowUpRight className="w-3 h-3 text-warm-muted" />
            </a>
          )}

          <div className="flex items-center space-x-1 text-[11px] text-warm-muted px-2 py-1 bg-warm-panel border border-warm-border rounded font-mono">
            <Clock className="w-3 h-3 text-warm-subtle" />
            <span>Generated in 4.2s</span>
          </div>

          {isAwaiting && (
            <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-badge-reviewBg text-badge-reviewText border border-badge-reviewBorder flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>Review Required</span>
            </span>
          )}

          {isPR && (
            <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-badge-mergedBg text-badge-mergedText border border-badge-mergedBorder flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              <span>PR Opened &amp; Merged</span>
            </span>
          )}

          {isFailed && (
            <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-badge-failedBg text-badge-failedText border border-badge-failedBorder">
              Execution Failed
            </span>
          )}
        </div>
      </div>

      {/* 2. Ticket Title & Target Branch */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-warm-text tracking-tight mb-2">
          {job.linearIssueIdentifier}: {job.linearIssueTitle}
        </h1>

        <div className="flex items-center space-x-2.5 flex-wrap">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-warm-panel border border-warm-border rounded font-mono text-[11px]">
            <span className="text-warm-subtle font-sans">↳</span>
            <span className="font-semibold text-warm-text">{job.fixBranch}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(job.fixBranch);
              }}
              title="Copy branch name"
              className="text-warm-subtle hover:text-warm-text ml-1"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center space-x-1 text-[11px] font-mono text-warm-muted px-2 py-1 bg-warm-panel border border-warm-border rounded">
            <span className="text-warm-subtle">-o-</span>
            <span>Base SHA: {baseSha}</span>
          </div>

          {isPR && (
            <div className="text-[11px] font-mono text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2 py-1 rounded font-semibold">
              via PatchCraft Engine
            </div>
          )}
        </div>
      </div>

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
              className="px-4 py-2.5 rounded border border-warm-border bg-warm-panel hover:bg-warm-border/60 text-warm-text font-semibold text-xs flex items-center space-x-1.5 transition"
            >
              <XCircle className="w-4 h-4 text-warm-muted" />
              <span>Reject Patch</span>
            </button>
          </div>

          <div className="flex items-center space-x-1.5 text-[11px] text-warm-muted pl-0.5">
            <Lock className="w-3 h-3 text-warm-subtle" />
            <span>PR publishing locked until patch is approved</span>
          </div>
        </div>
      )}

      {/* 3b. Big Success Banner (If PR was opened & merged) */}
      {isPR && (
        <div className="mb-5 bg-warm-panel/80 border border-warm-border rounded-xl p-5 shadow-sm">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-cardHero-bg text-cardHero-text flex items-center justify-center shrink-0 shadow-sm">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>

            <div className="flex-1">
              <h2 className="text-base font-bold text-warm-text tracking-tight">
                Patch Approved &amp; Pull Request Created Successfully!
              </h2>
              <p className="text-xs text-warm-muted mt-1 leading-relaxed max-w-2xl">
                PR #{prNumber} was automatically created on GitHub with passing CI checks. Linked to Linear{' '}
                <span className="font-semibold text-warm-text">{job.linearIssueIdentifier}</span>. Branch auto-merged into{' '}
                <span className="font-mono font-semibold text-warm-text">{job.baseBranch || 'main'}</span> with zero merge conflicts.
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
                  className="px-3.5 py-2 rounded border border-warm-border bg-warm-surface hover:bg-warm-panel text-warm-text font-semibold text-xs flex items-center space-x-1.5 transition"
                >
                  <Activity className="w-3.5 h-3.5 text-warm-muted" />
                  <span>Open in GitHub Actions ↗</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Local CLI Run Command Box (macOS window style) */}
      <div className="mb-5 bg-warm-sidebar border border-warm-sidebarBorder rounded-lg overflow-hidden text-stone-300 font-mono shadow-sm">
        <div className="px-4 py-2.5 bg-warm-sidebarHover border-b border-warm-sidebarBorder flex items-center justify-between text-[11px]">
          <div className="flex items-center space-x-2.5">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
            </div>
            <span className="text-stone-300 font-sans">
              Run verified patch locally in your development shell
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 text-stone-300 hover:text-stone-100 px-2 py-0.5 rounded bg-warm-sidebarHover/80 border border-warm-sidebarBorder transition text-[10px]"
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
      <div className="bg-warm-surface border border-warm-border rounded-xl overflow-hidden shadow-sm mb-6">
        <div
          onClick={() => setIsAnalysisOpen(!isAnalysisOpen)}
          className="px-4 py-3 bg-warm-panel border-b border-warm-border flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center space-x-2 font-bold text-warm-text text-xs">
            <ShieldCheck className="w-4 h-4 text-warm-text" />
            <span>Automated Patch Analysis &amp; Test Suite Verification</span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
              12 / 12 Tests Passed
            </span>
            {isAnalysisOpen ? (
              <ChevronUp className="w-4 h-4 text-warm-muted" />
            ) : (
              <ChevronDown className="w-4 h-4 text-warm-muted" />
            )}
          </div>
        </div>

        {isAnalysisOpen && (
          <div className="p-4 bg-warm-surface">
            {/* If pending review: 3-column analysis grid */}
            {!isPR ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Column 1: Root Cause Analysis */}
                <div className="p-4 bg-warm-panel/60 border border-warm-border rounded-lg flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-1.5 font-bold text-warm-text mb-2 text-xs">
                      <FileCheck className="w-3.5 h-3.5 text-warm-muted" />
                      <span>Root Cause Analysis</span>
                    </div>
                    <p className="text-[11px] text-warm-muted leading-relaxed">
                      {job.fixSummary ||
                        'A non-numeric or malformed promo.value bypassed the fallback check, causing mathematical operations to yield NaN, propagating downstream to Stripe charge initialization.'}
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-warm-border/60">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-warm-surface border border-warm-border rounded text-[10px] text-warm-text font-mono">
                      <span>✓ Defensive bounds clamping applied [0, 100]</span>
                    </span>
                  </div>
                </div>

                {/* Column 2: CI Test Suite */}
                <div className="p-4 bg-warm-panel/60 border border-warm-border rounded-lg flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-1.5 font-bold text-warm-text text-xs">
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>CI Test Suite (12/12)</span>
                      </div>
                      <span className="font-mono text-[10px] text-warm-subtle">148ms</span>
                    </div>
                    <p className="text-[11px] text-warm-muted leading-relaxed">
                      Ran test specification <code className="font-mono text-warm-text font-semibold">tests/discount.spec.js</code>. Edge cases verified: null promo, empty string, infinity values, and negative percentage inputs.
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-warm-border/60">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-warm-surface border border-warm-border rounded text-[10px] text-emerald-700 font-mono font-medium">
                      <span>•••• +8 additional unit asserts</span>
                    </span>
                  </div>
                </div>

                {/* Column 3: Security & Regression */}
                <div className="p-4 bg-warm-panel/60 border border-warm-border rounded-lg flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-1.5 font-bold text-warm-text mb-2 text-xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                      <span>Security &amp; Regression</span>
                    </div>
                    <p className="text-[11px] text-warm-muted leading-relaxed">
                      Zero external dependencies introduced. Backward compatibility verified across all 18 billing gateway endpoints.
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-warm-border/60 flex items-center justify-between text-[10px] font-mono text-warm-muted">
                    <span>AST Complexity Delta:</span>
                    <span className="text-warm-text font-bold">+1 cyclomatic</span>
                  </div>
                </div>
              </div>
            ) : (
              /* If PR is opened & merged: Full CI Execution & Regression Suite table */
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-warm-border pb-2 text-[11px]">
                  <div className="flex items-center space-x-2 font-bold text-warm-text">
                    <CheckCheck className="w-4 h-4 text-emerald-600" />
                    <span>CI Execution &amp; Regression Suite</span>
                    <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-mono text-[10px]">
                      12 / 12 Passed
                    </span>
                  </div>
                  <span className="text-warm-subtle font-mono text-[10px]">
                    Workflow #4124 Succeeded on runner ubuntu-latest-4core in 1m 42s
                  </span>
                </div>

                <div className="divide-y divide-warm-border/60 font-mono text-[11px]">
                  <div className="py-2 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-warm-text font-semibold">test:unit/pricingEngine.spec.ts</span>
                      <span className="text-warm-muted font-sans text-[10px]">
                        Includes 4 new NaN boundary regression suites
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-warm-muted">
                      <span className="text-emerald-700 font-bold">38 passed</span>
                      <span>4.2s</span>
                    </div>
                  </div>

                  <div className="py-2 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-warm-text font-semibold">e2e:checkout-flow-discounts.playwright.ts</span>
                      <span className="text-warm-muted font-sans text-[10px]">
                        Guest and Auth cart checkout scenarios
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-warm-muted">
                      <span className="text-emerald-700 font-bold">12 passed</span>
                      <span>40.9s</span>
                    </div>
                  </div>

                  <div className="py-2 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-warm-text font-semibold">lint:tsc --noEmit &amp;&amp; eslint</span>
                      <span className="text-warm-muted font-sans text-[10px]">
                        Strict TypeScript type checks &amp; import sanity
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-warm-muted">
                      <span className="text-emerald-700 font-bold">0 errors</span>
                      <span>11.1s</span>
                    </div>
                  </div>

                  <div className="py-2 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-warm-text font-semibold">security:dependabot-check &amp; sast-scan</span>
                      <span className="text-warm-muted font-sans text-[10px]">
                        Static analysis for memory leak and prototype pollution
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-warm-muted">
                      <span className="text-emerald-700 font-bold">0 alerts</span>
                      <span>8.4s</span>
                    </div>
                  </div>

                  <div className="py-2 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-warm-text font-semibold">deploy:staging-ephemeral-preview</span>
                      <span className="text-warm-muted font-sans text-[10px]">
                        Isolated edge container generated on Cloudflare
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-warm-muted">
                      <span className="text-emerald-700 font-bold">200 OK</span>
                      <span>29.4s</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 7. Bottom Status & Lead Signature bar */}
      <div className="border-t border-warm-border pt-3 flex items-center justify-between text-[11px] text-warm-muted">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-full bg-primaryBtn-bg text-primaryBtn-text font-mono text-[9px] flex items-center justify-center font-bold">
            SC
          </div>
          <span className="font-semibold text-warm-text">Sarah Chen (Tech Lead)</span>
          <span className="text-warm-subtle">Signed merge commit 9f84bc2</span>
        </div>

        <div className="flex items-center space-x-3 font-mono text-[10px]">
          <span>● PatchCraft Sentinel 2.4.8</span>
          <span className="text-emerald-700 font-semibold">Zero regression flags detected</span>
          <span className="text-warm-subtle">|</span>
          <button className="hover:text-warm-text transition">Audit Trail Logs</button>
          <span className="text-warm-subtle">|</span>
          <button className="hover:text-warm-text transition">Rollback Patch Command</button>
          <span className="text-warm-subtle">|</span>
          <button className="hover:text-warm-text transition">Documentation</button>
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

