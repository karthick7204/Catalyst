'use client';

import React, { useState } from 'react';
import { TaskJob } from '../types/job';
import { GitCommit, Search, RefreshCw } from 'lucide-react';

interface QueueSidebarProps {
  jobs: TaskJob[];
  selectedJobId: string | null;
  onSelectJob: (id: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function QueueSidebar({
  jobs,
  selectedJobId,
  onSelectJob,
  onRefresh,
  isRefreshing,
}: QueueSidebarProps) {
  const [filterTab, setFilterTab] = useState<'all' | 'review' | 'fixing' | 'merged'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const reviewCount = jobs.filter((j) => j.status === 'AWAITING_APPROVAL').length;
  const fixingCount = jobs.filter((j) => ['CLONING', 'ANALYZING', 'FIXING', 'QUEUED'].includes(j.status)).length;
  const mergedCount = jobs.filter((j) => ['PR_CREATED', 'APPROVED'].includes(j.status)).length;

  const filteredJobs = jobs.filter((job) => {
    // Tab filter
    if (filterTab === 'review' && job.status !== 'AWAITING_APPROVAL') return false;
    if (filterTab === 'fixing' && !['CLONING', 'ANALYZING', 'FIXING', 'QUEUED'].includes(job.status)) return false;
    if (filterTab === 'merged' && !['PR_CREATED', 'APPROVED'].includes(job.status)) return false;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = job.linearIssueIdentifier.toLowerCase().includes(q);
      const matchTitle = job.linearIssueTitle.toLowerCase().includes(q);
      const matchRepo = job.githubRepo.toLowerCase().includes(q);
      return matchId || matchTitle || matchRepo;
    }

    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AWAITING_APPROVAL':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-badge-reviewBg text-badge-reviewText border border-badge-reviewBorder flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Review Required</span>
          </span>
        );
      case 'PR_CREATED':
      case 'APPROVED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-badge-mergedBg text-badge-mergedText border border-badge-mergedBorder flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            <span>PR Created</span>
          </span>
        );
      case 'FIXING':
      case 'CLONING':
      case 'ANALYZING':
      case 'QUEUED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-badge-fixingBg text-badge-fixingText border border-badge-fixingBorder flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
            <span>Fixing</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-badge-failedBg text-badge-failedText border border-badge-failedBorder">
            Failed
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-warm-border text-warm-muted">
            {status}
          </span>
        );
    }
  };

  return (
    <aside className="w-80 bg-warm-panel border-r border-warm-border flex flex-col justify-between shrink-0 text-xs">
      <div>
        {/* Top Header */}
        <div className="p-3.5 border-b border-warm-border flex items-center justify-between">
          <div className="flex items-center space-x-2 font-bold text-warm-text">
            <span>Active Triages</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded font-mono text-[11px] font-semibold bg-warm-surface border border-warm-border text-warm-muted">
              {jobs.length} Active
            </span>
            <button
              onClick={onRefresh}
              className="text-warm-muted hover:text-warm-text p-1 transition"
              title="Refresh queue"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Input */}
        <div className="p-2.5 border-b border-warm-border">
          <div className="flex items-center justify-between bg-warm-surface border border-warm-border rounded px-2.5 py-1 text-warm-muted text-[11px]">
            <div className="flex items-center space-x-1.5 w-full">
              <Search className="w-3 h-3 text-warm-subtle shrink-0" />
              <input
                type="text"
                placeholder="Filter by ID, repo, title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-warm-text placeholder:text-warm-subtle w-full text-[11px]"
              />
            </div>
            <kbd className="px-1 text-[10px] bg-warm-panel border border-warm-border rounded text-warm-subtle font-mono">
              /
            </kbd>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center justify-between mt-2 pt-1 border-t border-warm-border/60 text-[11px] font-medium text-warm-muted">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-2 py-0.5 rounded transition ${
                filterTab === 'all' ? 'bg-[#1f1b18] text-[#f8f5ee] font-semibold' : 'hover:text-warm-text'
              }`}
            >
              All ({jobs.length})
            </button>
            <button
              onClick={() => setFilterTab('review')}
              className={`px-2 py-0.5 rounded transition ${
                filterTab === 'review' ? 'bg-[#1f1b18] text-[#f8f5ee] font-semibold' : 'hover:text-warm-text'
              }`}
            >
              Review ({reviewCount})
            </button>
            <button
              onClick={() => setFilterTab('fixing')}
              className={`px-2 py-0.5 rounded transition ${
                filterTab === 'fixing' ? 'bg-[#1f1b18] text-[#f8f5ee] font-semibold' : 'hover:text-warm-text'
              }`}
            >
              Fixing ({fixingCount})
            </button>
            <button
              onClick={() => setFilterTab('merged')}
              className={`px-2 py-0.5 rounded transition ${
                filterTab === 'merged' ? 'bg-[#1f1b18] text-[#f8f5ee] font-semibold' : 'hover:text-warm-text'
              }`}
            >
              Merged ({mergedCount})
            </button>
          </div>
        </div>

        {/* Card List */}
        <div className="overflow-y-auto max-h-[calc(100vh-210px)] p-2 space-y-2">
          {filteredJobs.length === 0 && (
            <div className="p-8 text-center text-warm-muted text-[11px]">
              <div className="w-8 h-8 rounded-full bg-warm-border/40 mx-auto flex items-center justify-center mb-2 text-warm-subtle">
                ✓
              </div>
              <p className="font-semibold text-warm-text">Queue Empty</p>
              <p className="text-[10px] text-warm-subtle mt-0.5">No matching tickets in queue.</p>
            </div>
          )}

          {filteredJobs.map((job) => {
            const isSelected = job.id === selectedJobId;
            return (
              <div
                key={job.id}
                onClick={() => onSelectJob(job.id)}
                className={`p-3 rounded-lg border transition cursor-pointer text-left ${
                  isSelected
                    ? 'bg-warm-surface border-[#1f1b18] shadow-sm ring-1 ring-[#1f1b18]/10'
                    : 'bg-warm-surface/80 border-warm-border hover:bg-warm-surface hover:border-warm-borderDark'
                }`}
              >
                {/* ID & Status */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-1.5 font-mono text-[11px] font-bold text-warm-text">
                    <span className="px-1.5 py-0.5 bg-warm-panel border border-warm-border rounded">
                      {job.linearIssueIdentifier}
                    </span>
                    <span className="text-[10px] text-warm-subtle font-normal">v3</span>
                  </div>
                  {getStatusBadge(job.status)}
                </div>

                {/* Title */}
                <h4 className="text-[12px] font-medium text-warm-text line-clamp-2 leading-snug mb-2">
                  {job.linearIssueTitle}
                </h4>

                {/* Metadata Row */}
                <div className="flex items-center justify-between text-[10px] text-warm-muted pt-1 border-t border-warm-border/50">
                  <span className="flex items-center space-x-1 truncate max-w-[170px]">
                    <GitCommit className="w-3 h-3 text-warm-subtle shrink-0" />
                    <span className="truncate">{job.githubRepo}</span>
                  </span>

                  <span className="px-1.5 py-0.5 bg-warm-panel border border-warm-border rounded font-mono text-warm-muted">
                    +2 -2
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Footer Status */}
      <div className="p-3 border-t border-warm-border bg-warm-surface/60 flex items-center justify-between text-[10px] text-warm-muted font-mono">
        <span>Worker PID: 4091</span>
        <span className="flex items-center space-x-1 text-emerald-600 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Daemon Healthy</span>
        </span>
      </div>
    </aside>
  );
}
