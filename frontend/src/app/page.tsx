'use client';

import React, { useState, useEffect } from 'react';
import { TaskJob } from '../types/job';
import { Header } from '../components/Header';
import { TaskDetail } from '../components/TaskDetail';
import { Code2, Hash, Github, CircleDashed } from 'lucide-react';

export default function DashboardPage() {
  const [jobs, setJobs] = useState<TaskJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchJobs = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      const jobList: TaskJob[] = data.jobs || [];
      setJobs(jobList);

      if (jobList.length > 0 && !selectedJobId) {
        setSelectedJobId(jobList[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch jobs', err);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 3500);
    return () => clearInterval(interval);
  }, []);

  const selectedJob = jobs.find((j) => j.id === selectedJobId) || jobs[0];
  const pendingCount = jobs.filter((j) => j.status === 'AWAITING_APPROVAL').length;

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f17]">
      <Header
        onRefresh={fetchJobs}
        isRefreshing={isRefreshing}
        totalJobs={jobs.length}
        pendingCount={pendingCount}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Tasks List */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Linear Bug Tasks
            </h2>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
              {jobs.length}
            </span>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[calc(100vh-170px)] pr-1">
            {isLoading && (
              <div className="p-8 text-center text-slate-500 text-sm">
                <CircleDashed className="w-6 h-6 animate-spin mx-auto text-emerald-500 mb-2" />
                <p>Loading agent tasks...</p>
              </div>
            )}

            {!isLoading && jobs.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-lg">
                No bug tickets captured yet.
              </div>
            )}

            {jobs.map((job) => {
              const isSelected = job.id === (selectedJob?.id);
              const isAwaiting = job.status === 'AWAITING_APPROVAL';
              const isPR = job.status === 'PR_CREATED';

              let statusColor = 'bg-slate-800 text-slate-400 border-slate-700';
              if (isAwaiting) statusColor = 'bg-amber-500/10 text-amber-300 border-amber-500/30';
              if (isPR) statusColor = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';

              return (
                <div
                  key={job.id}
                  onClick={() => setSelectedJobId(job.id)}
                  className={`cursor-pointer p-4 rounded-xl border transition ${
                    isSelected
                      ? 'bg-slate-800/90 border-emerald-500/60 shadow-lg shadow-emerald-500/5'
                      : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-slate-300 flex items-center space-x-1">
                      <Hash className="w-3 h-3 text-slate-500" />
                      <span>{job.linearIssueIdentifier}</span>
                    </span>

                    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${statusColor}`}>
                      {job.status === 'AWAITING_APPROVAL' ? 'Needs Review' : job.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-white line-clamp-1 mb-1.5">
                    {job.linearIssueTitle}
                  </h3>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="truncate max-w-[200px] flex items-center space-x-1">
                      <Github className="w-3 h-3 text-slate-500" />
                      <span>{job.githubRepo}</span>
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      {new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Detailed Review & Approval Panel */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          {selectedJob ? (
            <TaskDetail job={selectedJob} onApprovalDone={fetchJobs} />
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-12 min-h-[500px] flex flex-col justify-center items-center text-slate-500">
              <Code2 className="w-12 h-12 mb-3 text-slate-600" />
              <p className="text-sm">Select a Linear task to review the fix and inspect the git diff</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

