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
    <aside className="w-56 bg-warm-sidebar text-warm-sidebarText flex flex-col justify-between shrink-0 border-r border-warm-sidebarBorder select-none text-xs transition-colors duration-150">
      {/* Top Navigation */}
      <div className="py-4">
        <div className="px-4 text-[10px] font-bold text-warm-subtle tracking-wider uppercase mb-3">
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
                    ? 'bg-warm-sidebarHover text-warm-text dark:text-slate-100 shadow-sm border border-warm-sidebarBorder'
                    : 'text-warm-muted hover:text-warm-text dark:hover:text-slate-200 hover:bg-warm-sidebarHover/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${item.active ? 'text-amber-400' : 'text-warm-subtle'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Sync Engine Status Box */}
      <div className="p-3 m-3 bg-warm-sidebarHover/40 border border-warm-sidebarBorder rounded">
        <div className="flex items-center justify-between text-[11px] mb-1.5">
          <span className="text-warm-subtle">Sync Engine</span>
          <span className="text-emerald-400 font-medium">Active</span>
        </div>
        <div className="w-full bg-warm-sidebarHover h-1.5 rounded-full overflow-hidden mb-1.5">
          <div className="bg-amber-400/80 h-full w-2/3"></div>
        </div>
        <div className="text-[10px] text-warm-subtle font-mono truncate">
          Webhook queue live: 200 OK
        </div>
      </div>
    </aside>
  );
}
