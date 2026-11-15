'use client';

import React from 'react';
import { Inbox, GitMerge, FileCode2, Activity, Settings } from 'lucide-react';

export function Sidebar() {
  const menuItems = [
    { label: 'Triage Inbox', icon: Inbox, active: true },
    { label: 'Automated Patches', icon: GitMerge, active: false },
    { label: 'Diff Inspector', icon: FileCode2, active: false },
    { label: 'CI Health & Runs', icon: Activity, active: false },
    { label: 'Workspace Settings', icon: Settings, active: false },
  ];

  return (
    <aside className="w-56 bg-warm-sidebar dark:bg-[#070a0f] text-slate-300 flex flex-col justify-between shrink-0 border-r border-warm-sidebarBorder dark:border-[#1a2333] select-none text-xs transition-colors duration-150">
      {/* Top Navigation */}
      <div className="py-4">
        <div className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-400 tracking-wider uppercase mb-3">
          Workspaces
        </div>

        <nav className="space-y-0.5 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded text-left transition font-medium ${
                  item.active
                    ? 'bg-warm-sidebarHover dark:bg-[#162032] text-white shadow-sm border border-warm-sidebarBorder dark:border-[#2a374d]'
                    : 'text-slate-300 dark:text-slate-300 hover:text-white dark:hover:text-white hover:bg-warm-sidebarHover/60 dark:hover:bg-[#101726]'
                }`}
              >
                <Icon className={`w-4 h-4 ${item.active ? 'text-amber-400' : 'text-slate-400 dark:text-slate-400'}`} />
                <span className={item.active ? 'text-white font-semibold' : 'text-slate-300 dark:text-slate-300'}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Sync Engine Status Box */}
      <div className="p-3 m-3 bg-warm-sidebarHover/40 dark:bg-[#0f1624] border border-warm-sidebarBorder dark:border-[#1a2333] rounded">
        <div className="flex items-center justify-between text-[11px] mb-1.5">
          <span className="text-slate-300 dark:text-slate-300 font-medium">Sync Engine</span>
          <span className="text-emerald-400 font-medium">Active</span>
        </div>
        <div className="w-full bg-warm-sidebarHover dark:bg-[#1a2333] h-1.5 rounded-full overflow-hidden mb-1.5">
          <div className="bg-amber-400/80 h-full w-2/3"></div>
        </div>
        <div className="text-[10px] text-slate-400 dark:text-slate-400 font-mono truncate">
          Webhook queue live: 200 OK
        </div>
      </div>
    </aside>
  );
}
