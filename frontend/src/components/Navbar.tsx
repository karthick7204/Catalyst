'use client';

import React from 'react';
import { Search, Bell, HelpCircle, ChevronDown } from 'lucide-react';

interface NavbarProps {
  repoName: string;
}

export function Navbar({ repoName }: NavbarProps) {
  return (
    <nav className="h-14 border-b border-warm-border bg-warm-surface px-4 flex items-center justify-between text-xs sticky top-0 z-40">
      {/* Left: Logo & Repo Dropdown */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 font-bold text-sm tracking-tight text-warm-text pr-3 border-r border-warm-border">
          <div className="w-6 h-6 rounded bg-[#2a2420] text-[#f8f5ee] flex items-center justify-center text-xs font-black">
            P
          </div>
          <span>PatchCraft</span>
        </div>

        {/* Repo selector pill */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-warm-panel border border-warm-border rounded font-mono text-[11px] text-warm-text font-medium cursor-pointer hover:bg-warm-border/40 transition">
          <span>{repoName}</span>
          <ChevronDown className="w-3 h-3 text-warm-muted" />
        </div>

        {/* Integration status */}
        <div className="hidden md:flex items-center space-x-1.5 text-warm-muted pl-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span className="text-[11px]">Linear & GitHub connected</span>
        </div>
      </div>

      {/* Center: Search Box */}
      <div className="hidden lg:flex items-center max-w-sm w-full mx-4">
        <div className="w-full flex items-center justify-between bg-warm-panel border border-warm-border rounded px-3 py-1.5 text-warm-muted text-[11px]">
          <div className="flex items-center space-x-2">
            <Search className="w-3.5 h-3.5 text-warm-subtle" />
            <span>Filter issues, commits, or files...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] bg-warm-surface border border-warm-border rounded text-warm-subtle font-mono">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Actions & User Avatar */}
      <div className="flex items-center space-x-3">
        <button className="text-warm-muted hover:text-warm-text p-1 transition" title="Notifications">
          <Bell className="w-4 h-4" />
        </button>

        <button className="text-warm-muted hover:text-warm-text p-1 transition" title="Help">
          <HelpCircle className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-2 pl-2 border-l border-warm-border">
          <div className="w-7 h-7 rounded-full bg-stone-300 border border-warm-border overflow-hidden flex items-center justify-center font-bold text-xs text-stone-700">
            K
          </div>
        </div>
      </div>
    </nav>
  );
}
