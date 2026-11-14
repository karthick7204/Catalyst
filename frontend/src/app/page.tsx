'use client';

import React, { useState, useEffect } from 'react';
import { TaskJob } from '../types/job';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { QueueSidebar } from '../components/QueueSidebar';
import { ReviewWorkspace } from '../components/ReviewWorkspace';
import { EmptyState } from '../components/EmptyState';

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
  const activeRepo = selectedJob ? selectedJob.githubRepo : 'acme-corp / web-checkout';

  return (
    <div className="h-screen flex flex-col bg-warm-bg text-warm-text font-sans overflow-hidden">
      {/* Top Navigation */}
      <Navbar repoName={activeRepo} />

      {/* 3-Column Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Column 1: Workspaces Sidebar */}
        <Sidebar />

        {/* Column 2: Active Triages / Queue Dispatch */}
        <QueueSidebar
          jobs={jobs}
          selectedJobId={selectedJob?.id || null}
          onSelectJob={(id) => setSelectedJobId(id)}
          onRefresh={fetchJobs}
          isRefreshing={isRefreshing}
        />

        {/* Column 3: Main Canvas (Review Workspace or Empty State) */}
        {selectedJob ? (
          <ReviewWorkspace job={selectedJob} onRefresh={fetchJobs} />
        ) : (
          <EmptyState
            repoName={activeRepo}
            onSync={fetchJobs}
            isSyncing={isRefreshing}
          />
        )}
      </div>
    </div>
  );
}
