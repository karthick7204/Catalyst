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
    <aside className="w-56 bg-warm-sidebar text-stone-300 flex flex-col justify-between shrink-0 border-r border-[#2d2723] select-none text-xs">
      {/* Top Navigation */}
      <div className="py-4">
        <div className="px-4 text-[10px] font-bold text-stone-500 tracking-wider uppercase mb-3">
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
                    ? 'bg-[#2f2723] text-stone-100 shadow-sm border border-[#3e342f]'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-[#27211d]'
                }`}
              >
                <Icon className={`w-4 h-4 ${item.active ? 'text-amber-400' : 'text-stone-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Sync Engine Status Box */}
      <div className="p-3 m-3 bg-[#171412] border border-[#2d2723] rounded">
        <div className="flex items-center justify-between text-[11px] mb-1.5">
          <span className="text-stone-400">Sync Engine</span>
          <span className="text-emerald-400 font-medium">Active</span>
        </div>
        <div className="w-full bg-[#27211d] h-1.5 rounded-full overflow-hidden mb-1.5">
          <div className="bg-amber-400/80 h-full w-2/3"></div>
        </div>
        <div className="text-[10px] text-stone-500 font-mono truncate">
          Webhook queue live: 200 OK
        </div>
      </div>
    </aside>
  );
}
